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
  const themeColors = useThemeColors();
  const colors: Record<string, string> = themeColors as unknown as Record<string, string>;
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
      const end = trackApiLatency('challenge_detail');
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
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (!id) return;
    const { error: updateError } = await supabase.from('challenges').update({ reminder_time: time }).eq('id', id);
    if (updateError) captureException(updateError, { screen: 'ChallengeDetail', action: 'handleReminderSave' });
    else track('reminder_time_updated', { challenge_id: id, time });
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><LoadingSkeleton variant="card" /></SafeAreaView>;
  if (error) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><EmptyState icon="alert-circle" title="Error" description={error} /></SafeAreaView>;
  if (!challenge) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><EmptyState icon="flag" title="Not found" description="Challenge not found." /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 22, color: colors.text, flex: 1 }} numberOfLines={1}>{challenge.name}</Text>
      </View>

      <ChallengStatsRow streak={streak} colors={colors} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 8 }}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 13, marginLeft: 6 }}>
              {challenge.start_date} → {challenge.end_date}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Clock size={16} color={colors.textSecondary} />
            <Pressable onPress={() => setShowTimePicker(true)} style={{ marginLeft: 6 }}>
              <Text style={{ color: colors.primary, fontFamily: 'Inter_400Regular', fontSize: 13 }}>
                Reminder: {`${String(reminderTime.getHours()).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')}`}
              </Text>
            </Pressable>
          </View>

          <FlatList
            data={dayLogs}
            keyExtractor={item => item.id}
            numColumns={7}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <ChallengeDayTile log={item} onPress={() => handleDayTap(item)} colors={colors} />
            )}
            contentContainerStyle={{ gap: 4 }}
          />
        </Animated.View>
      </ScrollView>

      {showTimePicker && (
        <Modal transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
              <DateTimePicker
                value={reminderTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => { if (date) handleReminderSave(date); }}
              />
              <Pressable onPress={() => setShowTimePicker(false)} style={{ alignItems: 'center', paddingVertical: 12 }}>
                <Text style={{ color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {selectedDay && (
        <Modal transparent animationType="fade" onRequestClose={() => setSelectedDay(null)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setSelectedDay(null)}>
            <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, width: '80%' }}>
              <Text style={{ color: colors.text, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, marginBottom: 8 }}>Day {selectedDay.day_number}</Text>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 14 }}>Status: {selectedDay.status}</Text>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 14 }}>Date: {selectedDay.log_date}</Text>
            </View>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}
