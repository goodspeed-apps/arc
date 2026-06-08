import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, Modal,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Lock, Share2, X } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { BadgeCell } from '@/components/BadgeCell';
import { BADGE_DEFINITIONS, BadgeDefinition } from '@/services/badgeDefinitions';

interface EarnedBadge { badge_slug: string; earned_at: string; is_featured: boolean; }

export default function BadgeGalleryScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { track } = useAnalytics();
  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<{ def: BadgeDefinition; earn?: EarnedBadge } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const end = trackApiLatency('fetch_badges');
    try {
      const { data, error: err } = await supabase
        .from('badges').select('badge_slug, earned_at, is_featured').eq('user_id', user.id);
      if (err) throw err;
      setEarned(data ?? []);
      setError(null);
    } catch (e) {
      captureException(e as Error, { screen: 'badges', action: 'fetch' });
      setError('Could not load badges.');
    } finally {
      end(); setLoading(false); setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const t = Date.now();
    fetchBadges().then(() => trackScreenLoad('BadgeGallery', t));
    track('badge_gallery_viewed');
  }, [fetchBadges, track]);

  const earnedSlugs = new Set(earned.map(e => e.badge_slug));
  const featured = earned.find(e => e.is_featured) ?? earned[0];
  const featuredDef = featured ? BADGE_DEFINITIONS.find(d => d.slug === featured.badge_slug) : null;
  const allItems: { def: BadgeDefinition; earn?: EarnedBadge }[] = BADGE_DEFINITIONS.map(def => ({
    def, earn: earned.find(e => e.badge_slug === def.slug),
  })).sort((a, b) => (b.earn ? 1 : 0) - (a.earn ? 1 : 0));

  const handlePress = (item: { def: BadgeDefinition; earn?: EarnedBadge }) => {
    if (item.earn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    track('badge_tapped', { slug: item.def.slug, earned: !!item.earn });
    setSelected(item);
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><LoadingSkeleton variant="list" /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 24, color: colors.text }}>Badge Gallery</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
            {earnedSlugs.size} / {BADGE_DEFINITIONS.length} Badges Earned
          </Text>
        </View>
        {!error && featuredDef && featured && (
          <Pressable onPress={() => handlePress({ def: featuredDef, earn: featured })} accessibilityLabel={`Featured badge: ${featuredDef.name}`} accessibilityHint="Tap to view badge details" style={{ marginHorizontal: 20, marginBottom: 16, borderRadius: 16, backgroundColor: colors.surface, padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 48 }}>{featuredDef.emoji}</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: colors.text, marginTop: 8 }}>{featuredDef.name}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textSecondary }}>Most Recent Earn</Text>
          </Pressable>
        )}
        {error ? (
          <EmptyState title="Error" description={error} icon="alert-circle" action={{ label: 'Retry', onPress: fetchBadges }} />
        ) : earned.length === 0 ? (
          <EmptyState title="No Badges Yet" description="Complete your first challenge to earn your first badge." icon="award" />
        ) : (
          <FlatList
            data={allItems} numColumns={3} keyExtractor={i => i.def.slug}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 32 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBadges(); }} tintColor={colors.primary} />}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(50 * index).duration(300)} style={{ flex: 1, margin: 4 }}>
                <BadgeCell item={item} onPress={() => handlePress(item)} />
              </Animated.View>
            )}
          />
        )}
      </Animated.View>
      {selected && (
        <Modal transparent animationType="slide" onRequestClose={() => setSelected(null)}>
          <Pressable style={{ flex: 1, backgroundColor: colors.shadow, justifyContent: 'flex-end' }} onPress={() => setSelected(null)} accessibilityLabel="Close badge detail" accessibilityHint="Tap to dismiss">
            <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, alignItems: 'center' }}>
              <Text style={{ fontSize: 56 }}>{selected.def.emoji}</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, color: colors.text, marginTop: 12 }}>{selected.def.name}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>{selected.def.criteria}</Text>
              {selected.earn ? (
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.success, marginTop: 8 }}>
                  Earned {new Date(selected.earn.earned_at).toLocaleDateString()}
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Lock size={14} color={colors.textSecondary} />
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textSecondary, marginLeft: 4 }}>Locked</Text>
                </View>
              )}
              <Pressable onPress={() => setSelected(null)} accessibilityLabel="Close" accessibilityHint="Dismiss sheet" style={{ marginTop: 20, paddingVertical: 14, paddingHorizontal: 40, backgroundColor: colors.primary, borderRadius: 12 }}>
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: colors.textOnPrimary }}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}
