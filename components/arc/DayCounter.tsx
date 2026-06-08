import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ARC_TOKENS } from '@/lib/arcTheme';

interface DayCounterProps {
  day: number;
  label?: string;
  size?: 'large' | 'inline';
}

export function DayCounter({ day, label = 'DAY', size = 'large' }: DayCounterProps) {
  const colors = useThemeColors();
  const prevDay = useRef(day);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prevDay.current !== day) {
      slideAnim.setValue(-20);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ARC_TOKENS.digitFlip,
        useNativeDriver: true,
      }).start();
      prevDay.current = day;
    }
  }, [day, slideAnim]);

  const dayStr = String(day).padStart(3, '0');
  const isFontLarge = size === 'large';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: ARC_TOKENS.cardGap }}>
      <Text
        style={{
          fontFamily: ARC_TOKENS.fontBody,
          fontSize: isFontLarge ? 14 : 12,
          color: colors.textSecondary,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Animated.Text
        style={{
          fontFamily: ARC_TOKENS.fontDisplay,
          fontSize: isFontLarge ? ARC_TOKENS.dayCountSize : 20,
          color: colors.text,
          letterSpacing: isFontLarge ? -1 : 0,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {dayStr}
      </Animated.Text>
    </View>
  );
}
