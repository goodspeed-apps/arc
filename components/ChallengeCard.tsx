import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';

type LibraryChallenge = {
  id: string;
  name: string;
  category: string;
  duration_days: number;
  commitments: string[];
};

type Props = {
  challenge: LibraryChallenge;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onStart: () => void;
  colors: ReturnType<typeof useThemeColors>;
};

export function ChallengeCard({ challenge, index, selected, onSelect, onStart, colors }: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => { scale.value = withSpring(0.97, { damping: 15 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 15 }); };

  const s = styles(colors, selected);

  return (
    <Animated.View entering={FadeInDown.delay(50 * index).duration(300)} style={animStyle}>
      <Pressable
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={s.card}
        accessibilityLabel={`${challenge.name} challenge`}
        accessibilityHint={selected ? 'Tap to collapse' : 'Tap to expand details'}
      >
        <View style={s.row}>
          <View style={s.info}>
            <Text style={s.name}>{challenge.name}</Text>
            <Text style={s.category}>{challenge.category}</Text>
          </View>
          <View style={s.badge}>
            <Text style={s.badgeText}>{challenge.duration_days}d</Text>
          </View>
        </View>

        {selected && (
          <View style={s.expanded}>
            {challenge.commitments.map((c, i) => (
              <Text key={i} style={s.commitment}>• {c}</Text>
            ))}
            <Pressable
              onPress={onStart}
              style={s.startBtn}
              accessibilityLabel={`Start ${challenge.name}`}
              accessibilityHint="Navigates to commitment setup"
            >
              <Text style={s.startText}>Start Challenge</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = (colors: ReturnType<typeof useThemeColors>, selected: boolean) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.accent : colors.border },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    info: { flex: 1 },
    name: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.text, marginBottom: 2 },
    category: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary },
    badge: { backgroundColor: colors.primaryMuted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.primary },
    expanded: { marginTop: 14, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12 },
    commitment: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginBottom: 6 },
    startBtn: { marginTop: 10, backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    startText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.textOnPrimary },
  });
