import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { saveOnboardingAnswers } from '@/lib/onboarding-buffer';
import { trackScreenLoad } from '@/lib/performance';

const STEP = 2;
const TOTAL = 5;

const CHALLENGES = [
  { id: 'fitness', label: 'DAILY TRAINING', sub: 'Move every day without exception' },
  { id: 'cold', label: 'COLD SHOWERS', sub: '30 days of controlled discomfort' },
  { id: 'reading', label: 'DEEP READING', sub: 'One hour of focused reading daily' },
  { id: 'sobriety', label: 'SOBRIETY', sub: 'Prove absolute self-command' },
  { id: 'diet', label: 'CLEAN DIET', sub: 'No processed food for the duration' },
  { id: 'custom', label: 'CUSTOM', sub: 'Define your own hard standard' },
];

export default function ChallengePickerScreen() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const start = Date.now();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    track('onboarding_step_2');
    trackScreenLoad('onboarding_challenge_picker', start);
  }, []);

  const handleContinue = async () => {
    if (!selected) return;
    track('onboarding_step_2_continue', { challengeType: selected });
    await saveOnboardingAnswers({ challengeType: selected });
    router.push('/(auth)/onboarding/commitment-screen');
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

      <Animated.View entering={FadeInDown.delay(80).duration(500)}>
        <Text style={s.stepLabel}>STEP 2 OF 5</Text>
        <Text style={s.title}>CHOOSE YOUR{'\n'}CHALLENGE</Text>
        <View style={s.divider} />
      </Animated.View>

      <FlatList
        data={CHALLENGES}
        keyExtractor={(item) => item.id}
        style={{ flex: 1, marginTop: 16 }}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(100 + index * 50).duration(400)}>
            <Pressable
              style={[s.card, selected === item.id && s.cardSelected]}
              onPress={() => { setSelected(item.id); track('challenge_type_selected', { type: item.id }); }}
              accessibilityLabel={`Select ${item.label} challenge`}
              accessibilityHint="Tap to select this challenge type"
            >
              <Text style={[s.cardTitle, selected === item.id && s.cardTitleActive]}>{item.label}</Text>
              <Text style={s.cardSub}>{item.sub}</Text>
            </Pressable>
          </Animated.View>
        )}
      />

      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={s.footer}>
        <Pressable
          style={({ pressed }) => [s.cta, !selected && s.ctaDisabled, pressed && selected && s.ctaPressed]}
          onPress={handleContinue}
          disabled={!selected}
          accessibilityLabel="Continue to step 3"
          accessibilityHint="Moves to commitment level screen"
        >
          <Text style={s.ctaText}>NEXT</Text>
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
    stepLabel: { fontFamily: 'JosefinSans_700Bold', fontSize: 11, letterSpacing: 4, color: colors.accent, marginBottom: 8 },
    title: { fontFamily: 'JosefinSans_700Bold', fontSize: 36, color: colors.text, letterSpacing: 3, lineHeight: 44 },
    divider: { width: 48, height: 3, backgroundColor: colors.accent, marginTop: 16 },
    card: { borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 10, minHeight: 72, justifyContent: 'center' },
    cardSelected: { borderColor: colors.accent, backgroundColor: colors.surface },
    cardTitle: { fontFamily: 'JosefinSans_700Bold', fontSize: 14, letterSpacing: 3, color: colors.textSecondary, marginBottom: 4 },
    cardTitleActive: { color: colors.accent },
    cardSub: { fontFamily: 'Manrope_400Regular', fontSize: 13, color: colors.textSecondary },
    footer: { paddingBottom: 24, paddingTop: 8 },
    cta: { backgroundColor: colors.accent, paddingVertical: 18, alignItems: 'center' },
    ctaDisabled: { opacity: 0.35 },
    ctaPressed: { opacity: 0.8 },
    ctaText: { fontFamily: 'JosefinSans_700Bold', fontSize: 16, letterSpacing: 3, color: colors.textOnPrimary },
  });
