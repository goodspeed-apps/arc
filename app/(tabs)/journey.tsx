import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, RefreshControl, StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Plus } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePaywall } from '@/hooks/usePaywall';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { JourneyStatsHeader } from '@/components/JourneyStatsHeader';
import { ChallengeRowCard } from '@/components/ChallengeRowCard';
import { BadgeGallery } from '@/components/BadgeGallery';
import { WeeklyInsightCard } from '@/components/WeeklyInsightCard';
import type { Challenge, Badge } from '@/types/app-types';

interface WeeklyInsight { id: string; worst_day_of_week: string; nudge_copy: string; day_of_week_miss_rates: Record<string, number>; }
interface DisciplineStats { totalFinished: number; totalDaysLogged: number; longestStreak: number; }

export default function JourneyScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { track } = useAnalytics();
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const { openPaywall } = usePaywall();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState<DisciplineStats>({ totalFinished: 0, totalDaysLogged: 0, longestStreak: 0 });
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const start = Date.now();
    try {
      const done = trackApiLatency('journey_fetch');
      const [chRes, bdRes, ssRes, wiRes] = await Promise.all([
        supabase.from('challenges').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('badges').select('*').eq('user_id', user.id).order('earned_at', { ascending: false }),
        supabase.from('streak_snapshots').select('longest_streak,total_completed_days').eq('user_id', user.id),
        supabase.from('weekly_insights').select('*').eq('user_id', user.id).order('computed_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      done?.();
      if (chRes.error) throw chRes.error;
      if (bdRes.error) throw bdRes.error;
      setChallenges((chRes.data as Challenge[]) ?? []);
      setBadges((bdRes.data as Badge[]) ?? []);
      const longestStreak = Math.max(0, ...(ssRes.data ?? []).map((s: { longest_streak: number | null }) => (s.longest_streak ?? 0)));
      const totalDaysLogged = (ssRes.data ?? []).reduce((acc: number, s: { total_completed_days: number | null }) => acc + (s.total_completed_days ?? 0), 0);
      const totalFinished = ((chRes.data as Challenge[]) ?? []).filter(c => c.status === 'completed').length;
      setStats({ totalFinished, totalDaysLogged, longestStreak });
      setInsight(wiRes.data as WeeklyInsight | null);
      trackScreenLoad('JourneyScreen', start);
    } catch (err) {
      captureException(err as Error, { screen: 'JourneyScreen', action: 'fetchData' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { track('screen_journey_viewed'); fetchData(); }, [fetchData]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const handleNewChallenge = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    track('journey_new_challenge_tapped');
    const hasActive = challenges.some(c => c.status === 'active');
    if (hasActive && !isSubscribed) { openPaywall('multiple_challenges'); return; }
    router.push('/(modal)/paywall');
  };

  const active = challenges.filter(c => c.status === 'active');
  const completed = challenges.filter(c => c.status === 'completed');

  const sections = [
    { key: 'header', data: [stats] },
    ...(active.length ? [{ key: 'active', data: active }] : []),
    ...(badges.length ? [{ key: 'badges', data: badges }] : []),
    ...(completed.length ? [{ key: 'completed', data: completed }] : []),
    ...(insight && isSubscribed ? [{ key: 'insight', data: [insight] }] : []),
  ];

  type FlatItem = { _section: string; _idx: number; item: Challenge | Badge | DisciplineStats | WeeklyInsight };

  const flatItems: FlatItem[] = sections.flatMap(s =>
    s.data.map((item, _idx) => ({ _section: s.key, _idx, item: item as FlatItem['item'] }))
  );

  if (loading) return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}><LoadingSkeleton variant="list" /></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {challenges.length === 0
        ? <EmptyState icon="flag" title="Your record starts with your first finish." description="Complete a challenge to build your discipline history." action={{ label: 'Start a Challenge', onPress: handleNewChallenge }} />
        : (
          <FlatList
            data={flatItems}
            keyExtractor={item => `${item._section}-${item._idx}`}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
            contentContainerStyle={styles.list}
            renderItem={({ item: row, index }) => (
              <Animated.View entering={FadeInDown.delay(50 * index).springify()}>
                {row._section === 'header' && <JourneyStatsHeader stats={row.item as DisciplineStats} />}
                {(row._section === 'active' || row._section === 'completed') && (
                  <ChallengeRowCard challenge={row.item as Challenge} isActive={row._section === 'active'} onPress={() => track('journey_challenge_tapped', { id: (row.item as Challenge).id })} />
                )}
                {row._section === 'badges' && <BadgeGallery badges={badges} isPremium={isSubscribed} index={row._idx} />}
                {row._section === 'insight' && <WeeklyInsightCard insight={row.item as WeeklyInsight} />}
              </Animated.View>
            )}
          />
        )}
      <Pressable
        onPress={handleNewChallenge}
        accessibilityLabel="Start a new challenge"
        accessibilityHint="Opens the challenge picker"
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <Plus size={28} color={colors.textOnPrimary} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { paddingBottom: 100, paddingHorizontal: 16 },
  fab: { position: 'absolute', bottom: 28, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
});
