import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, TextInput, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
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
  { id: 'cold_shower', label: 'COLD SHOWERS' },
  { id: 'no_alcohol', label: 'NO ALCOHOL' },
  { id: 'daily_run', label: 'DAILY RUN' },
  { id: 'no_junk_food', label: 'NO JUNK FOOD' },
  { id: 'meditation', label: 'MEDITATION' },
  { id: 'reading', label: '30-MIN READING' },
  { id: 'custom', label: 'MY OWN CHALLENGE' },
];

export default function ChallengePicker() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const startTime = React.useRef(Date.now());
  const [selected, setSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState('');

  useEffect(() => {
    track('onboarding_step_2');
    trackScreenLoad('onboarding_challenge_picker', startTime.current);
  }, []);

  const canContinue = selected !== null && (selected !== 'custom' || custom.trim().length > 0);

  const handleContinue = async () => {
    await saveOnboardingAnswers({
      primaryChallenge: selected ?? undefined,
      customChallenge: selected === 'custom' ? custom.trim() : undefined,
    });
    router.push('/(auth)/onboarding/commitment-screen');
  };

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
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
          <Text style={s.headline}>{"PICK YOUR\nCHALLENGE."}</Text>
        </Animated.View>

        <FlatList
          data={CHALLENGES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(80 + index * 50).springify()}>
              <Pressable
                style={[s.card, selected === item.id && s.cardActive]}
                onPress={() => setSelected(item.id)}
                accessibilityLabel={item.label}
                accessibilityHint="Select this challenge"
              >
                <Text style={[s.cardText, selected === item.id && s.cardTextActive]}>
                  {item.label}
                </Text>
                {selected === item.id && <View style={s.dot} />}
              </Pressable>
              {item.id === 'custom' && selected === 'custom' && (
                <TextInput
                  style={s.input}
                  placeholder="DESCRIBE YOUR CHALLENGE"
                  placeholderTextColor={colors.textMuted}
                  value={custom}
                  onChangeText={setCustom}
                  autoFocus
                />
              )}
            </Animated.View>
          )}
        />

        <Animated.View entering={FadeInDown.delay(480).springify()} style={s.footer}>
          <Pressable
            style={({ pressed }) => [s.cta, !canContinue && s.ctaDisabled, pressed && canContinue && s.ctaPressed]}
            onPress={canContinue ? handleContinue : undefined}
            accessibilityLabel="Continue to next step"
            accessibilityHint="Confirm your challenge selection"
          >
            <Text style={s.ctaText}>NEXT</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
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
    headline: { fontFamily: 'JosefinSans_700Bold', fontSize: 40, letterSpacing: 2, color: colors.text, lineHeight: 44, marginBottom: 24 },
    card: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderWidth: 1, borderColor: colors.border,
      paddingVertical: 16, paddingHorizontal: 18, marginBottom: 8,
      backgroundColor: colors.surface, minHeight: 56,
    },
    cardActive: { borderColor: colors.accent, backgroundColor: colors.surfaceElevated },
    cardText: { fontFamily: 'JosefinSans_700Bold', fontSize: 13, letterSpacing: 2, color: colors.textSecondary },
    cardTextActive: { color: colors.accent },
    dot: { width: 8, height: 8, backgroundColor: colors.accent },
    input: {
      borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.surface,
      paddingVertical: 14, paddingHorizontal: 18, marginBottom: 8,
      fontFamily: 'Manrope_400Regular', fontSize: 14, color: colors.text, letterSpacing: 1,
    },
    footer: { paddingBottom: 16 },
    cta: { backgroundColor: colors.accent, paddingVertical: 18, alignItems: 'center' },
    ctaDisabled: { backgroundColor: colors.border },
    ctaPressed: { opacity: 0.82 },
    ctaText: { fontFamily: 'JosefinSans_700Bold', fontSize: 15, letterSpacing: 3, color: colors.textOnPrimary },
  });
