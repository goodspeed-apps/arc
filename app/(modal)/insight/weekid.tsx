import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { WeeklyInsightCharts } from '@/components/WeeklyInsightCharts';
import { BarChart2, X } from 'lucide-react-native';

type InsightData = {
  day_of_week_miss_rates: Record<string, number>;
  rolling_7day_completion_rate: number[];
  worst_day_of_week: string;
  nudge_copy: string;
  challenge_breakdown: Record<string, number>;
};

export default function InsightDetailScreen() {
  const { weekId } = useLocalSearchParams<{ weekId: string }>();
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const { state: sub } = useSubscription();
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsight = useCallback(async () => {
    if (!weekId) { setLoading(false); return; }
    const start = Date.now();
    try {
      const done = trackApiLatency('fetch_weekly_insight');
      const { data: row, error: err } = await supabase
        .from('weekly_insights')
        .select('day_of_week_miss_rates,rolling_7day_completion_rate,worst_day_of_week,nudge_copy,challenge_breakdown')
        .eq('id', weekId)
        .single();
      done?.();
      if (err) throw err;
      setData(row as InsightData);
      setError(null);
      trackScreenLoad('InsightDetail', start);
      track('insight_detail_viewed', { weekId });
    } catch (e) {
      captureException(e as Error, { screen: 'InsightDetail', action: 'fetchInsight' });
      setError('Could not load your insight.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weekId]);

  useEffect(() => { fetchInsight(); }, [fetchInsight]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchInsight(); }, [fetchInsight]);

  if (!sub?.isSubscribed) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState icon={<BarChart2 color={colors.primary} size={40} />} title="Premium Feature" description="Upgrade to unlock weekly pattern insights." ctaLabel="See Plans" onCta={() => router.replace('/(modal)/paywall')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 22, color: colors.text }}>Your Pattern</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close insight" accessibilityHint="Dismiss this screen" style={{ padding: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <X size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ padding: 20, gap: 16 }}>
          {[0,1,2,3].map(i => <LoadingSkeleton key={i} width="100%" height={64} />)}
        </View>
      ) : error ? (
        <EmptyState icon={<BarChart2 color={colors.error} size={40} />} title="Analysis Failed" description={error} ctaLabel="Retry" onCta={() => { setLoading(true); fetchInsight(); }} />
      ) : !data ? (
        <EmptyState icon={<BarChart2 color={colors.textSecondary} size={40} />} title="Not Enough Data" description="Keep logging to unlock weekly pattern insights." />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
          <Animated.View entering={FadeInDown.delay(0).springify()} style={{ margin: 20, padding: 16, borderRadius: 16, backgroundColor: colors.surface }}>
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>TOP INSIGHT</Text>
            <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 18, color: colors.warning }}>
              {data.worst_day_of_week} miss rate: {((data.day_of_week_miss_rates?.[data.worst_day_of_week] ?? 0) * 100).toFixed(0)}%
            </Text>
          </Animated.View>
          <WeeklyInsightCharts
            missRates={data.day_of_week_miss_rates}
            rolling={data.rolling_7day_completion_rate}
            breakdown={data.challenge_breakdown}
          />
          <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginHorizontal: 20, marginTop: 8, padding: 16, borderRadius: 16, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.borderAccent }}>
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>PERSONALIZED NUDGE</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.text, lineHeight: 22 }}>{data.nudge_copy}</Text>
          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
