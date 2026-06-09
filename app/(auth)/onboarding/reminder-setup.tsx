import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { saveOnboardingAnswers } from '@/lib/onboarding-buffer';
import { trackScreenLoad } from '@/lib/performance';
import { scheduleLocalNotification, requestPermissionAndRegister } from '@/lib/notifications';
import { useAuth } from '@/hooks/useAuth';

const STEP = 4;
const TOTAL = 5;
const TIMES = ['06:00', '08:00', '12:00', '18:00', '21:00'];

export default function ReminderSetupScreen() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const { user } = useAuth();
  const start = Date.now();
  const [enabled, setEnabled] = useState(true);
  const [selectedTime, setSelectedTime] = useState('21:00');
  const [permStatus, setPermStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    track('onboarding_step_4');
    trackScreenLoad('onboarding_reminder_setup', start);
  }, []);

  const handleToggleEnable = async () => {
    const next = !enabled;
    setEnabled(next);
    track('reminder_toggle', { enabled: next });
    if (next && permStatus === 'idle' && user?.id) {
      try {
        await requestPermissionAndRegister(user.id);
        setPermStatus('granted');
      } catch (_) {
        setPermStatus('denied');
      }
    }
  };

  const handleTestNotification = async () => {
    track('reminder_test_fired', { time: selectedTime });
    try {
      await scheduleLocalNotification(
        'ARC, LOG YOUR REP',
        "Your streak is on the line. Mark today's effort now.",
        { seconds: 3 },
      );
    } catch (_) {}
  };

  const handleContinue = async () => {
    track('onboarding_step_4_continue', { reminderEnabled: enabled, reminderTime: selectedTime });
    await saveOnboardingAnswers({ reminderEnabled: enabled, reminderTime: selectedTime });
    if (enabled && permStatus === 'idle' && user?.id) {
      try {
        await requestPermissionAndRegister(user.id);
        setPermStatus('granted');
      } catch (_) {
        setPermStatus('denied');
      }
    }
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

      <Animated.View entering={FadeInDown.delay(80).duration(500)} style={s.body}>
        <Text style={s.stepLabel}>STEP 4 OF 5</Text>
        <Text style={s.title}>DAILY{'\n'}REMINDER</Text>
        <View style={s.divider} />
        <Text style={s.bodyText}>
          {"A single daily prompt keeps your streak alive. Missing a log because you forgot is not a valid excuse."}
        </Text>

        <Pressable
          style={s.toggleRow}
          onPress={handleToggleEnable}
          accessibilityLabel={enabled ? 'Disable daily reminder' : 'Enable daily reminder'}
          accessibilityHint="Toggles daily notification"
        >
          <Text style={s.toggleLabel}>ENABLE DAILY REMINDER</Text>
          <View style={[s.toggle, enabled && s.toggleOn]}>
            <View style={[s.toggleThumb, enabled && s.toggleThumbOn]} />
          </View>
        </Pressable>

        {enabled && (
          <Animated.View entering={FadeInDown.delay(100).duration(350)}>
            <Text style={s.sectionHead}>REMINDER TIME</Text>
            <View style={s.timeRow}>
              {TIMES.map((t) => (
                <Pressable
                  key={t}
                  style={[s.timeBtn, selectedTime === t && s.timeBtnActive]}
                  onPress={() => { setSelectedTime(t); track('reminder_time_selected', { time: t }); }}
                  accessibilityLabel={`Set reminder at ${t}`}
                >
                  <Text style={[s.timeText, selectedTime === t && s.timeTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [s.testBtn, pressed && s.testBtnPressed]}
              onPress={handleTestNotification}
              accessibilityLabel="Send a test reminder notification"
              accessibilityHint="Fires a test notification in 3 seconds"
            >
              <Text style={s.testBtnText}>SEND TEST REMINDER</Text>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(350).duration(500)} style={s.footer}>
        <Pressable
          style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
          onPress={handleContinue}
          accessibilityLabel="Continue to step 5"
        >
          <Text style={s.ctaText}>NEXT</Text>
        </Pressable>
        <Pressable
          onPress={async () => { await saveOnboardingAnswers({ reminderEnabled: false }); router.push('/(auth)/onboarding/lands-on-today-tab-as-day-1'); }}
          accessibilityLabel="Skip reminder setup"
          style={s.skip}
        >
          <Text style={s.skipText}>SKIP FOR NOW</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
    header: { marginTop: 16, marginBottom: 24 },
    back: { marginBottom: 16, minHeight: 44, justifyContent: 'center' },
    backText: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, letterSpacing: 2, color: colors.textSecondary },
    progress: { flexDirection: 'row', gap: 6 },
    pip: { flex: 1, height: 3, backgroundColor: colors.border },
    pipActive: { backgroundColor: colors.accent },
    body: { flex: 1 },
    stepLabel: { fontFamily: 'JosefinSans_700Bold', fontSize: 11, letterSpacing: 4, color: colors.accent, marginBottom: 8 },
    title: { fontFamily: 'JosefinSans_700Bold', fontSize: 36, color: colors.text, letterSpacing: 3, lineHeight: 44 },
    divider: { width: 48, height: 3, backgroundColor: colors.accent, marginTop: 16, marginBottom: 24 },
    bodyText: { fontFamily: 'Manrope_400Regular', fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 32 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, marginBottom: 24, minHeight: 56 },
    toggleLabel: { fontFamily: 'JosefinSans_700Bold', fontSize: 13, letterSpacing: 3, color: colors.text },
    toggle: { width: 48, height: 28, backgroundColor: colors.border, borderRadius: 14, padding: 2 },
    toggleOn: { backgroundColor: colors.accent },
    toggleThumb: { width: 24, height: 24, backgroundColor: colors.surface, borderRadius: 12 },
    toggleThumbOn: { transform: [{ translateX: 20 }] },
    sectionHead: { fontFamily: 'JosefinSans_700Bold', fontSize: 11, letterSpacing: 4, color: colors.textSecondary, marginBottom: 12 },
    timeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
    timeBtn: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
    timeBtnActive: { borderColor: colors.accent, backgroundColor: colors.surface },
    timeText: { fontFamily: 'JosefinSans_700Bold', fontSize: 13, letterSpacing: 2, color: colors.textSecondary },
    timeTextActive: { color: colors.accent },
    testBtn: { borderWidth: 1, borderColor: colors.accent, paddingVertical: 14, alignItems: 'center', minHeight: 44 },
    testBtnPressed: { opacity: 0.7 },
    testBtnText: { fontFamily: 'JosefinSans_700Bold', fontSize: 13, letterSpacing: 3, color: colors.accent },
    footer: { paddingBottom: 24, gap: 12 },
    cta: { backgroundColor: colors.accent, paddingVertical: 18, alignItems: 'center' },
    ctaPressed: { opacity: 0.8 },
    ctaText: { fontFamily: 'JosefinSans_700Bold', fontSize: 16, letterSpacing: 3, color: colors.textOnPrimary },
    skip: { alignItems: 'center', paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
    skipText: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, letterSpacing: 2, color: colors.textMuted },
  });
