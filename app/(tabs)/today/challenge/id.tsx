import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, RefreshControl,
  Platform, FlatList, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, { FadeInDown, withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays, Flame, Snowflake, Trophy, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChallengeCalendarGrid } from '@/components/ChallengeCalendarGrid';
import { DayLogPopover } from '@/components/DayLogPopover';

interface Challenge {
  id: string; name: string; category: string; duration_days: number;
  start_date: string; end_date: string; status: string;
  commitments: string[]; reminder_time: string | null;
}
interface StreakSnapshot {
  current_streak: number; longest_streak: number;
  total_completed_days: number; total_frozen_days: number;
  total_missed_days: number; freezes_used_this_week: number;
}
interface DayLog {
  id: string; log_date: string; day_number: number; status: string;
  commitment_checks: Record<string, boolean>; freeze_applied: boolean;
  all_complete: boolean; acknowledged_miss: boolean;
}

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [streak, setStreak] = useState<StreakSnapshot | null>(null);
  const [dayLogs, setDayLogs] = useState<DayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayLog | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    if (!user?.id || !id) { setLoading(false); return; }
    const start = Date.now();
    try {
      const end = trackApiLatency('challenge_detail', start);
      const [{ data: ch, error: e1 }, { data: ss, error: e2 }, { data: dl, error: e3 }] = await Promise.all([
        supabase.from('challenges').select('*').eq('id', id).single(),
        supabase.from('streak_snapshots').select('*').eq('challenge_id', id).order('computed_at', { ascending: false }).limit(1).single(),
        supabase.from('day_logs').select('*').eq('challenge_id', id).order('day_number'),
      ]);
      if (e1) throw e1;
      setChallenge(ch); setStreak(ss ?? null); setDayLogs(dl ?? []);
      if (ch?.reminder_time) { const d = new Date(); const [h, m] = ch.reminder_time.split(':'); d.setHours(+h, +m); setReminderTime(d); }
      end?.();
      trackScreenLoad('ChallengeDetail', start);
    } catch (err) {
      captureException(err as Error, { screen: 'ChallengeDetail', action: 'fetch' });
      setError('Failed to load challenge');
    } finally { setLoading(false); }
  }, [user?.id, id]);

  useEffect(() => { track('challenge_detail_viewed', { challenge_id: id }); fetchData(); }, [id]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchData(); setRefreshing(false); }, [fetchData]);
  const onDayTap = (log: DayLog) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedDay(log); };
  const onViewProofCard = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); track('proof_card_cta_tapped', { challenge_id: id }); router.push(`/(tabs)/today/proof/${id}` as never); };
  const onSaveReminder = async (event: unknown, date?: Date) => {
    if (!date) { setShowTimePicker(false); return; }
    setReminderTime(date); setShowTimePicker(false);
    const t = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    track('reminder_time_updated', { challenge_id: id, time: t });
    const { error: err } = await supabase.from('challenges').update({ reminder_time: t }).eq('id', id);
    if (err) captureException(err, { screen: 'ChallengeDetail', action: 'update_reminder' });
  };

  const completionPct = challenge ? Math.round(((streak?.total_completed_days ?? 0) / challenge.duration_days) * 100) : 0;

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><LoadingSkeleton variant="list" /></SafeAreaView>;
  if (error || !challenge) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><EmptyState icon="alert-circle" title="Challenge not found" subtitle={error ?? "This challenge couldn't be loaded."} /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ padding: 20, gap: 20 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 26, color: colors.text, flexWrap: 'wrap' }}>{challenge.name}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{challenge.start_date} → {challenge.end_date}</Text>
            </View>
            <View style={{ backgroundColor: colors.primaryMuted, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 10 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.primary }}>{challenge.duration_days}d</Text>
            </View>
          </View>
          {/* Stats Row */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { icon: <Flame size={16} color={colors.primary} />, label: 'Streak', val: streak?.current_streak ?? 0 },
              { icon: <Trophy size={16} color={colors.accent} />, label: 'Best', val: streak?.longest_streak ?? 0 },
              { icon: <CalendarDays size={16} color={colors.success} />, label: 'Done', val: `${completionPct}%` },
              { icon: <Snowflake size={16} color={colors.info} />, label: 'Freezes', val: streak?.freezes_used_this_week ?? 0 },
            ].map((s, i) => (
              <Animated.View key={s.label} entering={FadeInDown.delay(50 * i).duration(300)} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 10, alignItems: 'center', gap: 4 }}>
                {s.icon}
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: colors.text }}>{s.val}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.textSecondary }}>{s.label}</Text>
              </Animated.View>
            ))}
          </View>
          {/* Calendar Grid */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 16 }}>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: colors.text, marginBottom: 12 }}>Streak Calendar</Text>
            <ChallengeCalendarGrid dayLogs={dayLogs} durationDays={challenge.duration_days} startDate={challenge.start_date} onDayPress={onDayTap} />
          </View>
          {/* Progress Bar */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSecondary }}>Progress to finish line</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary }}>{completionPct}%</Text>
            </View>
            <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ height: 8, width: `${completionPct}%`, backgroundColor: colors.primary, borderRadius: 4 }} />
            </View>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.textMuted, marginTop: 6 }}>Ends {challenge.end_date}</Text>
          </View>
          {/* Reminder Editor */}
          <Pressable
            onPress={() => { track('reminder_editor_tapped', { challenge_id: id }); setShowTimePicker(true); }}
            accessibilityLabel="Edit reminder time" accessibilityHint="Opens a time picker to change your daily reminder"
            style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Clock size={18} color={colors.primary} />
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text }}>Daily Reminder</Text>
            </View>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: colors.primary }}>
              {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Pressable>
          {/* Proof Card CTA */}
          {challenge.status === 'completed' && (
            <Pressable
              onPress={onViewProofCard}
              accessibilityLabel="View Proof Card" accessibilityHint="Opens your shareable proof card for this challenge"
              style={{ backgroundColor: colors.primary, borderRadius: 16, padding: 18, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: colors.textOnPrimary }}>View Proof Card 🏅</Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>
      {/* Time Picker Modal */}
      {showTimePicker && (
        <Modal transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
          <Pressable style={{ flex: 1, backgroundColor: colors.shadow, justifyContent: 'flex-end' }} onPress={() => setShowTimePicker(false)}>
            <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: colors.text, marginBottom: 16, textAlign: 'center' }}>Set Reminder Time</Text>
              <DateTimePicker value={reminderTime} mode="time" display="spinner" onChange={onSaveReminder} textColor={colors.text} />
            </View>
          </Pressable>
        </Modal>
      )}
      {/* Day Log Popover */}
      {selectedDay && <DayLogPopover log={selectedDay} onClose={() => setSelectedDay(null)} />}
    </SafeAreaView>
  );
}
