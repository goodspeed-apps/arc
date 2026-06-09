import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trackScreenLoad } from '@/lib/performance';
import { captureException } from '@/lib/sentry';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { DayCounter } from '@/components/arc/DayCounter';
import { CommitmentCheckRow } from '@/components/arc/CommitmentCheckRow';
import { StatBlock } from '@/components/arc/StatBlock';
import { ArcButton } from '@/components/arc/ArcButton';
import { FlashOverlay, FlashOverlayHandle } from '@/components/arc/FlashOverlay';
import { getActiveChallenge, getTodayLog, upsertDayLog, getStreakSnapshot } from '@/services/arcApi';
import { ARC_COLORS, ARC_FONTS, ARC_SPACING } from '@/lib/arcTheme';
import type { Challenge, DayLog, StreakSnapshot } from '@/types/arc';
import { Target } from 'lucide-react-native';

export default function TodayScreen() {
  const { user } = useAuth();
  const { track } = useAnalytics();
  const flashRef = useRef<FlashOverlayHandle>(null);
  const startTime = useRef(Date.now());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [dayLog, setDayLog] = useState<DayLog | null>(null);
  const [streak, setStreak] = useState<StreakSnapshot | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      setError(null);
      const c = await getActiveChallenge(user.id);
      setChallenge(c);
      if (c) {
        const [log, snap] = await Promise.all([getTodayLog(c.id, user.id), getStreakSnapshot(c.id)]);
        setDayLog(log);
        setStreak(snap);
        setChecks(log?.commitment_checks ?? {});
      }
      trackScreenLoad('TodayScreen', startTime.current);
    } catch (e) {
      captureException(e as Error, { screen: 'TodayScreen', action: 'fetchData' });
      setError('Failed to load challenge data.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { track('screen_view', { screen: 'TodayScreen' }); }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const toggleCheck = (key: string) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
    track('commitment_toggled', { key });
  };

  const computeDayNumber = (): number => {
    if (!challenge) return 1;
    const start = new Date(challenge.start_date);
    const today = new Date();
    return Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86400000) + 1);
  };

  const handleLogDay = async () => {
    if (!challenge || !user?.id) return;
    const allComplete = challenge.commitments.every((_, i) => checks[String(i)] === true);
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayNumber = computeDayNumber();
      const log = await upsertDayLog({
        challenge_id: challenge.id, user_id: user.id,
        log_date: today, day_number: dayNumber,
        status: allComplete ? 'complete' : 'missed',
        commitment_checks: checks, all_complete: allComplete,
        freeze_applied: false, acknowledged_miss: !allComplete,
      });
      setDayLog(log);
      track('day_logged', { challenge_id: challenge.id, day_number: dayNumber, all_complete: allComplete });
      if (allComplete) flashRef.current?.flashSuccess();
      else flashRef.current?.flashFailure();
    } catch (e) {
      captureException(e as Error, { screen: 'TodayScreen', action: 'handleLogDay' });
    } finally {
      setSaving(false);
    }
  };

  const dayNumber = computeDayNumber();
  const alreadyLogged = dayLog?.status === 'complete' || dayLog?.status === 'missed';

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: ARC_COLORS.nearBlack }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSkeleton variant="text" width={120} height={52} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: ARC_COLORS.nearBlack }}>
      <FlashOverlay ref={flashRef} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: ARC_SPACING.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ARC_COLORS.ember} />}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: ARC_SPACING.md, paddingTop: ARC_SPACING.md, paddingBottom: ARC_SPACING.lg }}>
          {challenge ? (
            <>
              <DayCounter dayNumber={dayNumber} totalDays={challenge.duration_days} />
              <Text style={{ fontFamily: ARC_FONTS.body, fontSize: 14, color: ARC_COLORS.muted, marginTop: ARC_SPACING.xs, letterSpacing: 0.5 }}>
                {challenge.name}
              </Text>
            </>
          ) : (
            <Text style={{ fontFamily: ARC_FONTS.display, fontSize: 48, color: ARC_COLORS.bone, letterSpacing: 4 }}>ARC</Text>
          )}
        </View>

        {error && (
          <View style={{ marginHorizontal: ARC_SPACING.md, backgroundColor: ARC_COLORS.surface, padding: ARC_SPACING.md, marginBottom: ARC_SPACING.md }}>
            <Text style={{ fontFamily: ARC_FONTS.body, color: ARC_COLORS.danger, fontSize: 13 }}>{error}</Text>
            <Pressable onPress={fetchData} accessibilityLabel="Retry" accessibilityHint="Tap to retry loading data">
              <Text style={{ fontFamily: ARC_FONTS.bodyMedium, color: ARC_COLORS.ember, marginTop: ARC_SPACING.sm, fontSize: 13 }}>RETRY</Text>
            </Pressable>
          </View>
        )}

        {!challenge ? (
          <Animated.View entering={FadeInDown.duration(300)} style={{ paddingHorizontal: ARC_SPACING.md }}>
            <EmptyState
              icon={<Target size={48} color={ARC_COLORS.ember} />}
              title="NO ACTIVE CHALLENGE"
              description="Start a time-boxed challenge and build your discipline record."
              actionLabel="START A CHALLENGE"
              onAction={() => router.push('/(tabs)/challenges')}
            />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(300)}>
            {/* Stats row */}
            <View style={{ flexDirection: 'row', gap: 2, marginHorizontal: ARC_SPACING.md, marginBottom: ARC_SPACING.md }}>
              <StatBlock value={streak?.current_streak ?? 0} label="STREAK" accent />
              <StatBlock value={`${challenge.duration_days - dayNumber}D`} label="REMAINING" />
              <StatBlock value={`${Math.round(((streak?.total_completed_days ?? 0) / Math.max(dayNumber, 1)) * 100)}%`} label="RATE" />
            </View>

            {/* Commitments */}
            <View style={{ marginHorizontal: ARC_SPACING.md, marginBottom: ARC_SPACING.md }}>
              <Text style={{ fontFamily: ARC_FONTS.display, fontSize: 12, color: ARC_COLORS.muted, letterSpacing: 2, marginBottom: ARC_SPACING.sm }}>
                TODAY'S COMMITMENTS
              </Text>
              {challenge.commitments.map((item, i) => (
                <CommitmentCheckRow
                  key={i} index={i} label={item}
                  checked={checks[String(i)] === true}
                  onToggle={() => toggleCheck(String(i))}
                />
              ))}
            </View>

            {/* Log button */}
            <View style={{ marginHorizontal: ARC_SPACING.md }}>
              {alreadyLogged ? (
                <View style={{ backgroundColor: ARC_COLORS.surface, padding: ARC_SPACING.md, alignItems: 'center' }}>
                  <Text style={{ fontFamily: ARC_FONTS.display, fontSize: 12, color: dayLog?.all_complete ? ARC_COLORS.ember : ARC_COLORS.danger, letterSpacing: 2 }}>
                    {dayLog?.all_complete ? 'DAY LOGGED, COMPLETE' : 'DAY LOGGED, MISSED'}
                  </Text>
                </View>
              ) : (
                <ArcButton
                  label="LOG TODAY"
                  onPress={handleLogDay}
                  loading={saving}
                  accessibilityLabel="Log today's commitments"
                  accessibilityHint="Records your progress for today"
                />
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
