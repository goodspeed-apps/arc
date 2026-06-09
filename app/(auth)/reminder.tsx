import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { scheduleLocalNotification } from '@/lib/notifications';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';

const DEFAULT_HOUR = 20;
const DEFAULT_MINUTE = 0;

function makeDefaultTime(): Date {
  const d = new Date();
  d.setHours(DEFAULT_HOUR, DEFAULT_MINUTE, 0, 0);
  return d;
}

export default function ReminderSetupScreen() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const { user } = useAuth();
  const [time, setTime] = useState<Date>(makeDefaultTime());
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    const start = Date.now();
    track('onboarding_reminder_setup_viewed');
    trackScreenLoad('ReminderSetup', start);
  }, []);

  const handleTimeChange = useCallback((_: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTime(selected);
  }, []);

  const handleSetReminder = useCallback(async () => {
    setSaving(true);
    try {
      const hours = time.getHours();
      const minutes = time.getMinutes();
      const reminderStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

      const end = trackApiLatency('update_reminder_time');
      if (user?.id) {
        const { error } = await supabase
          .from('users')
          .update({ reminder_time: reminderStr, onboarding_completed: true })
          .eq('id', user.id);
        end();
        if (error) {
          captureException(error, { screen: 'ReminderSetup', action: 'update_reminder_time' });
        }
      }

      await scheduleLocalNotification(
        "Time to check in 🔥",
        "Your daily Arc challenge awaits.",
        { hour: hours, minute: minutes, repeats: true },
      );

      track('onboarding_reminder_set', { hour: hours, minute: minutes });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/placeholder');
    } catch (err) {
      captureException(err as Error, { screen: 'ReminderSetup', action: 'set_reminder' });
    } finally {
      setSaving(false);
    }
  }, [time, user?.id]);

  const handleSkip = useCallback(async () => {
    track('onboarding_reminder_skipped');
    if (user?.id) {
      await supabase.from('users').update({ onboarding_completed: true }).eq('id', user.id);
    }
    router.replace('/(tabs)/placeholder');
  }, [user?.id]);

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <Animated.View entering={FadeInDown.duration(500)} style={s.container}>
        <Text style={s.heading}>{"When should we remind you?"}</Text>
        <Text style={s.sub}>{"Pick a time you'll actually see it."}</Text>

        <View style={s.pickerWrapper}>
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            textColor={colors.text}
            accentColor={colors.accent}
            style={s.picker}
          />
        </View>

        <View style={s.privacyStrip}>
          <Lock size={16} color={colors.success} />
          <Text style={s.privacyText}>{"Everything stays on your device"}</Text>
        </View>

        <Pressable
          onPress={handleSetReminder}
          disabled={saving}
          style={({ pressed }) => [s.cta, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          accessibilityLabel="Set Reminder and Start Day 1"
          accessibilityHint="Schedules your daily reminder and begins your challenge"
        >
          <Text style={s.ctaText}>{saving ? 'Saving…' : 'Set Reminder & Start Day 1'}</Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [s.skip, { opacity: pressed ? 0.6 : 1 }]}
          accessibilityLabel="Skip reminder setup"
          accessibilityHint="Continue without setting a reminder"
        >
          <Text style={s.skipText}>{"Skip for now"}</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
    heading: { fontSize: 28, fontFamily: 'JosefinSans_700Bold', color: colors.text, textAlign: 'center', marginBottom: 8 },
    sub: { fontSize: 15, fontFamily: 'Manrope_400Regular', color: colors.textSecondary, textAlign: 'center', marginBottom: 32 },
    pickerWrapper: { width: '100%', alignItems: 'center', marginBottom: 28, backgroundColor: colors.surface, borderRadius: 16, padding: 8 },
    picker: { width: 260, height: 160 },
    privacyStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceSecondary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 36 },
    privacyText: { fontSize: 13, fontFamily: 'Manrope_400Regular', color: colors.textSecondary },
    cta: { width: '100%', backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
    ctaText: { fontSize: 16, fontFamily: 'Manrope_700Bold', color: colors.textOnPrimary },
    skip: { paddingVertical: 8 },
    skipText: { fontSize: 14, fontFamily: 'Manrope_400Regular', color: colors.textMuted },
  });
