import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trackScreenLoad } from '@/lib/performance';

const DURATION_PRESETS = [7, 14, 21, 30, 60, 75];

export default function CreateChallengeScreen() {
  const colors = useThemeColors();
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
    track('create_challenge_viewed');
    trackScreenLoad('CreateChallenge', startTime.current);
  }, []);

  const effectiveDuration = showCustom ? parseInt(customDuration || '0', 10) : (duration ?? 0);
  const isValid = name.trim().length > 0 && effectiveDuration > 0 && commitments.some(c => c.trim().length > 0);

  const addCommitment = () => {
    if (commitments.length < 3) setCommitments(prev => [...prev, '']);
  };

  const removeCommitment = (i: number) => {
    setCommitments(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateCommitment = (i: number, val: string) => {
    setCommitments(prev => prev.map((c, idx) => (idx === i ? val : c)));
  };

  const handleDurationPress = useCallback((days: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDuration(days);
    setShowCustom(false);
  }, []);

  const handleContinue = useCallback(() => {
    if (!isValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ctaScale.value = withSpring(0.97, { damping: 15 }, () => { ctaScale.value = withSpring(1); });
    track('create_challenge_continue', { name, duration: effectiveDuration, commitmentCount: commitments.filter(c => c.trim()).length });
    router.push({ pathname: '/(modal)/paywall', params: { name, duration: String(effectiveDuration), commitments: JSON.stringify(commitments.filter(c => c.trim())) } });
  }, [isValid, name, effectiveDuration, commitments]);

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={s.header}>Build Your Challenge</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Challenge name"
              placeholderTextColor={colors.textMuted}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              style={[s.nameInput, { borderBottomColor: nameFocused ? colors.accent : colors.border }]}
              accessibilityLabel="Challenge name" accessibilityHint="Enter a name for your custom challenge"
            />

            <Text style={s.sectionLabel}>Duration</Text>
            <View style={s.chips}>
              {DURATION_PRESETS.map((d, i) => (
                <Animated.View key={d} entering={FadeInDown.delay(50 * i).duration(300)}>
                  <Pressable
                    onPress={() => handleDurationPress(d)}
                    style={[s.chip, duration === d && !showCustom && { backgroundColor: colors.accent }]}
                    accessibilityLabel={`${d} days`} accessibilityHint={`Set challenge duration to ${d} days`}
                  >
                    <Text style={[s.chipText, duration === d && !showCustom && { color: colors.textOnPrimary }]}>{d}</Text>
                  </Pressable>
                </Animated.View>
              ))}
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCustom(true); setDuration(null); }} style={[s.chip, showCustom && { backgroundColor: colors.accent }]} accessibilityLabel="Custom duration" accessibilityHint="Enter a custom number of days">
                <Text style={[s.chipText, showCustom && { color: colors.textOnPrimary }]}>Custom</Text>
              </Pressable>
            </View>
            {showCustom && (
              <TextInput value={customDuration} onChangeText={setCustomDuration} keyboardType="numeric" placeholder="Enter days" placeholderTextColor={colors.textMuted} style={[s.nameInput, { borderBottomColor: colors.accent }]} accessibilityLabel="Custom days" accessibilityHint="Type number of days for your challenge" />
            )}

            <Text style={s.sectionLabel}>Daily Commitments</Text>
            {commitments.map((c, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(50 * i).duration(300)} style={s.commitRow}>
                <TextInput value={c} onChangeText={v => updateCommitment(i, v)} placeholder={`Commitment ${i + 1}`} placeholderTextColor={colors.textMuted} style={[s.commitInput, { borderBottomColor: colors.border }]} accessibilityLabel={`Commitment ${i + 1}`} accessibilityHint="Describe a daily action for this challenge" />
                {commitments.length > 1 && (
                  <Pressable onPress={() => removeCommitment(i)} style={s.removeBtn} accessibilityLabel="Remove commitment" accessibilityHint="Remove this commitment field">
                    <X size={16} color={colors.textMuted} />
                  </Pressable>
                )}
              </Animated.View>
            ))}
            {commitments.length < 3 && (
              <Pressable onPress={addCommitment} style={s.addBtn} accessibilityLabel="Add commitment" accessibilityHint="Add another daily commitment field">
                <Plus size={16} color={colors.accent} />
                <Text style={[s.addBtnText, { color: colors.accent }]}>Add commitment</Text>
              </Pressable>
            )}

            {isValid && (
              <Animated.View entering={FadeInDown.duration(400)} style={[s.preview, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderAccent }]}>
                <Text style={[s.previewTitle, { color: colors.text }]}>{name}</Text>
                <Text style={[s.previewMeta, { color: colors.textSecondary }]}>{effectiveDuration} days · {commitments.filter(c => c.trim()).length} commitment{commitments.filter(c => c.trim()).length !== 1 ? 's' : ''}</Text>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>

        <Animated.View style={[s.ctaWrap, ctaStyle]}>
          <Pressable onPress={handleContinue} disabled={!isValid} style={[s.cta, { backgroundColor: isValid ? colors.accent : colors.border }]} accessibilityLabel="Continue to commitment screen" accessibilityHint="Saves your challenge and continues">
            <Text style={[s.ctaText, { color: colors.textOnPrimary }]}>Continue to Commitment Screen</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingBottom: 16 },
  header: { fontSize: 28, fontFamily: 'JosefinSans_700Bold', color: colors.text, marginBottom: 28 },
  nameInput: { fontSize: 18, fontFamily: 'Outfit_400Regular', color: colors.text, borderBottomWidth: 1.5, paddingBottom: 8, marginBottom: 28 },
  sectionLabel: { fontSize: 13, fontFamily: 'Outfit_600SemiBold', color: colors.textSecondary, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipText: { fontSize: 14, fontFamily: 'Outfit_500Medium', color: colors.text },
  commitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  commitInput: { flex: 1, fontSize: 16, fontFamily: 'Outfit_400Regular', color: colors.text, borderBottomWidth: 1, paddingBottom: 6 },
  removeBtn: { marginLeft: 10, padding: 6 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 24, minHeight: 44 },
  addBtnText: { fontSize: 15, fontFamily: 'Outfit_500Medium' },
  preview: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 8, marginBottom: 24 },
  previewTitle: { fontSize: 18, fontFamily: 'JosefinSans_700Bold', marginBottom: 4 },
  previewMeta: { fontSize: 14, fontFamily: 'Outfit_400Regular' },
  ctaWrap: { paddingHorizontal: 24, paddingBottom: 20, paddingTop: 8, backgroundColor: colors.background },
  cta: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontSize: 16, fontFamily: 'Outfit_700Bold' },
});
