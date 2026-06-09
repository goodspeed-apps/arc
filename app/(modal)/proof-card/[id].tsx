import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, { FadeInDown, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Flame, ArrowLeft } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSubscription } from '@/hooks/useSubscription';
import { usePaywall } from '@/hooks/usePaywall';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ProofCardView } from '@/components/ProofCardView';

const THEMES = [
  { id: 'dark', label: 'Dark', premium: false },
  { id: 'ember', label: 'Ember', premium: true },
  { id: 'bone', label: 'Bone', premium: true },
  { id: 'obsidian', label: 'Obsidian', premium: true },
];

export default function ProofCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const { openPaywall } = usePaywall();

  const [cardData, setCardData] = useState<ProofCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [sharing, setSharing] = useState(false);

  const shareScale = useSharedValue(1);
  const shareStyle = useAnimatedStyle(() => ({ transform: [{ scale: shareScale.value }] }));

  useEffect(() => {
    const start = Date.now();
    track('proof_card_viewed', { challenge_id: id });
    fetchCardData().finally(() => {
      setLoading(false);
      trackScreenLoad('ProofCard', start);
    });
  }, [id]);

  async function fetchCardData() {
    if (!user?.id || !id) return;
    try {
      const end = trackApiLatency('proof_card_fetch');
      const [{ data: challenge }, { data: snap }, { data: badge }] = await Promise.all([
        supabase.from('challenges').select('*').eq('id', id).single(),
        supabase.from('streak_snapshots').select('*').eq('challenge_id', id).single(),
        supabase.from('badges').select('*').eq('challenge_id', id).maybeSingle(),
      ]);
      end();
      if (challenge) {
        setCardData({ challenge, snap, badge });
        if (challenge.proof_card_theme) setSelectedTheme(challenge.proof_card_theme);
      }
    } catch (error) {
      captureException(error as Error, { screen: 'ProofCard', action: 'fetchCardData' });
    }
  }

  async function handleShare() {
    shareScale.value = withSpring(0.97, { damping: 15 }, () => { shareScale.value = withSpring(1); });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSharing(true);
    track('proof_card_shared', { theme: selectedTheme, challenge_id: id });
    try {
      await Share.share({ message: `I just completed the ${cardData?.challenge?.name ?? 'challenge'} on Arc. 🔥 #ArcChallenge` });
    } catch (e) {
      captureException(e as Error, { screen: 'ProofCard', action: 'handleShare' });
    } finally {
      setSharing(false);
    }
  }

  async function handleThemeTap(theme: typeof THEMES[number]) {
    if (theme.premium && !isPremium) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      track('paywall_opened', { source: 'proof_card_theme' });
      openPaywall();
      return;
    }
    setSelectedTheme(theme.id);
    track('proof_card_theme_changed', { theme: theme.id });
  }

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><LoadingSkeleton variant="card" /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Back to Journey" accessibilityHint="Returns to previous screen" style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}>
            <ArrowLeft size={22} color={colors.textSecondary} />
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, color: colors.text }}>Your Arc</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <ProofCardView data={cardData} theme={selectedTheme} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16, marginBottom: 4 }}>
            {THEMES.map((t, i) => {
              const active = selectedTheme === t.id;
              const locked = t.premium && !isPremium;
              return (
                <Animated.View key={t.id} entering={FadeInDown.delay(50 * i).duration(300)}>
                  <Pressable
                    onPress={() => handleThemeTap(t)}
                    accessibilityLabel={`${t.label} theme${locked ? ', locked' : ''}`}
                    accessibilityHint={locked ? 'Requires premium' : `Switch to ${t.label} theme`}
                    style={{ paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primaryMuted : colors.surface, minHeight: 44, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {locked && <Text style={{ fontSize: 11, color: colors.textSecondary }}>🔒</Text>}
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: active ? colors.primary : colors.textSecondary }}>{t.label}</Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </ScrollView>

          <Animated.View style={[{ marginTop: 20 }, shareStyle]}>
            <Pressable onPress={handleShare} disabled={sharing} accessibilityLabel="Share Your Arc" accessibilityHint="Opens system share sheet to share your proof card" style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', minHeight: 52, justifyContent: 'center' }}>
              {sharing ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: colors.textOnPrimary }}>Share Your Arc</Text>}
            </Pressable>
          </Animated.View>

          <Pressable onPress={() => router.back()} accessibilityLabel="Back to Journey" accessibilityHint="Returns to your journey screen" style={{ alignItems: 'center', paddingVertical: 16, minHeight: 44 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary }}>Back to Journey</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

type ProofCardData = {
  challenge: Record<string, unknown>;
  snap: Record<string, unknown> | null;
  badge: Record<string, unknown> | null;
};
