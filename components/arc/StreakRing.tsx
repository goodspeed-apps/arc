import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';
import { ARC_TOKENS } from '@/lib/arcTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface StreakRingProps {
  current: number;
  total: number;
  size?: number;
}

export function StreakRing({ current, total, size = 80 }: StreakRingProps) {
  const colors = useThemeColors();
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    const target = total > 0 ? Math.min(current / total, 1) : 0;
    progress.value = withTiming(target, {
      duration: ARC_TOKENS.strokeDraw,
      easing: Easing.linear,
    });
  }, [current, total, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={3}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={3}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="butt"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text
        style={{
          fontFamily: ARC_TOKENS.fontDisplay,
          fontSize: 20,
          color: colors.text,
          textAlign: 'center',
        }}
      >
        {current}
      </Text>
      <Text
        style={{
          fontFamily: ARC_TOKENS.fontBody,
          fontSize: 9,
          color: colors.textSecondary,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        streak
      </Text>
    </View>
  );
}
