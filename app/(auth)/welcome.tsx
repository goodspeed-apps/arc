import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trackScreenLoad } from '@/lib/performance';

export default function WelcomeScreen() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const startTime = useRef(Date.now()).current;

  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);
  const ringRotation = useSharedValue(0);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    track('onboarding_welcome_viewed');
    trackScreenLoad('WelcomeScreen', startTime);

    ringOpacity.value = withTiming(1, { duration: 800 });
    ringScale.value = withSpring(1, { damping: 12, stiffness: 80 });
    ringRotation.value = withRepeat(
      withTiming(360, { duration: 6000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [
      { scale: ringScale.value },
      { rotate: `${ringRotation.value}deg` },
    ],
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleBegin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    track('onboarding_begin_tapped');
    router.push('/(auth)/signup');
  };

  const onPressIn = () => {
    btnScale.value = withSpring(0.97, { damping: 15 });
  };
  const onPressOut = () => {
    btnScale.value = withSpring(1, { damping: 15 });
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.surface }]}>
      <View style={styles.center}>
        <Animated.View style={[styles.ringWrap, ringStyle]}>
          <View style={[styles.ring, { borderColor: colors.accent }]} />
          <View style={[styles.ringInner, { borderColor: colors.primary }]} />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(200).springify()}
          style={[styles.wordmark, { color: colors.text, fontFamily: 'PlusJakartaSans_700Bold' }]}
        >
          ARC
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(400).springify()}
          style={[styles.manifesto, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}
        >
          {"You start. You finish. You prove it."}
        </Animated.Text>
      </View>

      <Animated.View entering={FadeInDown.delay(600).springify()} style={[styles.footer, btnStyle]}>
        <Pressable
          onPress={handleBegin}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={[styles.cta, { backgroundColor: colors.accent }]}
          accessibilityLabel="Begin onboarding"
          accessibilityHint="Navigates to account creation"
          accessibilityRole="button"
        >
          <Text style={[styles.ctaText, { color: colors.textOnPrimary, fontFamily: 'PlusJakartaSans_700Bold' }]}>
            Begin
          </Text>
        </Pressable>
        <Text style={[styles.lockup, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>
          ARC, Finish what you start
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  ringWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  ring: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderStyle: 'dashed' },
  ringInner: { position: 'absolute', width: 84, height: 84, borderRadius: 42, borderWidth: 2 },
  wordmark: { fontSize: 56, letterSpacing: 18 },
  manifesto: { fontSize: 18, letterSpacing: 0.4, textAlign: 'center', lineHeight: 28, paddingHorizontal: 32 },
  footer: { alignItems: 'center', paddingBottom: 32, gap: 16 },
  cta: { height: 56, width: 220, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 18, letterSpacing: 1 },
  lockup: { fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
});
