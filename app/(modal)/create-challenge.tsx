import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trackScreenLoad } from '@/lib/performance';
import { captureException } from '@/lib/sentry';

const DURATION_PRESETS = [7, 14, 21, 30, 60, 75];

export default function CreateChallengeModal() {
  const colors = useThemeColors();
  const router = useRouter();
  const { track } = useAnalytics();
  const startTime = useRef(Date.now());

  const [name, setName] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [commitments, setCommitments] = useState<string[]>(['']);

  const ctaScale = useSharedValue(1);
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));

  React.useEffect(() => {
    track('create_challenge_viewed', {});
    trackScreenLoad('CreateChallenge', startTime.current);
  }, []);

  const effectiveDuration = showCustom ? parseInt(customDuration, 10) || null : duration;
  const isValid = name.trim().length > 0 && (effectiveDuration ?? 0) > 0 && commitments.some(c => c.trim().length > 0);

  const handleDurationChip = useCallback((d: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDuration(d); setShowCustom(false);
  }, []);

  const handleCustomChip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCustom(true); setDuration(null);
  }, []);

  const addCommitment = useCallback(() => {
    if (commitments.length >= 3) return;
    setCommitments(prev => [...prev, '']);
  }, [commitments.length]);

  const removeCommitment = useCallback((i: number) => {
    setCommitments(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  const updateCommitment = useCallback((i: number, val: string) => {
    setCommitments(prev => prev.map((c, idx) => idx === i ? val : c));
  }, []);

  const handleContinue = useCallback(() => {
    if (!isValid) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      ctaScale.value = withSpring(0.97, { damping: 15 }, () => { ctaScale.value = withSpring(1); });
      track('create_challenge_continue', { name, duration: effectiveDuration, commitments });
      router.push({ pathname: '/(modal)/paywall', params: { challengeName: name, duration: String(effectiveDuration), commitments: JSON.stringify(commitments.filter(c => c.trim())) } });
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)), { screen: 'CreateChallenge', action: 'continue' });
    }
  }, [isValid, name, effectiveDuration, commitments]);

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.delay(0).springify()}>
            <Text style={s.header}>Build Your Challenge</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(50).springify()} style={s.section}>
            <Text style={s.label}>Challenge Name</Text>
            <TextInput style={[s.underlineInput, nameFocused && s.underlineFocused]} placeholder="e.g. No Sugar for 30 Days" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)} accessibilityLabel="Challenge name" accessibilityHint="Enter a name for your custom challenge" />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.section}>
            <Text style={s.label}>Duration (days)</Text>
            <View style={s.chips}>
              {DURATION_PRESETS.map(d => (
                <Pressable key={d} onPress={() => handleDurationChip(d)} style={[s.chip, duration === d && !showCustom && s.chipActive]} accessibilityLabel={`${d} days`} accessibilityHint={`Set duration to ${d} days`}>
                  <Text style={[s.chipText, duration === d && !showCustom && s.chipTextActive]}>{d}</Text>
                </Pressable>
              ))}
              <Pressable onPress={handleCustomChip} style={[s.chip, showCustom && s.chipActive]} accessibilityLabel="Custom duration" accessibilityHint="Enter a custom number of days">
                <Text style={[s.chipText, showCustom && s.chipTextActive]}>Custom</Text>
              </Pressable>
            </View>
            {showCustom && (
              <TextInput style={[s.underlineInput, s.monoInput]} keyboardType="number-pad" placeholder="Enter days" placeholderTextColor={colors.textMuted} value={customDuration} onChangeText={setCustomDuration} accessibilityLabel="Custom day count" accessibilityHint="Type the number of days for your challenge" />
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).springify()} style={s.section}>
            <Text style={s.label}>Daily Commitments</Text>
            {commitments.map((c, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(50 * i).springify()} style={s.commitRow}>
                <TextInput style={[s.underlineInput, { flex: 1 }]} placeholder={`Commitment ${i + 1}`} placeholderTextColor={colors.textMuted} value={c} onChangeText={v => updateCommitment(i, v)} accessibilityLabel={`Commitment ${i + 1}`} accessibilityHint="Enter a daily action for this challenge" />
                {commitments.length > 1 && (
                  <Pressable onPress={() => removeCommitment(i)} style={s.removeBtn} accessibilityLabel="Remove commitment" accessibilityHint="Removes this commitment field">
                    <X size={18} color={colors.textMuted} />
                  </Pressable>
                )}
              </Animated.View>
            ))}
            {commitments.length < 3 && (
              <Pressable onPress={addCommitment} style={s.addBtn} accessibilityLabel="Add commitment" accessibilityHint="Adds another daily commitment input">
                <Plus size={16} color={colors.primary} />
                <Text style={s.addText}>Add commitment</Text>
              </Pressable>
            )}
          </Animated.View>

          {(name.trim() || effectiveDuration) ? (
            <Animated.View entering={FadeInDown.delay(200).springify()} style={s.preview}>
              <Text style={s.previewLabel}>Preview</Text>
              <Text style={s.previewName}>{name.trim() || 'Your Challenge'}</Text>
              <Text style={s.previewMeta}>{effectiveDuration ? `${effectiveDuration} days` : ', '} · {commitments.filter(c => c.trim()).length} commitment{commitments.filter(c => c.trim()).length !== 1 ? 's' : ''}</Text>
            </Animated.View>
          ) : null}
        </ScrollView>

        <Animated.View style={[s.ctaWrap, ctaStyle]}>
          <Pressable onPress={handleContinue} style={[s.cta, !isValid && s.ctaDisabled]} disabled={!isValid} accessibilityLabel="Continue to Commitment Screen" accessibilityHint="Saves challenge and proceeds to set your commitment">
            <Text style={s.ctaText}>Continue to Commitment Screen</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = (c: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  scroll: { padding: 24, paddingBottom: 16 },
  header: { fontFamily: 'JosefinSans_700Bold', fontSize: 26, color: c.text, marginBottom: 28 },
  section: { marginBottom: 28 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: c.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  underlineInput: { borderBottomWidth: 1.5, borderBottomColor: c.border, paddingVertical: 8, fontSize: 16, color: c.text, fontFamily: 'Inter_400Regular', backgroundColor: 'transparent' },
  underlineFocused: { borderBottomColor: c.primary },
  monoInput: { fontFamily: 'Inter_400Regular', fontSize: 20, marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: c.border, minHeight: 44, justifyContent: 'center' },
  chipActive: { borderColor: c.primary, backgroundColor: c.primaryMuted },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: c.textSecondary },
  chipTextActive: { color: c.primary },
  commitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  removeBtn: { padding: 10, marginLeft: 8, minHeight: 44, justifyContent: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10, minHeight: 44 },
  addText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: c.primary, marginLeft: 6 },
  preview: { borderRadius: 14, backgroundColor: c.surfaceElevated, padding: 18, marginBottom: 8, borderWidth: 1, borderColor: c.borderAccent },
  previewLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  previewName: { fontFamily: 'JosefinSans_700Bold', fontSize: 20, color: c.text, marginBottom: 4 },
  previewMeta: { fontFamily: 'Inter_400Regular', fontSize: 14, color: c.textSecondary },
  ctaWrap: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8 },
  cta: { backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', minHeight: 54 },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: c.textOnPrimary },
});
