import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, Modal,
  RefreshControl, ActivityIndicator, Share,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Lock, Award, X, Share2 } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const BADGE_META: Record<string, { label: string; criteria: string; emoji: string }> = {
  first_day:    { label: 'First Step',    criteria: 'Complete Day 1 of any challenge',   emoji: '🔥' },
  week_one:     { label: 'Week Warrior',  criteria: 'Complete 7 consecutive days',       emoji: '⚡' },
  streak_30:    { label: 'Iron Month',    criteria: 'Reach a 30-day streak',             emoji: '💎' },
  no_freeze:    { label: 'Pure Run',      criteria: 'Finish a challenge without freezes',emoji: '❄️' },
  comeback:     { label: 'Comeback Kid',  criteria: 'Log after missing a day',           emoji: '↩️' },
  perfectionist:{ label: 'Perfectionist', criteria: 'Complete all commitments 14 days in a row', emoji: '🏆' },
};
const ALL_SLUGS = Object.keys(BADGE_META);

type EarnedBadge = { badge_slug: string; earned_at: string; is_featured: boolean };

export default function BadgeGallery() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { track } = useAnalytics();
  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<EarnedBadge | null>(null);
  const [lockedTip, setLockedTip] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const end = trackApiLatency('badges_fetch');
    try {
      const { data, error } = await supabase
        .from('badges').select('badge_slug, earned_at, is_featured')
        .eq('user_id', user.id).order('earned_at', { ascending: false });
      if (error) throw error;
      setEarned(data ?? []);
    } catch (e) {
      captureException(e as Error, { screen: 'BadgeGallery', action: 'fetch' });
    } finally {
      end(); setLoading(false); setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const t = Date.now();
    fetch().then(() => trackScreenLoad('BadgeGallery', t));
    track('badge_gallery_viewed');
  }, [fetch]);

  const earnedSlugs = new Set(earned.map(b => b.badge_slug));
  const featured = earned[0];
  const locked = ALL_SLUGS.filter(s => !earnedSlugs.has(s));
  const grid = [...earned.map(b => ({ ...b, isEarned: true })), ...locked.map(s => ({ badge_slug: s, earned_at: '', is_featured: false, isEarned: false }))];

  const onEarned = (b: EarnedBadge) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(b); track('badge_tapped', { slug: b.badge_slug }); };
  const onLocked = (slug: string) => { setLockedTip(BADGE_META[slug]?.criteria ?? ''); track('locked_badge_tapped', { slug }); };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><LoadingSkeleton variant="list" /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 24, color: colors.text, paddingHorizontal: 20, paddingTop: 16 }}>Badge Gallery</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, paddingHorizontal: 20, paddingBottom: 12 }}>{earned.length} / {ALL_SLUGS.length} Badges Earned</Text>
        {featured && (
          <Animated.View entering={FadeInDown.delay(100)} style={{ margin: 20, borderRadius: 16, backgroundColor: colors.surface, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.borderAccent }}>
            <Text style={{ fontSize: 48 }}>{BADGE_META[featured.badge_slug]?.emoji}</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: colors.primary, marginTop: 8 }}>{BADGE_META[featured.badge_slug]?.label}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>Most Recent • {new Date(featured.earned_at).toLocaleDateString()}</Text>
          </Animated.View>
        )}
        <FlatList
          data={grid} numColumns={3} keyExtractor={i => i.badge_slug}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 32 }}
          ListEmptyComponent={<EmptyState icon="award" title="No Badges Yet" description="Complete your first challenge to earn your first badge." />}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(50 * index)} style={{ flex: 1, margin: 6 }}>
              <Pressable
                onPress={() => item.isEarned ? onEarned(item as EarnedBadge) : onLocked(item.badge_slug)}
                style={({ pressed }) => ({ alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: item.isEarned ? colors.surface : colors.surfaceElevated, borderWidth: 1, borderColor: item.isEarned ? colors.borderAccent : colors.border, opacity: pressed ? 0.85 : 1, minHeight: 44 })}
                accessibilityLabel={`${BADGE_META[item.badge_slug]?.label} badge`}
                accessibilityHint={item.isEarned ? 'Tap to view details' : 'Tap to see unlock criteria'}
              >
                <Text style={{ fontSize: 28, opacity: item.isEarned ? 1 : 0.3 }}>{BADGE_META[item.badge_slug]?.emoji}</Text>
                {!item.isEarned && <View style={{ position: 'absolute', top: 4, right: 4 }}><Lock size={10} color={colors.textMuted} /></View>}
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: item.isEarned ? colors.text : colors.textMuted, textAlign: 'center', marginTop: 4 }} numberOfLines={2}>{BADGE_META[item.badge_slug]?.label}</Text>
              </Pressable>
            </Animated.View>
          )}
        />
      </Animated.View>

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable style={{ flex: 1, backgroundColor: colors.shadow, justifyContent: 'flex-end' }} onPress={() => setSelected(null)}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 }}>
            <Text style={{ fontSize: 56, textAlign: 'center' }}>{selected ? BADGE_META[selected.badge_slug]?.emoji : ''}</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 22, color: colors.text, textAlign: 'center', marginTop: 12 }}>{selected ? BADGE_META[selected.badge_slug]?.label : ''}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>{selected ? BADGE_META[selected.badge_slug]?.criteria : ''}</Text>
            {selected?.earned_at ? <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 6 }}>Earned {new Date(selected.earned_at).toLocaleDateString()}</Text> : null}
            <Pressable onPress={() => { Share.share({ message: `I just earned the "${BADGE_META[selected!.badge_slug]?.label}" badge on Arc! 🔥` }); track('badge_shared', { slug: selected?.badge_slug }); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, padding: 14, borderRadius: 12, backgroundColor: colors.primary }} accessibilityLabel="Share badge" accessibilityHint="Share this badge with others">
              <Share2 size={16} color={colors.textOnPrimary} /><Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: colors.textOnPrimary, marginLeft: 8 }}>Share Badge</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={!!lockedTip} transparent animationType="fade" onRequestClose={() => setLockedTip(null)}>
        <Pressable style={{ flex: 1, backgroundColor: colors.shadow, justifyContent: 'center', padding: 32 }} onPress={() => setLockedTip(null)}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 24 }}>
            <Lock size={28} color={colors.textSecondary} style={{ alignSelf: 'center' }} />
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: colors.text, textAlign: 'center', marginTop: 12 }}>How to Unlock</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>{lockedTip}</Text>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
