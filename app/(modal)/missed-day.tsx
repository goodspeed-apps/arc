import React, { useEffect, useCallback } from 'react';
import { View, Text, Pressable, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';

export default function MissedDayModal() {
  const colors = useThemeColors();
  const router = useRouter();
  const { track } = useAnalytics();
  const params = useLocalSearchParams<{
    streak_before: string;
    freeze_available: string;
    streak_after: string;
    challenge_id: string;
    day_number: string;
  }>();

  const streakBefore = parseInt(params.streak_before ?? '0', 10);
  const freezeAvailable = params.freeze_available === 'true';
  const streakAfter = parseInt(params.streak_after ?? '0', 10);
  const dayNumber = parseInt(params.day_number ?? '1', 10);

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    const start = Date.now();
    track('missed_day_modal_viewed', {
      streak_before: streakBefore,
      freeze_available: freezeAvailable,
      streak_after: streakAfter,
    });
    trackScreenLoad('missed_day_modal', start);

    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const handleAcknowledge = useCallback(async () => {
    scale.value = withSpring(0.97, { damping: 15 }, () => { scale.value = withSpring(1); });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const end = trackApiLatency('acknowledge_missed_day');
    try {
      const { error } = await supabase
        .from('day_logs')
        .update({ acknowledged_miss: true })
        .eq('challenge_id', params.challenge_id ?? '')
        .eq('day_number', dayNumber - 1);
      if (error) throw error;
      track('missed_day_acknowledged', { freeze_applied: freezeAvailable, new_streak: streakAfter });
    } catch (err) {
      captureException(err as Error, { screen: 'missed_day_modal', action: 'acknowledge' });
    } finally {
      end();
      router.replace('/(tabs)/placeholder');
    }
  }, [params.challenge_id, dayNumber, freezeAvailable, streakAfter]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1, padding: 28, justifyContent: 'space-between' }}>

        <View style={{ gap: 24 }}>
          <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 32, color: colors.text, lineHeight: 38 }}>
            {'You Missed Yesterday.'}
          </Text>

          <View style={{ backgroundColor: colors.surfaceElevated, borderRadius: 16, padding: 20, gap: 8 }}>
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: colors.textSecondary, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              {freezeAvailable ? 'Freeze Applied' : 'Streak Reset'}
            </Text>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: freezeAvailable ? colors.warning : colors.error }}>
              {freezeAvailable
                ? 'Your weekly freeze has been applied.'
                : 'No freeze available. Streak resets to 0.'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, justifyContent: 'center', paddingVertical: 8 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 48, color: colors.textSecondary }}>{streakBefore ?? 0}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted }}>Before</Text>
            </View>
            <Text style={{ fontSize: 24, color: colors.border }}>→</Text>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 48, color: colors.primary }}>{streakAfter ?? 0}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted }}>After</Text>
            </View>
          </View>

          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.textSecondary, textAlign: 'center' }}>
            {`Your challenge continues. Day ${dayNumber} starts now.`}
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <Animated.View style={animatedStyle}>
            <Pressable
              onPress={handleAcknowledge}
              style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 18, alignItems: 'center' }}
              accessibilityLabel="Acknowledge and continue"
              accessibilityHint="Updates your streak and takes you to today's challenge"
            >
              <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 17, color: colors.textOnPrimary, letterSpacing: 0.5 }}>
                Acknowledge & Continue
              </Text>
            </Pressable>
          </Animated.View>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>
            {'Every champion has a setback.'}
          </Text>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}
