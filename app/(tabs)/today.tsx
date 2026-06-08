import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, Pressable, RefreshControl,
  Modal, Animated as RNAnimated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CommitmentRow } from '@/components/CommitmentRow';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';

interface Commitment { id: string; label: string; checked: boolean; checked_at?: string }
interface TodayData {
  challengeName: string; dayNumber: number; daysRemaining: number;
  streak: number; freezeAvailable: boolean; commitments: Commitment[];
  logId?: string; allComplete: boolean; challengeId?: string;
}

export default function TodayScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { track } = useAnalytics();
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const startTime = useRef(Date.now());

  const fetchToday = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const end = trackApiLatency('fetch_today');
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: challenge, error: cErr } = await supabase
        .from('challenges').select('*').eq('user_id', user.id).eq('status', 'active').single();
      if (cErr || !challenge) { setData(null); return; }

      const { data: snap } = await supabase.from('streak_snapshots')
        .select('current_streak, freezes_used_this_week').eq('challenge_id', challenge.id).single();
      const { data: log } = await supabase.from('day_logs')
        .select('*').eq('challenge_id', challenge.id).eq('log_date', today).maybeSingle();

      const rawCommitments: string[] = Array.isArray(challenge.commitments) ? challenge.commitments : [];
      const checks: Record<string, { checked: boolean; checked_at?: string }> = log?.commitment_checks ?? {};
      const commitments: Commitment[] = rawCommitments.map((label, i) => {
        const key = String(i); const c = checks[key];
        return { id: key, label, checked: c?.checked ?? false, checked_at: c?.checked_at };
      });
      const start = new Date(challenge.start_date);
      const dayNum = Math.ceil((Date.now() - start.getTime()) / 86400000);
      const remaining = Math.max(0, challenge.duration_days - dayNum);
      const freezeRule = challenge.freeze_rule_per_days ?? 7;
      const freezeUsed = (snap?.freezes_used_this_week ?? 0);
      setData({
        challengeName: challenge.name, dayNumber: dayNum, daysRemaining: remaining,
        streak: snap?.current_streak ?? 0, freezeAvailable: freezeUsed < Math.floor(freezeRule / 7),
        commitments, logId: log?.id, allComplete: log?.all_complete ?? false, challengeId: challenge.id,
      });
      trackScreenLoad('TodayScreen', startTime.current);
    } catch (e) {
      captureException(e as Error, { screen: 'TodayScreen', action: 'fetchToday' });
      setError(true);
    } finally { end(); setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { track('screen_today_viewed'); fetchToday(); }, [fetchToday]);

  const toggleCommitment = async (item: Commitment) => {
    if (!data || !user?.id) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    track('commitment_toggled', { id: item.id, checked: !item.checked });
    const now = new Date().toISOString();
    const updated = data.commitments.map(c =>
      c.id === item.id ? { ...c, checked: !c.checked, checked_at: !c.checked ? now : undefined } : c
    );
    const checks: Record<string, { checked: boolean; checked_at?: string }> = {};
    updated.forEach(c => { checks[c.id] = { checked: c.checked, checked_at: c.checked_at }; });
    const allDone = updated.every(c => c.checked);
    const today = new Date().toISOString().split('T')[0];
    const dayNum = data.dayNumber;
    const upsertPayload = {
      challenge_id: data.challengeId, user_id: user.id, log_date: today,
      day_number: dayNum, commitment_checks: checks, all_complete: allDone,
      status: allDone ? 'complete' : 'partial', updated_at: now,
      ...(data.logId ? {} : { created_at: now }),
    };
    const { data: upserted, error: uErr } = data.logId
      ? await supabase.from('day_logs').update(upsertPayload).eq('id', data.logId).select('id').single()
      : await supabase.from('day_logs').insert(upsertPayload).select('id').single();
    if (uErr) { captureException(uErr, { screen: 'TodayScreen', action: 'toggleCommitment' }); return; }
    setData(prev => prev ? { ...prev, commitments: updated, allComplete: allDone, logId: prev.logId ?? upserted?.id } : prev);
    if (allDone) { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setShowCelebration(true); }
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><LoadingSkeleton variant="list" /></SafeAreaView>;
  if (error) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><EmptyState icon="alert-circle" title="Something went wrong" subtitle="Pull down to retry" /></SafeAreaView>;
  if (!data) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><EmptyState icon="flag" title="No active challenge" subtitle="Start a challenge to begin tracking" /></SafeAreaView>;

  const progress = Math.max(0, Math.min(1, 1 - data.daysRemaining / (data.daysRemaining + data.dayNumber)));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={data.commitments}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchToday(); }} tintColor={colors.accent} />}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.delay(0)}>
            <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 8 }}>
              <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 48, color: colors.accent, lineHeight: 52 }}>
                DAY {data.dayNumber}
              </Text>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                {data.challengeName}
              </Text>
            </View>
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: colors.accent, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 28, color: colors.accent }}>{data.streak ?? 0}</Text>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 10, color: colors.textSecondary }}>streak</Text>
              </View>
            </View>
            <View style={{ marginHorizontal: 24, marginBottom: 12 }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceDark, overflow: 'hidden' }}>
                <View style={{ height: 6, width: `${progress * 100}%`, borderRadius: 3, backgroundColor: colors.accent }} />
              </View>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                {data.daysRemaining} days remaining
              </Text>
            </View>
            <View style={{ marginHorizontal: 24, marginBottom: 16 }}>
              <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.surface, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: colors.textSecondary }}>
                  {data.freezeAvailable ? '❄️ Freeze available' : 'No freeze this week'}
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: colors.textSecondary, marginHorizontal: 24, marginBottom: 8 }}>
              {"Today's commitments"}
            </Text>
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(50 * index)}>
            <CommitmentRow item={item} onToggle={() => toggleCommitment(item)} />
          </Animated.View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
        style={{ flex: 1 }}
      />
      {showCelebration && <CelebrationOverlay onDismiss={() => setShowCelebration(false)} streak={data.streak + 1} />}
    </SafeAreaView>
  );
}
