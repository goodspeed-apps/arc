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
  const subscription = useSubscription();
  const [isPremium, setIsPremium] = useState(false);

  const [cardData, setCardData] = useState<ProofCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [sharing, setSharing] = useState(false);

  const shareScale = useSharedValue(1);
  const shareStyle = useAnimatedStyle(() => ({ transform: [{ scale: shareScale.value }] }));

  useEffect(() => {
    subscription.checkAccess('premium', false).then(setIsPremium);
  }, []);

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
      await subscription.checkAccess('premium', true);
      return;
    }
    setSelectedTheme(theme.id);
    track('proof_card_theme_changed', { theme: theme.id });
  }

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><LoadingSkeleton variant="card" /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 22, color: colors.text }}>Proof Card</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {cardData && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <ProofCardView cardData={cardData} theme={selectedTheme} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
              {THEMES.map(theme => (
                <Pressable
                  key={theme.id}
                  onPress={() => handleThemeTap(theme)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: selectedTheme === theme.id ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: selectedTheme === theme.id ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: selectedTheme === theme.id ? '#fff' : colors.text, fontFamily: 'Inter_400Regular', fontSize: 13 }}>
                    {theme.label}{theme.premium && !isPremium ? ' 🔒' : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Animated.View style={[{ marginTop: 24 }, shareStyle]}>
              <Pressable
                onPress={handleShare}
                disabled={sharing}
                style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              >
                {sharing ? <ActivityIndicator color="#fff" size="small" /> : <Flame size={18} color="#fff" />}
                <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>Share</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
