import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { ARC_FONTS, ARC_COLORS, ARC_SPACING } from '@/lib/arcTheme';

interface DayCounterProps {
  dayNumber: number;
  totalDays: number;
  collapsed?: boolean;
}

export function DayCounter({ dayNumber, totalDays, collapsed = false }: DayCounterProps) {
  const prevDay = useRef(dayNumber);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (prevDay.current !== dayNumber) {
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      ]).start();
      prevDay.current = dayNumber;
    }
  }, [dayNumber, opacityAnim]);

  const dayStr = String(dayNumber).padStart(3, '0');

  if (collapsed) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: ARC_SPACING.xs }}>
        <Text style={{ fontFamily: ARC_FONTS.display, fontSize: 20, color: ARC_COLORS.bone, letterSpacing: 2 }}>
          DAY {dayStr}
        </Text>
        <Text style={{ fontFamily: ARC_FONTS.body, fontSize: 12, color: ARC_COLORS.muted }}>
          /{totalDays}
        </Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ opacity: opacityAnim }}>
      <Text style={{ fontFamily: ARC_FONTS.display, fontSize: 48, color: ARC_COLORS.bone, letterSpacing: 4, lineHeight: 52 }}>
        DAY {dayStr}
      </Text>
    </Animated.View>
  );
}
