import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { saveOnboardingAnswers, markOnboardingComplete } from '@/lib/onboarding-buffer';
import { trackScreenLoad } from '@/lib/performance';

const STEP = 5;
const TOTAL = 5;

export default function LandsOnTodayTabAsDay1Screen() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const start = Date.now();

  useEffect(() => {
    track('onboarding_step_5');
    trackScreenLoad('onboarding_day1_preview', start);
  }, []);

  const handleContinue = async () => {
    track('onboarding_complete');
    await saveOnboardingAnswers({ startDay: new Date().toISOString() });
    await markOnboardingComplete();
    router.replace('/(auth)/signup');
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
        <Text style={s.stepLabel}>STEP 5 OF 5</Text>
        <Text style={s.eyebrow}>STARTING TODAY</Text>
        <View style={s.dayCard}>
          <Text style={s.dayNumber}>DAY</Text>
          <Text style={s.dayCount}>1</Text>
          <View style={s.dayDivider} />
          <Text style={s.dayDate}>{new Date().toDateString().toUpperCase()}</Text>
        </View>

        <Text style={s.rulesHead}>THE CONTRACT</Text>
        {[
          'Log every day without exception.',
          'One weekly freeze, use it deliberately.',
          'At the finish line: your verified proof card.',
          'Every completed arc is permanent record.',
        ].map((rule, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(200 + i * 60).duration(400)} style={s.ruleRow}>
            <View style={s.ruleDot} />
            <Text style={s.ruleText}>{rule}</Text>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(480).duration(400)} style={s.statRow}>
          {[
            { label: 'STREAK', value: '0' },
            { label: 'COMPLETED', value: '0' },
            { label: 'FREEZE LEFT', value: '1' },
          ].map((stat) => (
            <View key={stat.label} style={s.statBox}>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(560).duration(500)} style={s.footer}>
        <Pressable
          style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
          onPress={handleContinue}
          accessibilityLabel="Create your account and begin"
          accessibilityHint="Opens sign-up screen to save your progress"
        >
          <Text style={s.ctaText}>CREATE ACCOUNT, BEGIN</Text>
        </Pressable>
        <Text style={s.footerNote}>{"Your challenge settings are saved. Create an account to lock them in."}</Text>
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
    eyebrow: { fontFamily: 'JosefinSans_700Bold', fontSize: 13, letterSpacing: 5, color: colors.textSecondary, marginBottom: 16 },
    dayCard: { borderWidth: 1, borderColor: colors.accent, padding: 24, marginBottom: 28, alignItems: 'center', backgroundColor: colors.surface },
    dayNumber: { fontFamily: 'JosefinSans_700Bold', fontSize: 14, letterSpacing: 6, color: colors.textSecondary },
    dayCount: { fontFamily: 'JosefinSans_700Bold', fontSize: 72, color: colors.accent, lineHeight: 80 },
    dayDivider: { width: 32, height: 2, backgroundColor: colors.border, marginVertical: 12 },
    dayDate: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, letterSpacing: 2, color: colors.textSecondary },
    rulesHead: { fontFamily: 'JosefinSans_700Bold', fontSize: 11, letterSpacing: 4, color: colors.textSecondary, marginBottom: 16 },
    ruleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    ruleDot: { width: 6, height: 6, backgroundColor: colors.accent, marginTop: 6, marginRight: 12 },
    ruleText: { fontFamily: 'Manrope_400Regular', fontSize: 14, color: colors.text, flex: 1, lineHeight: 22 },
    statRow: { flexDirection: 'row', gap: 8, marginTop: 24 },
    statBox: { flex: 1, borderWidth: 1, borderColor: colors.border, padding: 12, alignItems: 'center', backgroundColor: colors.surface },
    statValue: { fontFamily: 'JosefinSans_700Bold', fontSize: 28, color: colors.text },
    statLabel: { fontFamily: 'JosefinSans_700Bold', fontSize: 9, letterSpacing: 3, color: colors.textSecondary, marginTop: 4 },
    footer: { paddingBottom: 24, gap: 12 },
    cta: { backgroundColor: colors.accent, paddingVertical: 18, alignItems: 'center' },
    ctaPressed: { opacity: 0.8 },
    ctaText: { fontFamily: 'JosefinSans_700Bold', fontSize: 14, letterSpacing: 3, color: colors.textOnPrimary },
    footerNote: { fontFamily: 'Manrope_400Regular', fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  });
