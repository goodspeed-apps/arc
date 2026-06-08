import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Lock, Award } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

type Badge = { id: string; badge_slug: string; earned_at: string; is_featured: boolean };
const VISIBLE_FREE = 3;
export function BadgeGallery({ badges, isPremium }: { badges: Badge[]; isPremium: boolean }) {
  const colors = useThemeColors();
  const [tooltip, setTooltip] = useState<string | null>(null);
  const visible = isPremium ? badges : badges.slice(0, VISIBLE_FREE);
  const locked = !isPremium && badges.length > VISIBLE_FREE;
  return (
    <View style={[s.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[s.title, { color: colors.text, fontFamily: 'PlusJakartaSans_700Bold' }]}>Badges</Text>
      <View style={s.grid}>
        {visible.map(b => (
          <View key={b.id} style={[s.badge, { backgroundColor: colors.primaryMuted }]}>
            <Award size={22} color={colors.primary} />
            <Text style={[s.slug, { color: colors.textSecondary }]} numberOfLines={1}>{b.badge_slug}</Text>
          </View>
        ))}
        {locked && (
          <Pressable
            onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTooltip('Unlock all badges with Arc Premium'); }}
            accessibilityLabel="Locked badges"
            accessibilityHint="Tap to see how to unlock more badges"
            style={[s.badge, { backgroundColor: colors.surfaceSecondary }]}
          >
            <Lock size={22} color={colors.textSecondary} />
            <Text style={[s.slug, { color: colors.textSecondary }]}>+{badges.length - VISIBLE_FREE}</Text>
          </Pressable>
        )}
      </View>
      {tooltip && <Text style={[s.tooltip, { color: colors.warning, backgroundColor: colors.warningMuted }]}>{tooltip}</Text>}
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  title: { fontSize: 16, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: 70, height: 70, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 6 },
  slug: { fontSize: 9, marginTop: 3, textAlign: 'center' },
  tooltip: { fontSize: 12, marginTop: 10, padding: 8, borderRadius: 8 },
});
