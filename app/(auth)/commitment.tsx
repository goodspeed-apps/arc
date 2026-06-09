import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, useSharedValue, withSpring, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trackScreenLoad } from '@/lib/performance';

const COMMITMENTS = [
  "Complete all daily tasks without skipping.",
  "Log your progress honestly every day.",
  "No substitutions, do the work as written.",
  "Miss a day and the streak resets. No exceptions.",
  "One freeze per 7 days. That's your only safety net.",
];

export default function CommitmentScreen() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const [state, setState] = useState<'reading' | 'accepted'>('reading');
  const scale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const start = useRef(Date.now());

  useEffect(() => {
    track('onboarding_commitment_viewed');
    trackScreenLoad('CommitmentScreen', start.current);
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleAccept = async () => {
    scale.value = withSpring(0.97, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    ringOpacity.value = withSequence(withTiming(1, { duration: 200 }), withTiming(0, { duration: 600 }));
    ringScale.value = withSequence(withTiming(1.4, { duration: 400 }), withTiming(1, { duration: 200 }));
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setState('accepted');
    track('onboarding_commitment_accepted');
    router.push('/(auth)/reminder-setup' as never);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 28, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, letterSpacing: 2, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 12 }}>
            Your Challenge
          </Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 48, color: colors.accent, lineHeight: 52, marginBottom: 16 }}>
            75 HARD
          </Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: colors.text, marginBottom: 40, letterSpacing: 1 }}>
            75 DAYS · Ends Dec 3
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={{ marginBottom: 40 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, letterSpacing: 2, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 20 }}>
            Daily Commitments
          </Text>
          {COMMITMENTS.map((item, i) => (
            <Animated.View key={i} entering={FadeInDown.duration(400).delay(150 + i * 50)}
              style={{ flexDirection: 'row', marginBottom: 18, alignItems: 'flex-start' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.accent, width: 28, marginTop: 1 }}>{i + 1}.</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.text, flex: 1, lineHeight: 24 }}>{item}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(450)}
          style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 28, marginBottom: 32 }}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, lineHeight: 22, textAlign: 'center' }}>
            {"By accepting, you enter a binding commitment with yourself. No excuses. No shortcuts."}
          </Text>
        </Animated.View>

        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Animated.View style={[{ position: 'absolute', width: 320, height: 64, borderRadius: 32, borderWidth: 2, borderColor: colors.accent }, ringStyle]} />
          <Animated.View style={[{ width: '100%' }, btnStyle]}>
            <Pressable onPress={handleAccept} disabled={state === 'accepted'}
              accessibilityLabel="I Accept the Challenge" accessibilityHint="Confirms your commitment and proceeds to reminder setup"
              style={{ backgroundColor: state === 'accepted' ? colors.primaryMuted : colors.accent, borderRadius: 14, paddingVertical: 18, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.textOnPrimary, letterSpacing: 0.5 }}>
                {state === 'accepted' ? "Accepted ✓" : "I Accept the Challenge"}
              </Text>
            </Pressable>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.duration(400).delay(550)} style={{ alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Choose a different challenge" accessibilityHint="Go back to challenge selection">
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.textSecondary, textDecorationLine: 'underline' }}>
              Choose a different challenge
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
