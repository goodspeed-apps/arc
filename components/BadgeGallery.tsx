import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import type { Badge } from '@/types/app-types';

const BADGE_EMOJIS: Record<string, string> = { first_finish: '🏅', streak_7: '🔥', streak_30: '⚡', iron_will: '🛡️', default: '🎖️' };

export function BadgeGallery({ badges, isPremium, index }: { badges: Badge[]; isPremium: boolean; index: number }) {
  const colors = useThemeColors();
  if (index !== 0) return null;
  const visibleBadges = isPremium ? badges : badges.slice(0, 3);
  const lockedCount = isPremium ? 0 : Math.max(0, badges.length - 3);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: 'PlusJakartaSans_700Bold' }]}>Badge Gallery</Text>
      <View style={styles.grid}>
        {visibleBadges.map(b => (
          <View key={b.id} style={[styles.badge, { backgroundColor: colors.primaryMuted }]}>
            <Text style={styles.emoji}>{BADGE_EMOJIS[b.badge_slug] ?? BADGE_EMOJIS.default}</Text>
          </View>
        ))}
        {lockedCount > 0 && (
          <Pressable
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            accessibilityLabel={`${lockedCount} locked badges`}
            accessibilityHint="Upgrade to unlock all badges"
            style={[styles.badge, styles.locked, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
          >
            <Lock size={16} color={colors.textSecondary} />
            <Text style={[styles.lockCount, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>+{lockedCount}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1 },
  title: { fontSize: 15, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 26 },
  locked: { borderWidth: 1.5, borderStyle: 'dashed' },
  lockCount: { fontSize: 11, marginTop: 2 },
});
