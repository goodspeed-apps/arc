import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ARC_COLORS, ARC_FONTS } from '@/lib/arcTheme';

interface StreakRingProps {
  current: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function StreakRing({ current, total, size = 120, strokeWidth = 6, label }: StreakRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.min(current / total, 1) : 0;
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={ARC_COLORS.surfaceElevated} strokeWidth={strokeWidth}
          fill="none" strokeLinecap="butt"
        />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={ARC_COLORS.ember}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="butt"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontFamily: ARC_FONTS.display, fontSize: 28, color: ARC_COLORS.bone, letterSpacing: 2 }}>
          {current}
        </Text>
        {label && (
          <Text style={{ fontFamily: ARC_FONTS.bodyMedium, fontSize: 10, color: ARC_COLORS.muted, letterSpacing: 1.5, marginTop: 2 }}>
            {label}
          </Text>
        )}
      </View>
    </View>
  );
}
