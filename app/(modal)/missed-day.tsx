import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, BackHandler, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function MissedDayModal() {
  const colors = useThemeColors();
  const router = useRouter();
  const { track } = useAnalytics();
  const { user } = useAuth();
  const startTime = useRef(Date.now());
  const scale = useSharedValue(1);

  const params = useLocalSearchParams<{
    streak_before: string;
    freeze_available: string;
    streak_after: string;
    challenge_id: string;
    day_number: string;
    day_log_id: string;
  }>();

  const streakBefore = parseInt(params.streak_before ?? '0', 10);
  const freezeAvailable = params.freeze_available === 'true';
  const streakAfter = parseInt(params.streak_after ?? '0', 10);
  const dayNumber = parseInt(params.day_number ?? '1', 10);

  useEffect(() => {
    track('missed_day_modal_viewed', {
      streak_before: streakBefore,
      freeze_available: freezeAvailable,
      streak_after: streakAfter,
    });
    trackScreenLoad('MissedDayModal', startTime.current);

    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const handleAcknowledge = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.97, { damping: 15 }, () => { scale.value = withSpring(1); });

    try {
      const end = trackApiLatency('acknowledge_missed_day');
      if (params.day_log_id && user?.id) {
        const { error } = await supabase
          .from('day_logs')
          .update({ acknowledged_miss: true, freeze_applied: freezeAvailable })
          .eq('id', params.day_log_id)
          .eq('user_id', user.id);
        if (error) throw error;
      }
      end();
      track('missed_day_acknowledged', { freeze_applied: freezeAvailable, streak_after: streakAfter });
      router.replace('/(tabs)/placeholder');
    } catch (err) {
      captureException(err as Error, { screen: 'MissedDayModal', action: 'acknowledge' });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={s.container}>

        <Text style={[s.heading, { color: colors.text }]}>You Missed Yesterday.</Text>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.freezeLabel, { color: freezeAvailable ? colors.warning : colors.error }]}>
            {freezeAvailable ? 'Your weekly freeze has been applied.' : 'No freeze available. Streak resets to 0.'}
          </Text>
          <View style={s.streakRow}>
            <View style={s.streakBlock}>
              <Text style={[s.streakNum, { color: colors.textSecondary }]}>{streakBefore}</Text>
              <Text style={[s.streakCaption, { color: colors.textMuted }]}>Before</Text>
            </View>
            <Text style={[s.arrow, { color: colors.textMuted }]}>→</Text>
            <View style={s.streakBlock}>
              <Text style={[s.streakNum, { color: freezeAvailable ? colors.warning : colors.error }]}>{streakAfter}</Text>
              <Text style={[s.streakCaption, { color: colors.textMuted }]}>After</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={[s.continues, { color: colors.text }]}>
            {"Your challenge continues. Day "}{dayNumber}{" starts now."}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={[animatedStyle, s.ctaWrap]}>
          <Pressable
            onPress={handleAcknowledge}
            style={[s.cta, { backgroundColor: colors.accent }]}
            accessibilityLabel="Acknowledge missed day and continue"
            accessibilityHint="Updates your streak and takes you to today's challenge"
          >
            <Text style={[s.ctaText, { color: colors.textOnPrimary }]}>Acknowledge & Continue</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={[s.sub, { color: colors.textMuted }]}>{"Every champion has a setback."}</Text>
        </Animated.View>

      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 48, alignItems: 'center', gap: 24 },
  heading: { fontSize: 28, fontFamily: 'JosefinSans_700Bold', textAlign: 'center', letterSpacing: -0.5 },
  card: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', gap: 16 },
  freezeLabel: { fontSize: 15, fontFamily: 'Manrope_600SemiBold', textAlign: 'center' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  streakBlock: { alignItems: 'center', gap: 4 },
  streakNum: { fontSize: 36, fontFamily: 'Outfit_700Bold' },
  streakCaption: { fontSize: 12, fontFamily: 'Manrope_400Regular' },
  arrow: { fontSize: 22, fontFamily: 'Outfit_400Regular' },
  continues: { fontSize: 16, fontFamily: 'Manrope_600SemiBold', textAlign: 'center' },
  ctaWrap: { width: '100%' },
  cta: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', minHeight: 52 },
  ctaText: { fontSize: 16, fontFamily: 'Manrope_700Bold', letterSpacing: 0.3 },
  sub: { fontSize: 13, fontFamily: 'Manrope_400Regular', textAlign: 'center', marginTop: 4 },
});
