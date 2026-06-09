import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, {
  FadeInDown, FadeIn, withSpring, useSharedValue, useAnimatedStyle, withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';
import { EmberBurst } from '@/components/EmberBurst';

const { width } = Dimensions.get('window');

type Stats = { duration: number; streak: number; freezes: number };

export default function CompletionCelebration() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const [stats, setStats] = useState<Stats | null>(null);
  const [challengeName, setChallengeName] = useState('');
  const [phase, setPhase] = useState<'animating' | 'settled' | 'sharing'>('animating');
  const scale = useSharedValue(0);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    const start = Date.now();
    const load = async () => {
      try {
        const done = trackApiLatency('fetch_completion_data');
        const [{ data: ch }, { data: snap }] = await Promise.all([
          supabase.from('challenges').select('name, duration_days').eq('id', id).single(),
          supabase.from('streak_snapshots').select('current_streak,total_frozen_days').eq('challenge_id', id).single(),
        ]);
        done();
        if (ch) setChallengeName(ch.name);
        setStats({
          duration: ch?.duration_days ?? 0,
          streak: snap?.current_streak ?? 0,
          freezes: snap?.total_frozen_days ?? 0,
        });
        scale.value = withDelay(600, withSpring(1, { damping: 10, stiffness: 120 }));
        setTimeout(() => setPhase('settled'), 1800);
        trackScreenLoad('CompletionCelebration', start);
        track('challenge_completion_celebrated', { challenge_id: id });
      } catch (e) {
        captureException(e as Error, { screen: 'CompletionCelebration', action: 'load' });
      }
    };
    load();
  }, [id]);

  const handleClaimCard = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    track('proof_card_claim_tapped', { challenge_id: id });
    setPhase('sharing');
    router.push({ pathname: '/(modal)/proof-card/[id]', params: { id } });
  };

  const handleBackToJourney = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    track('back_to_journey_tapped', { challenge_id: id });
    router.dismiss();
  };

  const marquee = stats
    ? `${stats.duration} DAYS · ${stats.streak}-DAY STREAK · ${stats.freezes} FREEZES`
    : ', , , ';

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.surfaceDark }]}>
      <EmberBurst />
      <Animated.View entering={FadeIn.duration(400)} style={s.content}>
        <Animated.View style={badgeStyle} accessibilityLabel="Achievement badge">
          <View style={[s.badge, { backgroundColor: colors.primary }]}>
            <Text style={[s.badgeEmoji]}>🏆</Text>
          </View>
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(300).duration(500)} style={[s.title, { color: colors.textOnPrimary, fontFamily: 'JosefinSans_700Bold' }]}>
          {challengeName || 'Challenge\nComplete'}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(500).duration(400)} style={[s.marquee, { color: colors.textSecondary, fontFamily: 'Outfit_400Regular' }]}>
          {marquee}
        </Animated.Text>
        {phase !== 'animating' && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.ctas}>
            <Pressable
              onPress={handleClaimCard}
              style={({ pressed }) => [s.btn, s.primary, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              accessibilityLabel="Claim Your Proof Card"
              accessibilityHint="Generates a shareable proof card for this challenge"
            >
              <Text style={[s.btnText, { color: colors.textOnPrimary, fontFamily: 'JosefinSans_700Bold' }]}>Claim Your Proof Card</Text>
            </Pressable>
            <Pressable
              onPress={handleBackToJourney}
              style={({ pressed }) => [s.btn, s.ghost, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
              accessibilityLabel="Back to Journey"
              accessibilityHint="Returns to your journey overview"
            >
              <Text style={[s.btnText, { color: colors.textOnPrimary, fontFamily: 'JosefinSans_700Bold' }]}>Back to Journey</Text>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  badge: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  badgeEmoji: { fontSize: 48 },
  title: { fontSize: 36, textAlign: 'center', lineHeight: 44, marginBottom: 16 },
  marquee: { fontSize: 13, letterSpacing: 2, textAlign: 'center', marginBottom: 40 },
  ctas: { width: '100%', gap: 12 },
  btn: { width: '100%', height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primary: {},
  ghost: { backgroundColor: 'transparent', borderWidth: 1.5 },
  btnText: { fontSize: 16, letterSpacing: 1 },
});
