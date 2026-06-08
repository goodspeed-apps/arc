import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { saveOnboardingAnswers } from '@/lib/onboarding-buffer';
import { trackScreenLoad } from '@/lib/performance';
import { requestPermissionAndRegister, scheduleLocalNotification } from '@/lib/notifications';

const STEP = 4;
const TOTAL = 5;

const TIMES = [
  { id: '06:00', label: '6:00 AM', sub: 'MORNING BRIEF' },
  { id: '12:00', label: '12:00 PM', sub: 'MIDDAY CHECK' },
  { id: '20:00', label: '8:00 PM', sub: 'EVENING LOG' },
  { id: '21:30', label: '9:30 PM', sub: 'NIGHT REVIEW' },
];

export default function ReminderSetup() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const { user } = useAuth();
  const startTime = React.useRef(Date.now());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    track('onboarding_step_4');
    trackScreenLoad('onboarding_reminder_setup', startTime.current);
  }, []);

  const handleEnableReminders = async () => {
    if (!selectedTime) return;
    setRequesting(true);
    try {
      await requestPermissionAndRegister(user?.id ?? '');
      const [hour, minute] = selectedTime.split(':').map(Number);
      await scheduleLocalNotification(
        'ARC, LOG YOUR STATUS',
        "Did you complete your challenge today? Mark it now.",
        { hour, minute, repeats: true },
      );
      setPermissionGranted(true);
      track('onboarding_reminder_enabled', { time: selectedTime });
    } catch (_) {
      setPermissionGranted(false);
    } finally {
      setRequesting(false);
    }
  };

  const handleContinue = async () => {
    await saveOnboardingAnswers({
      reminderEnabled: permissionGranted,
      reminderTime: selectedTime ?? undefined,
    });
    router.push('/(auth)/onboarding/lands-on-today-tab-as-day-1');
  };

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" style={s.back}>
          <Text style={s.backText}>← BACK</Text>
        </Pressable>
        <View style={s.progress}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <View key={i} style={[s.pip, i < STEP && s.pipActive]} />
          ))}
        </View>
      </View>

      <Animated.View entering={FadeInDown.delay(80).springify()}>
        <Text style={s.stepLabel}>STEP {STEP} OF {TOTAL}</Text>
        <Text style={s.headline}>{"DAILY\nREMINDER."}</Text>
        <View style={s.divider} />
        <Text style={s.body}>{"Streaks break when you forget. Set a daily prompt to log your status."}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()} style={s.timeGrid}>
        {TIMES.map((t, i) => (
          <Animated.View key={t.id} entering={FadeInDown.delay(200 + i * 50).springify()} style={s.timeWrap}>
            <Pressable
              style={[s.timeCard, selectedTime === t.id && s.timeCardActive]}
              onPress={() => setSelectedTime(t.id)}
              accessibilityLabel={`${t.label}, ${t.sub}`}
              accessibilityHint="Select this reminder time"
            >
              <Text style={[s.timeNum, selectedTime === t.id && s.accentText]}>{t.label}</Text>
              <Text style={s.timeSub}>{t.sub}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </Animated.View>

      {selectedTime && !permissionGranted && (
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <Pressable
            style={({ pressed }) => [s.enableBtn, pressed && s.ctaPressed]}
            onPress={handleEnableReminders}
            disabled={requesting}
            accessibilityLabel="Enable daily reminders"
            accessibilityHint="Tap to allow notifications for your daily Arc reminder"
          >
            <Text style={s.enableText}>{requesting ? 'REQUESTING...' : 'ENABLE REMINDERS'}</Text>
          </Pressable>
        </Animated.View>
      )}

      {permissionGranted && (
        <Animated.View entering={FadeInDown.delay(60).springify()} style={s.confirmedRow}>
          <View style={s.confirmedDot} />
          <Text style={s.confirmedText}>REMINDER SCHEDULED</Text>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(480).springify()} style={s.footer}>
        <Pressable
          style={({ pressed }) => [s.skip, pressed && s.ctaPressed]}
          onPress={handleContinue}
          accessibilityLabel="Skip reminder setup"
          accessibilityHint="Continue without enabling reminders"
        >
          <Text style={s.skipText}>SKIP FOR NOW</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
          onPress={handleContinue}
          accessibilityLabel="Continue to final step"
        >
          <Text style={s.ctaText}>CONTINUE</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
    header: { marginTop: 20, marginBottom: 32 },
    back: { marginBottom: 12 },
    backText: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, letterSpacing: 2, color: colors.textSecondary },
    progress: { flexDirection: 'row', gap: 6 },
    pip: { flex: 1, height: 3, backgroundColor: colors.border },
    pipActive: { backgroundColor: colors.accent },
    stepLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 11, letterSpacing: 4, color: colors.accent, marginBottom: 10 },
    headline: { fontFamily: 'JosefinSans_700Bold', fontSize: 40, letterSpacing: 2, color: colors.text, lineHeight: 44, marginBottom: 16 },
    divider: { width: 48, height: 2, backgroundColor: colors.accent, marginBottom: 16 },
    body: { fontFamily: 'Manrope_400Regular', fontSize: 14, lineHeight: 22, color: colors.textSecondary, marginBottom: 28 },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    timeWrap: { width: '47%' },
    timeCard: {
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
      paddingVertical: 16, paddingHorizontal: 14, minHeight: 68,
    },
    timeCardActive: { borderColor: colors.accent, backgroundColor: colors.surfaceElevated },
    timeNum: { fontFamily: 'JosefinSans_700Bold', fontSize: 16, letterSpacing: 1, color: colors.text, marginBottom: 4 },
    timeSub: { fontFamily: 'Manrope_400Regular', fontSize: 10, letterSpacing: 2, color: colors.textMuted },
    accentText: { color: colors.accent },
    enableBtn: {
      borderWidth: 1, borderColor: colors.accent, paddingVertical: 14,
      alignItems: 'center', marginBottom: 16,
    },
    enableText: { fontFamily: 'JosefinSans_700Bold', fontSize: 13, letterSpacing: 3, color: colors.accent },
    confirmedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
    confirmedDot: { width: 8, height: 8, backgroundColor: colors.success },
    confirmedText: { fontFamily: 'Manrope_600SemiBold', fontSize: 11, letterSpacing: 3, color: colors.success },
    footer: { marginTop: 'auto', paddingBottom: 16, gap: 10 },
    skip: { alignItems: 'center', paddingVertical: 14 },
    skipText: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, letterSpacing: 2, color: colors.textMuted },
    cta: { backgroundColor: colors.accent, paddingVertical: 18, alignItems: 'center' },
    ctaPressed: { opacity: 0.82 },
    ctaText: { fontFamily: 'JosefinSans_700Bold', fontSize: 15, letterSpacing: 3, color: colors.textOnPrimary },
  });
