import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Share,
  ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, { FadeInDown, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSubscription } from '@/hooks/useSubscription';
import { usePaywall } from '@/hooks/usePaywall';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import ProofCardDisplay from '@/components/ProofCardDisplay';

const THEMES = [
  { id: 'dark', label: 'Dark', premium: false },
  { id: 'ember', label: 'Ember', premium: true },
  { id: 'bone', label: 'Bone', premium: true },
  { id: 'obsidian', label: 'Obsidian', premium: true },
];

type CardData = {
  name: string; durationDays: number; streak: number;
  freezesUsed: number; completedAt: string; badgeSlug: string;
};

export default function ProofCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const { isSubscribed } = useSubscription();
  const { openPaywall } = usePaywall();

  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [sharing, setSharing] = useState(false);

  const shareScale = useSharedValue(1);
  const shareStyle = useAnimatedStyle(() => ({ transform: [{ scale: shareScale.value }] }));

  useEffect(() => {
    const start = Date.now();
    track('proof_card_viewed', { challenge_id: id });
    fetchData().finally(() => { trackScreenLoad('ProofCard', start); setLoading(false); });
  }, [id]);

  async function fetchData() {
    try {
      const done = trackApiLatency('fetch_proof_card');
      const [{ data: ch }, { data: snap }, { data: badge }] = await Promise.all([
        supabase.from('challenges').select('name,duration_days,completed_at,proof_card_theme').eq('id', id).single(),
        supabase.from('streak_snapshots').select('current_streak,freezes_used_this_week').eq('challenge_id', id).order('computed_at', { ascending: false }).limit(1).single(),
        supabase.from('badges').select('badge_slug').eq('challenge_id', id).limit(1).single(),
      ]);
      done();
      if (!ch) { setError(true); return; }
      setCardData({
        name: ch.name,
        durationDays: ch.duration_days ?? 0,
        streak: snap?.current_streak ?? 0,
        freezesUsed: snap?.freezes_used_this_week ?? 0,
        completedAt: ch.completed_at ?? '',
        badgeSlug: badge?.badge_slug ?? 'flame',
      });
      if (ch.proof_card_theme) setTheme(ch.proof_card_theme);
    } catch (e) {
      captureException(e as Error, { screen: 'ProofCard', action: 'fetchData' });
      setError(true);
    }
  }

  async function handleShare() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    shareScale.value = withSpring(0.97, { damping: 15 }, () => { shareScale.value = withSpring(1); });
    setSharing(true);
    track('proof_card_shared', { challenge_id: id, theme });
    try {
      await Share.share({ message: `I just completed the ${cardData?.name} challenge on Arc 🔥 #ArcChallenge` });
    } catch (e) {
      captureException(e as Error, { screen: 'ProofCard', action: 'handleShare' });
    } finally { setSharing(false); }
  }

  function handleThemeSelect(t: typeof THEMES[0]) {
    if (t.premium && !isSubscribed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      track('paywall_triggered', { source: 'proof_card_theme' });
      openPaywall(); return;
    }
    setTheme(t.id);
  }

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><LoadingSkeleton variant="card" /></SafeAreaView>;
  if (error || !cardData) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><EmptyState icon="alert-circle" title="Card unavailable" subtitle="We couldn't load your proof card." /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <ProofCardDisplay cardData={cardData} theme={theme} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
            {THEMES.map((t, i) => (
              <Animated.View key={t.id} entering={FadeInDown.delay(50 * i).duration(300)}>
                <Pressable
                  onPress={() => handleThemeSelect(t)}
                  accessibilityLabel={`${t.label} theme${t.premium && !isSubscribed ? ', locked' : ''}`}
                  accessibilityHint="Apply this theme to your proof card"
                  style={{ marginRight: 10, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: theme === t.id ? colors.accent : colors.border, backgroundColor: theme === t.id ? colors.accent : colors.surface, minHeight: 44, justifyContent: 'center' }}
                >
                  <Text style={{ color: theme === t.id ? colors.textOnPrimary : colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 13 }}>
                    {t.premium && !isSubscribed ? '🔒 ' : ''}{t.label}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
          <Animated.View style={[{ marginTop: 24 }, shareStyle]}>
            <Pressable onPress={handleShare} disabled={sharing} accessibilityLabel="Share Your Arc" accessibilityHint="Opens the system share sheet with your proof card" style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', minHeight: 54 }}>
              {sharing ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={{ color: colors.textOnPrimary, fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: 0.5 }}>Share Your Arc</Text>}
            </Pressable>
          </Animated.View>
          <Pressable onPress={() => router.back()} accessibilityLabel="Back to Journey" accessibilityHint="Dismiss this proof card and return to your journey" style={{ marginTop: 16, alignItems: 'center', minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 14 }}>← Back to Journey</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
