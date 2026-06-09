import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';

type DayLog = { id: string; day_number: number; status: string; freeze_applied: boolean; log_date: string };
interface Props { log: DayLog; today: string; onPress: () => void; }

export function ChallengeDayTile({ log, today, onPress }: Props) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isFuture = log.log_date > today;
  const bg = log.freeze_applied ? colors.warning
    : log.status === 'completed' ? colors.primary
    : log.status === 'missed' ? colors.error
    : isFuture ? colors.surfaceDark
    : colors.surfaceSecondary;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => { if (!isFuture) { scale.value = withSpring(0.97, { damping: 15 }, () => { scale.value = withSpring(1); }); onPress(); } }}
        accessibilityLabel={`Day ${log.day_number}, ${log.status}`}
        accessibilityHint="Tap to see day log detail"
        style={{ backgroundColor: bg, borderRadius: 6, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', minHeight: 36 }}
      >
        <Text style={{ color: isFuture ? colors.textMuted : colors.textOnPrimary, fontSize: 10, fontFamily: 'Inter_400Regular' }}>{log.day_number}</Text>
      </Pressable>
    </Animated.View>
  );
}
