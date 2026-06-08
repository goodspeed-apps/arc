import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { requestPermissionAndRegister } from '@/lib/notifications';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad } from '@/lib/performance';

type PermissionState = 'idle' | 'granted' | 'denied';

export default function NotificationPermissionModal() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const { user } = useAuth();
  const [state, setState] = useState<PermissionState>('idle');
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    const start = Date.now();
    track('notification_permission_prompt_viewed');
    trackScreenLoad('NotificationPermissionModal', start);
  }, []);

  const handleEnable = async () => {
    scale.value = withSpring(0.97, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await requestPermissionAndRegister(user?.id ?? '');
      setState('granted');
      track('notification_permission_granted');
      router.back();
    } catch (error) {
      setState('denied');
      track('notification_permission_denied');
      captureException(error as Error, { screen: 'NotificationPermissionModal', action: 'requestPermission' });
      router.back();
    }
  };

  const handleSkip = () => {
    track('notification_permission_skipped');
    router.back();
  };

  return (
    <View style={[styles.overlay, { backgroundColor: colors.shadow }]}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
            <Bell size={36} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.header, { color: colors.text }]}>Stay Unbroken.</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {"Get your daily reminder so you never miss a day."}
          </Text>
          <Animated.View style={[styles.ctaWrap, animatedStyle]}>
            <Pressable
              onPress={handleEnable}
              disabled={state !== 'idle'}
              style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
              accessibilityLabel="Enable Reminders"
              accessibilityHint="Requests notification permission from your device"
            >
              <Text style={[styles.ctaText, { color: colors.textOnPrimary }]}>Enable Reminders</Text>
            </Pressable>
          </Animated.View>
          <Pressable
            onPress={handleSkip}
            style={styles.skipBtn}
            accessibilityLabel="Not now"
            accessibilityHint="Dismisses this prompt without enabling notifications"
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
  safeArea: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { borderRadius: 24, padding: 32, alignItems: 'center' },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  header: { fontFamily: 'JosefinSans_700Bold', fontSize: 28, textAlign: 'center', marginBottom: 12 },
  body: { fontFamily: 'Manrope_400Regular', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  ctaWrap: { width: '100%', marginBottom: 16 },
  ctaBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: 'Manrope_400Regular', fontSize: 16, fontWeight: '700' },
  skipBtn: { paddingVertical: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  skipText: { fontFamily: 'Manrope_400Regular', fontSize: 15 },
});
