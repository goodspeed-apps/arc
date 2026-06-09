import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Bell } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { requestPermissionAndRegister } from '@/lib/notifications';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad } from '@/lib/performance';
import { useAuth } from '@/hooks/useAuth';

type PermissionState = 'idle' | 'granted' | 'denied';

export default function NotificationPermissionModal() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const { user } = useAuth();
  const [state, setState] = useState<PermissionState>('idle');
  const scale = useSharedValue(1);

  useEffect(() => {
    const start = Date.now();
    track('notification_permission_prompt_viewed');
    trackScreenLoad('NotificationPermissionModal', start);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleEnable = async () => {
    scale.value = withSpring(0.97, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await requestPermissionAndRegister(user?.id ?? '');
      track('notification_permission_granted');
      setState('granted');
      router.back();
    } catch (error) {
      captureException(error as Error, { screen: 'NotificationPermissionModal', action: 'enable_reminders' });
      track('notification_permission_denied');
      setState('denied');
      router.back();
    }
  };

  const handleSkip = () => {
    track('notification_permission_skipped');
    router.back();
  };

  return (
    <View style={[styles.overlay, { backgroundColor: colors.shadow }]}>
      <SafeAreaView style={styles.safe}>
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          style={[styles.card, { backgroundColor: colors.surface }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
            <Bell size={36} color={colors.primary} strokeWidth={2} />
          </View>

          <Text style={[styles.header, { color: colors.text }]}>Stay Unbroken.</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {"Get your daily reminder so you never miss a day."}
          </Text>

          <Animated.View style={animatedStyle}>
            <Pressable
              onPress={handleEnable}
              disabled={state !== 'idle'}
              style={[styles.cta, { backgroundColor: colors.primary }]}
              accessibilityLabel="Enable Reminders"
              accessibilityHint="Requests push notification permission for daily check-in reminders"
            >
              <Text style={[styles.ctaText, { color: colors.textOnPrimary }]}>Enable Reminders</Text>
            </Pressable>
          </Animated.View>

          <Pressable
            onPress={handleSkip}
            style={styles.skip}
            accessibilityLabel="Not now"
            accessibilityHint="Dismiss this prompt without enabling notifications"
          >
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Not now</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  safe: { flex: 1, justifyContent: 'flex-end' },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 26,
    fontFamily: 'JosefinSans_700Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    fontFamily: 'Manrope_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  cta: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    alignItems: 'center',
    minHeight: 52,
    minWidth: 240,
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16, fontFamily: 'Manrope_700Bold', letterSpacing: 0.3 },
  skip: { marginTop: 16, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  skipText: { fontSize: 14, fontFamily: 'Manrope_400Regular' },
});
