import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, FlatList,
  RefreshControl, Platform, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeColors } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChallengeDayTile } from '@/components/ChallengeDayTile';
import { ChallengStatsRow } from '@/components/ChallengeStatsRow';
import { Calendar, Clock, Trophy, ChevronLeft } from 'lucide-react-native';

type DayLog = { id: string; log_date: string; day_number: number; status: string; freeze_applied: boolean; commitment_checks: Record<string, boolean> };
type Challenge = { id: string; name: string; category: string; duration_days: number; start_date: string; end_date: string; status: string; commitments: string[]; reminder_time: string | null };
type Streak = { current_streak: number; longest_streak: number; total_completed_days: number; total_missed_days: number; freezes_used_this_week: number };

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { user } = useAuth();
  const { track } = useAnalytics();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [dayLogs, setDayLogs] = useState<DayLog[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayLog | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id || !id) { setLoading(false); return; }
    const start = Date.now();
    try {
      const end = trackApiLatency('challenge_detail', start);
      const [{ data: c, error: ce }, { data: logs, error: le }, { data: snap, error: se }] = await Promise.all([
        supabase.from('challenges').select('*').eq('id', id).single(),
        supabase.from('day_logs').select('*').eq('challenge_id', id).order('day_number'),
        supabase.from('streak_snapshots').select('*').eq('challenge_id', id).order('computed_at', { ascending: false }).limit(1).single(),
      ]);
      end();
      if (ce) throw ce; if (le) throw le;
      setChallenge(c); setDayLogs(logs ?? []);
      if (!se && snap) setStreak(snap);
      if (c?.reminder_time) { const d = new Date(); const [h, m] = c.reminder_time.split(':'); d.setHours(+h, +m); setReminderTime(d); }
      trackScreenLoad('ChallengeDetail', start);
      track('challenge_detail_viewed', { challenge_id: id, status: c?.status });
    } catch (e) {
      captureException(e as Error, { screen: 'ChallengeDetail', action: 'fetchData' });
      setError('Failed to load challenge.');
    } finally { setLoading(false); setRefreshing(false); }
  }, [user?.id, id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDayTap = (log: DayLog) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedDay(log); };
  const handleReminderSave = async (d: Date) => {
    setShowTimePicker(false); setReminderTime(d);
    const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    track('reminder_time_updated', { challenge_id: id });
    const { error: ue } = await supabase.from('challenges').update({ reminder_time: time }).eq('id', id!);
    if (ue) captureException(ue, { screen: 'ChallengeDetail', action: 'saveReminder' });
  };

  const pct = challenge ? Math.round(((streak?.total_completed_days ?? 0) / (challenge.duration_days ?? 1)) * 100) : 0;
  const todayStr = new Date().toISOString().split('T')[0];

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><LoadingSkeleton variant="list" /></SafeAreaView>;
  if (error || !challenge) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><EmptyState icon="alert-circle" title="Challenge not found" subtitle={error ?? ''} /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Go back" accessibilityHint="Navigate to previous screen" style={{ marginRight: 12, minHeight: 44, minWidth: 44, justifyContent: 'center' }}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold' }} numberOfLines={1}>{challenge.name}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Inter_400Regular' }}>{challenge.start_date} → {challenge.end_date}</Text>
          </View>
          <View style={{ backgroundColor: challenge.status === 'completed' ? colors.success : challenge.status === 'abandoned' ? colors.error : colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ color: colors.textOnPrimary, fontSize: 11, fontFamily: 'Inter_400Regular' }}>{challenge.duration_days}d</Text>
          </View>
        </View>

        <FlatList
          data={dayLogs}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
          numColumns={7}
          columnWrapperStyle={{ flexWrap: 'wrap' }}
          ListHeaderComponent={
            <View>
              <ChallengStatsRow streak={streak} colors={colors} />
              <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 6 }}>Progress to finish line</Text>
                <View style={{ height: 8, backgroundColor: colors.surfaceSecondary, borderRadius: 4 }}>
                  <View style={{ height: 8, width: `${pct}%`, backgroundColor: colors.primary, borderRadius: 4 }} />
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4, textAlign: 'right' }}>{pct}% · ends {challenge.end_date}</Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular', paddingHorizontal: 16, paddingBottom: 6 }}>Activity</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(30 * index).duration(300)} style={{ width: '14.28%', padding: 2 }}>
              <ChallengeDayTile log={item} today={todayStr} onPress={() => handleDayTap(item)} />
            </Animated.View>
          )}
          ListFooterComponent={
            <View style={{ padding: 16, gap: 12 }}>
              <Pressable onPress={() => setShowTimePicker(true)} accessibilityLabel="Edit reminder time" accessibilityHint="Opens time picker to change daily reminder" style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border }}>
                <Clock size={18} color={colors.primary} style={{ marginRight: 10 }} />
                <Text style={{ color: colors.text, fontFamily: 'Inter_400Regular', flex: 1 }}>Daily Reminder</Text>
                <Text style={{ color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>{reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </Pressable>
              {challenge.status === 'completed' && (
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); track('view_proof_card_tapped', { challenge_id: id }); router.push(`/(tabs)/today/proof/${id}`); }} accessibilityLabel="View Proof Card" accessibilityHint="Opens your challenge completion proof card" style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                  <Trophy size={18} color={colors.textOnPrimary} />
                  <Text style={{ color: colors.textOnPrimary, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>View Proof Card</Text>
                </Pressable>
              )}
            </View>
          }
        />

        {showTimePicker && (
          <Modal transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
            <Pressable style={{ flex: 1, backgroundColor: colors.shadow }} onPress={() => setShowTimePicker(false)} accessibilityLabel="Dismiss time picker" accessibilityHint="Closes the reminder time picker">
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
                <DateTimePicker value={reminderTime} mode="time" display="spinner" onChange={(_, d) => d && handleReminderSave(d)} textColor={colors.text} />
              </View>
            </Pressable>
          </Modal>
        )}

        {selectedDay && (
          <Modal transparent animationType="fade" onRequestClose={() => setSelectedDay(null)}>
            <Pressable style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.shadow }} onPress={() => setSelectedDay(null)} accessibilityLabel="Dismiss day detail" accessibilityHint="Closes the day log detail">
              <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, width: '80%', borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.text, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, marginBottom: 8 }}>Day {selectedDay.day_number} · {selectedDay.log_date}</Text>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular' }}>Status: {selectedDay.status}{selectedDay.freeze_applied ? ' ❄️ Freeze used' : ''}</Text>
                {Object.entries(selectedDay.commitment_checks ?? {}).map(([k, v]) => (
                  <Text key={k} style={{ color: v ? colors.success : colors.textMuted, fontFamily: 'Inter_400Regular', marginTop: 4 }}>{v ? '✓' : '○'} {k}</Text>
                ))}
              </View>
            </Pressable>
          </Modal>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
