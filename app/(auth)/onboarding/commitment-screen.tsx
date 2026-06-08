import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { saveOnboardingAnswers } from '@/lib/onboarding-buffer';
import { trackScreenLoad } from '@/lib/performance';

const STEP = 3;
const TOTAL = 5;

const DURATIONS = [
  { days: 7, label: '7 DAYS', sub: 'STARTER ARC' },
  { days: 21, label: '21 DAYS', sub: 'HABIT ARC' },
  { days: 30, label: '30 DAYS', sub: 'STANDARD ARC' },
  { days: 75, label: '75 DAYS', sub: 'HARD ARC' },
  { days: 100, label: '100 DAYS', sub: 'CENTURY ARC' },
];

const FREEZE_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function CommitmentScreen() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const startTime = React.useRef(Date.now());
  const [duration, setDuration] = useState<number | null>(null);
  const [freezeDay, setFreezeDay] = useState<string | null>(null);

  useEffect(() => {
    track('onboarding_step_3');
    trackScreenLoad('onboarding_commitment', startTime.current);
  }, []);

  const canContinue = duration !== null && freezeDay !== null;

  const handleContinue = async () => {
    await saveOnboardingAnswers({
      durationDays: duration ?? undefined,
      weeklyFreezeDay: freezeDay ?? undefined,
    });
    router.push('/(auth)/onboarding/reminder-setup');
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
        <Text style={s.headline}>{"SET YOUR\nCOMMITMENT."}</Text>
        <View style={s.divider} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).springify()}>
        <Text style={s.sectionLabel}>DURATION</Text>
        <View style={s.row}>
          {DURATIONS.map((d, i) => (
            <Animated.View key={d.days} entering={FadeInDown.delay(160 + i * 40).springify()} style={s.durationWrap}>
              <Pressable
                style={[s.durationCard, duration === d.days && s.durationCardActive]}
                onPress={() => setDuration(d.days)}
                accessibilityLabel={`${d.label}, ${d.sub}`}
              >
                <Text style={[s.durationNum, duration === d.days && s.accentText]}>{d.label}</Text>
                <Text style={[s.durationSub, duration === d.days && s.accentSubText]}>{d.sub}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(380).springify()} style={s.freezeSection}>
        <Text style={s.sectionLabel}>WEEKLY FREEZE DAY</Text>
        <Text style={s.freezeHint}>{"One day per week your streak won't break."}</Text>
        <View style={s.freezeRow}>
          {FREEZE_DAYS.map((day) => (
            <Pressable
              key={day}
              style={[s.freezeChip, freezeDay === day && s.freezeChipActive]}
              onPress={() => setFreezeDay(day)}
              accessibilityLabel={day}
              accessibilityHint="Set as your weekly freeze day"
            >
              <Text style={[s.freezeText, freezeDay === day && s.accentText]}>{day}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).springify()} style={s.footer}>
        <Pressable
          style={({ pressed }) => [s.cta, !canContinue && s.ctaDisabled, pressed && canContinue && s.ctaPressed]}
          onPress={canContinue ? handleContinue : undefined}
          accessibilityLabel="Continue to reminder setup"
        >
          <Text style={s.ctaText}>LOCK IT IN</Text>
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
    divider: { width: 48, height: 2, backgroundColor: colors.accent, marginBottom: 24 },
    sectionLabel: { fontFamily: 'Manrope_700Bold', fontSize: 11, letterSpacing: 4, color: colors.textMuted, marginBottom: 12 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
    durationWrap: {},
    durationCard: {
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
      paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center', minWidth: 64,
    },
    durationCardActive: { borderColor: colors.accent, backgroundColor: colors.surfaceElevated },
    durationNum: { fontFamily: 'JosefinSans_700Bold', fontSize: 13, letterSpacing: 1, color: colors.textSecondary },
    durationSub: { fontFamily: 'Manrope_400Regular', fontSize: 9, color: colors.textMuted, marginTop: 2, letterSpacing: 0.5 },
    accentText: { color: colors.accent },
    accentSubText: { color: colors.textSecondary },
    freezeSection: { marginBottom: 28 },
    freezeHint: { fontFamily: 'Manrope_400Regular', fontSize: 13, color: colors.textMuted, marginBottom: 12 },
    freezeRow: { flexDirection: 'row', gap: 6 },
    freezeChip: {
      flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
      paddingVertical: 10, alignItems: 'center', minHeight: 44,
    },
    freezeChipActive: { borderColor: colors.accent, backgroundColor: colors.surfaceElevated },
    freezeText: { fontFamily: 'JosefinSans_700Bold', fontSize: 10, letterSpacing: 1, color: colors.textSecondary },
    footer: { paddingBottom: 16, marginTop: 'auto' },
    cta: { backgroundColor: colors.accent, paddingVertical: 18, alignItems: 'center' },
    ctaDisabled: { backgroundColor: colors.border },
    ctaPressed: { opacity: 0.82 },
    ctaText: { fontFamily: 'JosefinSans_700Bold', fontSize: 15, letterSpacing: 3, color: colors.textOnPrimary },
  });
