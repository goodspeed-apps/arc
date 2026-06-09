import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';

type Props = {
  day: string;
  missRate: number;
  selected: boolean;
  onPress: () => void;
  index: number;
  completeCount: number;
  missCount: number;
};

export function InsightDayBar({ day, missRate, selected, onPress, index }: Props) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const BAR_HEIGHT = 64;
  const filled = Math.max(4, BAR_HEIGHT * (missRate ?? 0));
  const barColor = (missRate ?? 0) > 0.5 ? colors.warning : (missRate ?? 0) > 0.25 ? colors.tertiary : colors.positive;

  return (
    <Animated.View entering={FadeInDown.delay(50 * index)} style={[{ alignItems: 'center', flex: 1 }, animStyle]}>
      <Pressable
        onPress={() => {
          scale.value = withSpring(0.97, { damping: 15 });
          setTimeout(() => { scale.value = withSpring(1, { damping: 15 }); }, 120);
          onPress();
        }}
        accessibilityLabel={`${day} miss rate`}
        accessibilityHint="Tap to see exact counts"
        style={{ alignItems: 'center', paddingVertical: 4, paddingHorizontal: 2, minHeight: 44, minWidth: 36, justifyContent: 'flex-end' }}
      >
        <View style={{ height: BAR_HEIGHT, width: 10, borderRadius: 5, backgroundColor: colors.surfaceSecondary, justifyContent: 'flex-end', overflow: 'hidden', borderWidth: selected ? 1.5 : 0, borderColor: colors.primary }}>
          <View style={{ height: filled, borderRadius: 5, backgroundColor: barColor }} />
        </View>
        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 10, color: colors.textSecondary, marginTop: 4 }}>{day}</Text>
      </Pressable>
    </Animated.View>
  );
}
