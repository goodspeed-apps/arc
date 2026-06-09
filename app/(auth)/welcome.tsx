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
  const startTime = useRef(Date.now());

  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);
  const ringRotation = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    track('onboarding_welcome_viewed');
    trackScreenLoad('WelcomeScreen', startTime.current);

    ringOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    ringScale.value = withSpring(1, { damping: 12, stiffness: 80 });
    ringRotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
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

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleBegin = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    buttonScale.value = withSpring(0.97, { damping: 15 }, () => {
      buttonScale.value = withSpring(1, { damping: 15 });
    });
    track('onboarding_begin_tapped');
    router.push('/(auth)/signup');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceDark }]}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.hero}>
        <Animated.View style={[styles.ring, { borderColor: colors.accent }, ringStyle]} />
        <Text style={[styles.wordmark, { color: colors.text }]}>ARC</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.manifesto}>
        <Text style={[styles.manifestoLine, { color: colors.textSecondary }]}>{"You start."}</Text>
        <Text style={[styles.manifestoLine, { color: colors.textSecondary }]}>{"You finish."}</Text>
        <Text style={[styles.manifestoLine, { color: colors.accent }]}>{"You prove it."}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.ctaContainer}>
        <Animated.View style={buttonStyle}>
          <Pressable
            onPress={handleBegin}
            style={[styles.ctaButton, { backgroundColor: colors.accent }]}
            accessibilityLabel="Begin onboarding"
            accessibilityHint="Navigates to account creation"
          >
            <Text style={[styles.ctaText, { color: colors.textOnPrimary }]}>Begin</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(900).springify()} style={styles.lockup}>
        <Text style={[styles.lockupText, { color: colors.textMuted }]}>ARC · FINISH WHAT YOU START</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  hero: { alignItems: 'center', justifyContent: 'center', marginBottom: 48, width: 160, height: 160 },
  ring: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderStyle: 'dashed', borderTopWidth: 5 },
  wordmark: { fontSize: 52, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 16, textAlign: 'center' },
  manifesto: { alignItems: 'center', gap: 4, marginBottom: 56 },
  manifestoLine: { fontSize: 22, fontFamily: 'Inter_400Regular', letterSpacing: 1, textAlign: 'center' },
  ctaContainer: { width: '100%', alignItems: 'center' },
  ctaButton: { paddingVertical: 18, paddingHorizontal: 72, borderRadius: 50, minHeight: 56, justifyContent: 'center', alignItems: 'center' },
  ctaText: { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 2 },
  lockup: { position: 'absolute', bottom: 32 },
  lockupText: { fontSize: 11, fontFamily: 'Inter_400Regular', letterSpacing: 4, textAlign: 'center' },
});
