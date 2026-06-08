import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  withSpring,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';
import { supabase } from '@/lib/supabase';
import { EmberParticles } from '@/components/EmberParticles';

const { width, height } = Dimensions.get('window');

type ChallengeStats = {
  name: string;
  duration_days: number;
  streak: number;
  freezes_used: number;
};

export default function CompletionCelebration() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [phase, setPhase] = useState<'animating' | 'settled' | 'sharing'>('animating');
  const startTime = useRef(Date.now());

  const badgeY = useSharedValue(-200);
  const badgeScale = useSharedValue(0.3);
  const ctaOpacity = useSharedValue(0);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: badgeY.value }, { scale: badgeScale.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOpacity.value }));

  useEffect(() => {
    const settle = () => setPhase('settled');
    badgeY.value = withDelay(600, withSpring(0, { damping: 12, stiffness: 120 }));
    badgeScale.value = withDelay(600, withSpring(1, { damping: 10 }));
    ctaOpacity.value = withDelay(1400, withTiming(1, { duration: 500 }, () => runOnJS(settle)()));
  }, []);

  useEffect(() => {
    const load = async () => {
      const end = trackApiLatency('load_completion_stats');
      try {
        const [{ data: ch }, { data: snap }] = await Promise.all([
          supabase.from('challenges').select('name, duration_days').eq('id', id).single(),
          supabase.from('streak_snapshots').select('current_streak, freezes_used_this_week').eq('challenge_id', id).maybeSingle(),
        ]);
        if (ch) setStats({ name: ch.name, duration_days: ch.duration_days ?? 0, streak: snap?.current_streak ?? 0, freezes_used: snap?.freezes_used_this_week ?? 0 });
        trackScreenLoad('CompletionCelebration', startTime.current);
        track('challenge_completion_celebrated', { challenge_id: id });
      } catch (e) {
        captureException(e as Error, { screen: 'CompletionCelebration', action: 'load_stats' });
      } finally {
        end();
      }
    };
    load();
  }, [id]);

  const handleProofCard = () => {
    setPhase('sharing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    track('proof_card_cta_tapped', { challenge_id: id });
    router.push(`/(modal)/proof-card/${id}`);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    track('completion_back_to_journey', { challenge_id: id });
    router.dismissAll();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDark }}>
      <EmberParticles count={40} color={colors.warning} />
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View entering={FadeInDown.delay(100)} style={{ alignItems: 'center', paddingHorizontal: 32 }}>
          <Animated.View style={[badgeStyle, { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.warning, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }]}>
            <Text style={{ fontSize: 52 }}>🏆</Text>
          </Animated.View>
          <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 34, color: colors.textOnPrimary, textAlign: 'center', marginBottom: 12 }}>
            {stats?.name ?? 'Challenge Complete'}
          </Text>
          <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: colors.textMuted, letterSpacing: 3, textAlign: 'center', marginBottom: 48 }}>
            {`${stats?.duration_days ?? 0} DAYS · ${stats?.streak ?? 0}-DAY STREAK · ${stats?.freezes_used ?? 0} FREEZES`}
          </Text>
          <Animated.View style={[ctaStyle, { width: '100%', gap: 14 }]}>
            <Pressable
              onPress={handleProofCard}
              style={{ backgroundColor: colors.warning, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
              accessibilityLabel="Claim Your Proof Card"
              accessibilityHint="Generates your shareable proof card for this challenge"
            >
              <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 17, color: colors.surfaceDark, letterSpacing: 1 }}>Claim Your Proof Card</Text>
            </Pressable>
            <Pressable
              onPress={handleBack}
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
              accessibilityLabel="Back to Journey"
              accessibilityHint="Returns to your journey tab"
            >
              <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 17, color: colors.textOnPrimary, letterSpacing: 1 }}>Back to Journey</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
