import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trackScreenLoad } from '@/lib/performance';

const COMMITMENTS = [
  "Complete every daily task without skipping.",
  "Log your progress before midnight each day.",
  "No substitutions, all tasks or the day is missed.",
  "One freeze per 7 days. That's your only safety net.",
  "Miss a day without a freeze? The streak resets.",
];

export default function CommitmentScreen() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const startTime = useRef(Date.now());
  const [accepted, setAccepted] = useState(false);
  const scale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(1);

  const params = useLocalSearchParams<{ name?: string; duration?: string; endDate?: string }>();
  const challengeName = params.name ?? 'THE 75 DAY CHALLENGE';
  const duration = params.duration ?? '75';
  const endDate = params.endDate ?? 'Dec 3';

  useEffect(() => {
    track('onboarding_commitment_viewed', { challenge: challengeName });
    trackScreenLoad('CommitmentScreen', startTime.current);
  }, []);

  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ringOpacity.value, transform: [{ scale: ringScale.value }] }));

  const handleAccept = async () => {
    if (accepted) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = withSequence(withSpring(0.95, { damping: 10 }), withSpring(1, { damping: 12 }));
    ringOpacity.value = withSequence(withSpring(0.6), withSpring(0));
    ringScale.value = withSequence(withSpring(1.35, { damping: 8 }), withSpring(1));
    setAccepted(true);
    track('onboarding_commitment_accepted', { challenge: challengeName });
    router.push('/(auth)/reminder-setup');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 28, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500).delay(0)}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, letterSpacing: 3, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 16 }}>
            Your Commitment
          </Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 40, lineHeight: 46, color: colors.accent, textTransform: 'uppercase', marginBottom: 8 }}>
            {challengeName}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, letterSpacing: 2, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 40 }}>
            {duration} DAYS · Ends {endDate}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 32, marginBottom: 40 }}>
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, letterSpacing: 2, color: colors.text, textTransform: 'uppercase', marginBottom: 20 }}>
            The Rules
          </Text>
          {COMMITMENTS.map((item, index) => (
            <Animated.View key={index} entering={FadeInDown.duration(400).delay(150 + index * 50)} style={{ flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.accent, width: 24, marginTop: 1 }}>{index + 1}.</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, color: index === 3 ? colors.text : colors.textSecondary, flex: 1, fontWeight: index === 3 ? '600' : '400' }}>
                {item}
              </Text>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(450)} style={{ alignItems: 'center' }}>
          <View style={{ position: 'relative', width: '100%', alignItems: 'center', marginBottom: 20 }}>
            <Animated.View style={[{ position: 'absolute', borderRadius: 16, borderWidth: 2, borderColor: colors.accent, width: '100%', height: 58 }, ringStyle]} />
            <Animated.View style={[{ width: '100%' }, btnStyle]}>
              <Pressable
                onPress={handleAccept}
                accessibilityLabel="I Accept the Challenge"
                accessibilityHint="Confirms your commitment and proceeds to reminder setup"
                style={{ backgroundColor: accepted ? colors.primaryMuted : colors.accent, borderRadius: 14, paddingVertical: 18, alignItems: 'center', minHeight: 58 }}
              >
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, letterSpacing: 1.5, color: colors.textOnPrimary, textTransform: 'uppercase' }}>
                  {accepted ? 'Accepted ✓' : 'I Accept the Challenge'}
                </Text>
              </Pressable>
            </Animated.View>
          </View>

          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Choose a different challenge"
            accessibilityHint="Go back to select a different challenge"
            style={{ paddingVertical: 12, minHeight: 44, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, textDecorationLine: 'underline' }}>
              Choose a different challenge
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
