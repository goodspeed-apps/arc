import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { InsightDayBar } from '@/components/InsightDayBar';

type WeeklyInsight = {
  day_of_week_miss_rates: Record<string, number>;
  rolling_7day_completion_rate: number[];
  worst_day_of_week: string;
  nudge_copy: string;
  challenge_breakdown: Record<string, number>;
  computed_at: string;
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function InsightDetailScreen() {
  const { weekId } = useLocalSearchParams<{ weekId: string }>();
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const { isSubscribed } = useSubscription();
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    const start = Date.now();
    try {
      const done = trackApiLatency('weekly_insight_fetch');
      const { data, error: err } = await supabase
        .from('weekly_insights')
        .select('*')
        .eq('id', weekId)
        .single();
      done();
      if (err) throw err;
      setInsight(data as WeeklyInsight);
      setError(false);
      trackScreenLoad('InsightDetail', start);
      track('insight_detail_viewed', { weekId });
    } catch (e) {
      captureException(e as Error, { screen: 'InsightDetail', action: 'fetch' });
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weekId]);

  useEffect(() => { fetch(); }, [fetch]);

  const onRefresh = () => { setRefreshing(true); fetch(); };

  const handleDayPress = (day: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDay(prev => (prev === day ? null : day));
    track('insight_day_tapped', { day });
  };

  if (!isSubscribed) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState icon="lock" title="Premium Only" description="Upgrade to view deep weekly insights." />
      </SafeAreaView>
    );
  }

  const missRates = insight?.day_of_week_miss_rates ?? {};
  const breakdown = insight?.challenge_breakdown ?? {};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
        <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 22, color: colors.text }}>Your Pattern</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close" accessibilityHint="Dismiss this screen" style={{ padding: 8 }}>
          <X size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      {loading ? <LoadingSkeleton variant="list" /> : error ? (
        <EmptyState icon="alert-circle" title="Could not load insight" description="Pull down to retry." />
      ) : !insight ? (
        <EmptyState icon="bar-chart-2" title="Not enough data" description="Complete more days to unlock pattern analysis." />
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <Animated.View entering={FadeInDown.delay(50)}>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, color: colors.textSecondary, marginBottom: 12, letterSpacing: 1.2, textTransform: 'uppercase' }}>Day-of-Week Miss Rate</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surfaceElevated, borderRadius: 16, padding: 16 }}>
              {DAYS.map((day, i) => (
                <InsightDayBar key={day} day={day} missRate={missRates[day] ?? 0} selected={selectedDay === day} onPress={() => handleDayPress(day)} index={i} completeCount={Math.round((1 - (missRates[day] ?? 0)) * 10)} missCount={Math.round((missRates[day] ?? 0) * 10)} />
              ))}
            </View>
            {selectedDay && (
              <Animated.View entering={FadeInDown.duration(200)} style={{ marginTop: 10, backgroundColor: colors.surfaceSecondary, borderRadius: 12, padding: 14 }}>
                <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>{selectedDay}: {((missRates[selectedDay] ?? 0) * 100).toFixed(0)}% miss rate</Text>
              </Animated.View>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100)} style={{ marginTop: 24, backgroundColor: colors.surfaceElevated, borderRadius: 16, padding: 16 }}>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, color: colors.textSecondary, marginBottom: 8, letterSpacing: 1.2, textTransform: 'uppercase' }}>Top Insight</Text>
            <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 18, color: colors.warning }}>{insight.worst_day_of_week} miss rate: {((missRates[insight.worst_day_of_week] ?? 0) * 100).toFixed(0)}%</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150)} style={{ marginTop: 24, backgroundColor: colors.surfaceElevated, borderRadius: 16, padding: 16 }}>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, color: colors.textSecondary, marginBottom: 8, letterSpacing: 1.2, textTransform: 'uppercase' }}>Personalized Nudge</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.text, lineHeight: 22 }}>{insight.nudge_copy}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={{ marginTop: 24, backgroundColor: colors.surfaceElevated, borderRadius: 16, padding: 16 }}>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, color: colors.textSecondary, marginBottom: 12, letterSpacing: 1.2, textTransform: 'uppercase' }}>Challenge Breakdown</Text>
            {Object.entries(breakdown).map(([cat, rate], i) => (
              <Animated.View key={cat} entering={FadeInDown.delay(200 + 50 * i)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < Object.keys(breakdown).length - 1 ? 1 : 0, borderBottomColor: colors.divider }}>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text }}>{cat}</Text>
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: (rate ?? 0) >= 0.7 ? colors.positive : colors.warning }}>{((rate ?? 0) * 100).toFixed(0)}%</Text>
              </Animated.View>
            ))}
          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
