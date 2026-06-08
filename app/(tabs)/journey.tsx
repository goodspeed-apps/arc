import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Plus, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSubscription } from '@/hooks/useSubscription';
import { usePaywall } from '@/hooks/usePaywall';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { JourneyStatsHeader } from '@/components/journey/JourneyStatsHeader';
import { ChallengeCard } from '@/components/journey/ChallengeCard';
import { BadgeGallery } from '@/components/journey/BadgeGallery';
import { InsightCard } from '@/components/journey/InsightCard';

type Challenge = { id: string; name: string; status: string; duration_days: number; start_date: string; completed_at: string | null };
type Badge = { id: string; badge_slug: string; earned_at: string; is_featured: boolean };
type Insight = { worst_day_of_week: string; nudge_copy: string; day_of_week_miss_rates: Record<string, number> };
type Stats = { total_completed: number; total_days: number; longest_streak: number };

export default function JourneyScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { track } = useAnalytics();
  const { isPremium } = useSubscription();
  const { openPaywall } = usePaywall();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [stats, setStats] = useState<Stats>({ total_completed: 0, total_days: 0, longest_streak: 0 });

  const fetchData = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const end = trackApiLatency('journey_fetch');
    try {
      const start = Date.now();
      const [ch, bg, ins, ss] = await Promise.all([
        supabase.from('challenges').select('id,name,status,duration_days,start_date,completed_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('badges').select('id,badge_slug,earned_at,is_featured').eq('user_id', user.id).order('earned_at', { ascending: false }),
        isPremium ? supabase.from('weekly_insights').select('worst_day_of_week,nudge_copy,day_of_week_miss_rates').eq('user_id', user.id).order('week_start_date', { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null, error: null }),
        supabase.from('streak_snapshots').select('longest_streak,total_completed_days').eq('user_id', user.id),
      ]);
      if (ch.error) throw ch.error;
      if (bg.error) throw bg.error;
      if (ins.error) throw ins.error;
      setChallenges(ch.data ?? []);
      setBadges(bg.data ?? []);
      setInsight(ins.data ?? null);
      const completed = (ch.data ?? []).filter(c => c.status === 'completed').length;
      const totalDays = (ss.data ?? []).reduce((a, s) => a + (s.total_completed_days ?? 0), 0);
      const longestStreak = Math.max(0, ...(ss.data ?? []).map(s => s.longest_streak ?? 0));
      setStats({ total_completed: completed, total_days: totalDays, longest_streak: longestStreak });
      trackScreenLoad('JourneyScreen', start);
    } catch (e) {
      captureException(e as Error, { screen: 'JourneyScreen', action: 'fetchData' });
    } finally {
      setLoading(false);
      setRefreshing(false);
      end();
    }
  }, [user?.id, isPremium]);

  useEffect(() => { track('screen_journey_viewed'); fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleNewChallenge = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    track('journey_new_challenge_tapped');
    const active = challenges.filter(c => c.status === 'active');
    if (!isPremium && active.length > 0) { openPaywall('multiple_challenges'); return; }
    router.push('/(modal)/paywall');
  };

  const active = challenges.filter(c => c.status === 'active');
  const completed = challenges.filter(c => c.status === 'completed');

  const sections = [
    { key: 'header', data: [stats] },
    ...(active.length ? [{ key: 'active', data: active }] : []),
    ...(badges.length ? [{ key: 'badges', data: badges }] : []),
    ...(completed.length ? [{ key: 'completed', data: completed }] : []),
    ...(insight ? [{ key: 'insight', data: [insight] }] : []),
  ];

  const flatItems: Array<{ type: string; item: unknown; index: number }> = [];
  sections.forEach(s => s.data.forEach((item, i) => flatItems.push({ type: s.key, item, index: i })));

  if (loading) return <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}><LoadingSkeleton variant="list" /></SafeAreaView>;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={flatItems}
        keyExtractor={(_, i) => String(i)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={<Text style={[s.title, { color: colors.text, fontFamily: 'PlusJakartaSans_700Bold' }]}>Journey</Text>}
        ListEmptyComponent={<EmptyState icon="flag" title="Your record starts with your first finish." description="Complete a challenge to see it here." action={{ label: 'Start a Challenge', onPress: handleNewChallenge }} />}
        renderItem={({ item: row, index }) => {
          const { type, item, index: idx } = row as { type: string; item: unknown; index: number };
          return (
            <Animated.View entering={FadeInDown.delay(50 * index).duration(320)}>
              {type === 'header' && <JourneyStatsHeader stats={item as Stats} />}
              {type === 'active' && <ChallengeCard challenge={item as Challenge} variant="active" onPress={() => { track('journey_active_card_tapped'); router.push(`/(tabs)/journey`); }} />}
              {type === 'badges' && idx === 0 && <BadgeGallery badges={badges} isPremium={isPremium} />}
              {type === 'completed' && <ChallengeCard challenge={item as Challenge} variant="completed" onPress={() => { track('journey_completed_card_tapped'); }} />}
              {type === 'insight' && <InsightCard insight={item as Insight} onPress={() => track('journey_insight_tapped')} />}
            </Animated.View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
      />
      <Pressable
        onPress={handleNewChallenge}
        accessibilityLabel="Start a new challenge"
        accessibilityHint="Opens the challenge picker"
        style={({ pressed }) => [s.fab, { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
      >
        <Plus color={colors.textOnPrimary} size={24} />
      </Pressable>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: 28, marginTop: 16, marginBottom: 8 },
  fab: { position: 'absolute', bottom: 28, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 6 },
});
