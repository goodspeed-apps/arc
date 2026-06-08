import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { scheduleLocalNotification } from '@/lib/notifications';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';

export default function ReminderSetupScreen() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const { user } = useAuth();

  const defaultTime = new Date();
  defaultTime.setHours(20, 0, 0, 0);
  const [time, setTime] = useState<Date>(defaultTime);
  const [confirmed, setConfirmed] = useState(false);

  const scaleSet = useSharedValue(1);
  const scaleSkip = useSharedValue(1);

  const animatedSet = useAnimatedStyle(() => ({ transform: [{ scale: scaleSet.value }] }));
  const animatedSkip = useAnimatedStyle(() => ({ transform: [{ scale: scaleSkip.value }] }));

  useEffect(() => {
    const start = Date.now();
    track('onboarding_reminder_setup_viewed');
    trackScreenLoad('ReminderSetup', start);
  }, []);

  const saveAndProceed = useCallback(async () => {
    scaleSet.value = withSpring(0.97, { damping: 15 }, () => { scaleSet.value = withSpring(1); });
    track('onboarding_reminder_set', { hour: time.getHours(), minute: time.getMinutes() });
    try {
      const end = trackApiLatency('save_reminder_time');
      const hhmm = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:00`;
      if (user?.id) {
        await supabase.from('users').update({ reminder_time: hhmm, onboarding_completed: true }).eq('id', user.id);
      }
      end();
      await scheduleLocalNotification(
        "Time to check in 🔥",
        "Log your progress and keep your streak alive.",
        { hour: time.getHours(), minute: time.getMinutes(), repeats: true },
      );
      setConfirmed(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/placeholder');
    } catch (err) {
      captureException(err as Error, { screen: 'ReminderSetup', action: 'saveAndProceed' });
    }
  }, [time, user?.id]);

  const handleSkip = useCallback(async () => {
    scaleSkip.value = withSpring(0.97, { damping: 15 }, () => { scaleSkip.value = withSpring(1); });
    track('onboarding_reminder_skipped');
    if (user?.id) {
      try {
        await supabase.from('users').update({ onboarding_completed: true }).eq('id', user.id);
      } catch (err) {
        captureException(err as Error, { screen: 'ReminderSetup', action: 'skip' });
      }
    }
    router.replace('/(tabs)/placeholder');
  }, [user?.id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 28, color: colors.text, textAlign: 'center', marginBottom: 8 }}>
            {"When should we remind you?"}
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 36 }}>
            {"Pick a time you'll actually show up."}
          </Text>

          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ width: '100%', alignItems: 'center', marginBottom: 36 }}>
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selected) => selected && setTime(selected)}
              style={{ width: 240, height: 160 }}
              textColor={colors.text}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 32, gap: 10, width: '100%' }}>
            <Lock size={18} color={colors.success} />
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: colors.textSecondary, flex: 1 }}>
              {"Everything stays on your device. No data leaves without your permission."}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ width: '100%', gap: 16 }}>
            <Animated.View style={animatedSet}>
              <Pressable
                onPress={saveAndProceed}
                accessibilityLabel="Set reminder and start Day 1"
                accessibilityHint="Schedules your daily check-in reminder and begins the challenge"
                style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', minHeight: 52 }}
              >
                <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 17, color: colors.textOnPrimary }}>
                  {confirmed ? "Starting Day 1…" : "Set Reminder & Start Day 1"}
                </Text>
              </Pressable>
            </Animated.View>

            <Animated.View style={animatedSkip}>
              <Pressable
                onPress={handleSkip}
                accessibilityLabel="Skip reminder setup"
                accessibilityHint="Continue without setting a daily reminder"
                style={{ alignItems: 'center', paddingVertical: 12, minHeight: 44 }}
              >
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: colors.textMuted }}>
                  {"Skip for now"}
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
