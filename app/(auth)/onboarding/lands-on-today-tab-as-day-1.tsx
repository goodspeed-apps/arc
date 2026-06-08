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

export default function LandsOnTodayTabAsDay1() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const startTime = React.useRef(Date.now());

  useEffect(() => {
    track('onboarding_step_5');
    trackScreenLoad('onboarding_day1_preview', startTime.current);
  }, []);

  const handleBegin = async () => {
    await saveOnboardingAnswers({});
    await markOnboardingComplete();
    track('onboarding_completed');
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

      <Animated.View entering={FadeInDown.delay(80).springify()} style={s.hero}>
        <Text style={s.stepLabel}>STEP {STEP} OF {TOTAL}</Text>
        <Text style={s.dayTag}>DAY 1</Text>
        <View style={s.divider} />
        <Text style={s.headline}>{"YOUR ARC\nSTARTS NOW."}</Text>
        <Text style={s.body}>
          {"Every day you complete your challenge, your Arc grows. Miss a day outside your freeze and it resets. Finish the full run and earn your proof card, a verified record of what you did."}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(260).springify()} style={s.recordCard}>
        <View style={s.recordRow}>
          <Text style={s.recordLabel}>STATUS</Text>
          <Text style={s.recordValue}>ACTIVE</Text>
        </View>
        <View style={s.sep} />
        <View style={s.recordRow}>
          <Text style={s.recordLabel}>CURRENT STREAK</Text>
          <Text style={s.recordValue}>0 DAYS</Text>
        </View>
        <View style={s.sep} />
        <View style={s.recordRow}>
          <Text style={s.recordLabel}>PROOF CARD</Text>
          <Text style={s.recordValueMuted}>LOCKED, FINISH TO EARN</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).springify()} style={s.rulesBlock}>
        <Text style={s.rulesTitle}>THE CONTRACT</Text>
        {[
          'Log your status every day.',
          'One freeze per week, no excuses beyond that.',
          'Complete all days to unlock your proof card.',
          "Your record is permanent. It doesn't disappear.",
        ].map((rule, i) => (
          <View key={i} style={s.ruleRow}>
            <View style={s.ruleDot} />
            <Text style={s.ruleText}>{rule}</Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(560).springify()} style={s.footer}>
        <Pressable
          style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
          onPress={handleBegin}
          accessibilityLabel="Create your account and begin"
          accessibilityHint="Takes you to signup to create your Arc account"
        >
          <Text style={s.ctaText}>CREATE ACCOUNT & BEGIN</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
    header: { marginTop: 20, marginBottom: 24 },
    back: { marginBottom: 12 },
    backText: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, letterSpacing: 2, color: colors.textSecondary },
    progress: { flexDirection: 'row', gap: 6 },
    pip: { flex: 1, height: 3, backgroundColor: colors.border },
    pipActive: { backgroundColor: colors.accent },
    hero: { marginBottom: 24 },
    stepLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 11, letterSpacing: 4, color: colors.accent, marginBottom: 10 },
    dayTag: {
      fontFamily: 'JosefinSans_700Bold', fontSize: 64, letterSpacing: 4,
      color: colors.accent, lineHeight: 68, marginBottom: 8,
    },
    divider: { width: 48, height: 2, backgroundColor: colors.accent, marginBottom: 16 },
    headline: { fontFamily: 'JosefinSans_700Bold', fontSize: 36, letterSpacing: 2, color: colors.text, lineHeight: 40, marginBottom: 14 },
    body: { fontFamily: 'Manrope_400Regular', fontSize: 14, lineHeight: 22, color: colors.textSecondary },
    recordCard: {
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
      paddingHorizontal: 18, marginBottom: 20,
    },
    recordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
    recordLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 10, letterSpacing: 3, color: colors.textMuted },
    recordValue: { fontFamily: 'JosefinSans_700Bold', fontSize: 13, letterSpacing: 2, color: colors.accent },
    recordValueMuted: { fontFamily: 'Manrope_400Regular', fontSize: 11, letterSpacing: 1, color: colors.textMuted },
    sep: { height: 1, backgroundColor: colors.border },
    rulesBlock: { marginBottom: 24 },
    rulesTitle: { fontFamily: 'Manrope_700Bold', fontSize: 10, letterSpacing: 4, color: colors.textMuted, marginBottom: 12 },
    ruleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
    ruleDot: { width: 6, height: 6, backgroundColor: colors.accent, marginTop: 5 },
    ruleText: { flex: 1, fontFamily: 'Manrope_400Regular', fontSize: 13, lineHeight: 20, color: colors.textSecondary },
    footer: { marginTop: 'auto', paddingBottom: 16 },
    cta: { backgroundColor: colors.accent, paddingVertical: 18, alignItems: 'center' },
    ctaPressed: { opacity: 0.82 },
    ctaText: { fontFamily: 'JosefinSans_700Bold', fontSize: 14, letterSpacing: 3, color: colors.textOnPrimary },
  });
