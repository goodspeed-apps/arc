import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { ChevronDown, ChevronUp, Clock, Zap } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import type { LibraryChallenge } from '@/app/(auth)/pick-challenge';

type Props = {
  item: LibraryChallenge;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onStart: () => void;
  colors: ReturnType<typeof useThemeColors>;
};

export function ChallengeCard({ item, index, selected, onSelect, onStart, colors }: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.98, { damping: 15 }, () => { scale.value = withSpring(1, { damping: 15 }); });
    onSelect();
  };

  const s = styles(colors);

  return (
    <Animated.View entering={FadeInDown.delay(50 * index).duration(350)} style={animStyle}>
      <Pressable onPress={handlePress} style={[s.card, selected && s.cardSelected]}
        accessibilityLabel={`${item.name} challenge, ${item.duration_days} days`}
        accessibilityHint="Tap to expand or collapse details">
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{item.name}</Text>
            <View style={s.meta}>
              <Clock size={12} color={colors.textSecondary} />
              <Text style={s.metaText}>{item.duration_days} days</Text>
              <Zap size={12} color={colors.textSecondary} style={{ marginLeft: 8 }} />
              <Text style={s.metaText}>{item.commitments.length} commitments</Text>
            </View>
          </View>
          <View style={[s.badge, { backgroundColor: colors.primaryMuted }]}>
            <Text style={[s.badgeText, { color: colors.primary }]}>{item.category}</Text>
          </View>
          {selected ? <ChevronUp size={18} color={colors.primary} style={{ marginLeft: 8 }} />
            : <ChevronDown size={18} color={colors.textSecondary} style={{ marginLeft: 8 }} />}
        </View>
        {selected && (
          <Animated.View entering={FadeInDown.duration(200)} style={s.expanded}>
            {item.commitments.map((c, i) => (
              <Text key={i} style={s.commitment}>• {c}</Text>
            ))}
            <Pressable onPress={onStart} style={s.startBtn}
              accessibilityLabel={`Start ${item.name}`} accessibilityHint="Navigates to commitment setup">
              <Text style={s.startText}>Start Challenge</Text>
            </Pressable>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = (c: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  card: { backgroundColor: c.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: c.border },
  cardSelected: { borderColor: c.primary },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: c.text, marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textSecondary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  expanded: { marginTop: 12, gap: 6 },
  commitment: { fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textSecondary, lineHeight: 20 },
  startBtn: { marginTop: 12, backgroundColor: c.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', minHeight: 44 },
  startText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: c.textOnPrimary },
});
