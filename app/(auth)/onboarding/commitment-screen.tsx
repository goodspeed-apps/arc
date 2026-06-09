import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
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
  { id: 7, label: '7 DAYS', sub: 'First blood' },
  { id: 21, label: '21 DAYS', sub: 'Habit formation territory' },
  { id: 30, label: '30 DAYS', sub: 'The classic proving ground' },
  { id: 75, label: '75 DAYS', sub: 'Serious operators only' },
  { id: 100, label: '100 DAYS', sub: 'Legendary status' },
];

const FREEZE_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function CommitmentScreen() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const start = Date.now();
  const [duration, setDuration] = useState<number | null>(null);
  const [freezeDay, setFreezeDay] = useState<string | null>(null);

  useEffect(() => {
    track('onboarding_step_3');
    trackScreenLoad('onboarding_commitment', start);
  }, []);

  const handleContinue = async () => {
    if (!duration) return;
    track('onboarding_step_3_continue', { duration, freezeDay });
    await saveOnboardingAnswers({ challengeDuration: duration, weeklyFreezeDay: freezeDay ?? undefined });
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

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(80).duration(500)}>
          <Text style={s.stepLabel}>STEP 3 OF 5</Text>
          <Text style={s.title}>SET YOUR{'\n'}COMMITMENT</Text>
          <View style={s.divider} />
          <Text style={s.sectionHead}>DURATION</Text>
        </Animated.View>

        {DURATIONS.map((d, index) => (
          <Animated.View key={d.id} entering={FadeInDown.delay(100 + index * 50).duration(400)}>
            <Pressable
              style={[s.card, duration === d.id && s.cardActive]}
              onPress={() => setDuration(d.id)}
              accessibilityLabel={`Select ${d.label} duration`}
            >
              <Text style={[s.cardTitle, duration === d.id && s.cardTitleActive]}>{d.label}</Text>
              <Text style={s.cardSub}>{d.sub}</Text>
            </Pressable>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={[s.sectionHead, { marginTop: 24 }]}>WEEKLY FREEZE DAY (OPTIONAL)</Text>
          <Text style={s.hint}>{"One day per week where missing doesn't break your streak."}</Text>
          <View style={s.freezeRow}>
            {FREEZE_DAYS.map((day) => (
              <Pressable
                key={day}
                style={[s.freezeBtn, freezeDay === day && s.freezeBtnActive]}
                onPress={() => setFreezeDay(freezeDay === day ? null : day)}
                accessibilityLabel={`Set ${day} as freeze day`}
              >
                <Text style={[s.freezeText, freezeDay === day && s.freezeTextActive]}>{day}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={s.footer}>
        <Pressable
          style={({ pressed }) => [s.cta, !duration && s.ctaDisabled, pressed && duration ? s.ctaPressed : {}]}
          onPress={handleContinue}
          disabled={!duration}
          accessibilityLabel="Continue to step 4"
        >
          <Text style={s.ctaText}>NEXT</Text>
        </Pressable>
      </View>
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
    stepLabel: { fontFamily: 'JosefinSans_700Bold', fontSize: 11, letterSpacing: 4, color: colors.accent, marginBottom: 8 },
    title: { fontFamily: 'JosefinSans_700Bold', fontSize: 36, color: colors.text, letterSpacing: 3, lineHeight: 44 },
    divider: { width: 48, height: 3, backgroundColor: colors.accent, marginTop: 16, marginBottom: 24 },
    sectionHead: { fontFamily: 'JosefinSans_700Bold', fontSize: 11, letterSpacing: 4, color: colors.textSecondary, marginBottom: 12 },
    card: { borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 8, minHeight: 64, justifyContent: 'center' },
    cardActive: { borderColor: colors.accent, backgroundColor: colors.surface },
    cardTitle: { fontFamily: 'JosefinSans_700Bold', fontSize: 14, letterSpacing: 3, color: colors.textSecondary, marginBottom: 2 },
    cardTitleActive: { color: colors.accent },
    cardSub: { fontFamily: 'Manrope_400Regular', fontSize: 13, color: colors.textSecondary },
    hint: { fontFamily: 'Manrope_400Regular', fontSize: 13, color: colors.textMuted, marginBottom: 12, lineHeight: 20 },
    freezeRow: { flexDirection: 'row', gap: 8 },
    freezeBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, paddingVertical: 10, alignItems: 'center', minHeight: 44 },
    freezeBtnActive: { borderColor: colors.accent, backgroundColor: colors.surface },
    freezeText: { fontFamily: 'JosefinSans_700Bold', fontSize: 10, letterSpacing: 2, color: colors.textSecondary },
    freezeTextActive: { color: colors.accent },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12, backgroundColor: colors.background },
    cta: { backgroundColor: colors.accent, paddingVertical: 18, alignItems: 'center' },
    ctaDisabled: { opacity: 0.35 },
    ctaPressed: { opacity: 0.8 },
    ctaText: { fontFamily: 'JosefinSans_700Bold', fontSize: 16, letterSpacing: 3, color: colors.textOnPrimary },
  });
