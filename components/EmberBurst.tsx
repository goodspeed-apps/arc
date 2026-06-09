import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring, Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 18;

function Particle({ index }: { index: number }) {
  const colors = useThemeColors();
  const angle = (index / PARTICLE_COUNT) * 2 * Math.PI;
  const dist = 80 + Math.random() * 120;
  const tx = Math.cos(angle) * dist;
  const ty = Math.sin(angle) * dist;
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.2);

  useEffect(() => {
    const delay = index * 40;
    opacity.value = withDelay(delay, withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }));
    translateX.value = withDelay(delay, withSpring(tx, { damping: 18, stiffness: 80 }));
    translateY.value = withDelay(delay, withSpring(ty, { damping: 18, stiffness: 80 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 12 }));
    setTimeout(() => { opacity.value = withTiming(0, { duration: 600 }); }, delay + 800);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  const size = 6 + (index % 4) * 3;
  return (
    <Animated.View
      style={[s.particle, style, { width: size, height: size, borderRadius: size / 2, backgroundColor: index % 2 === 0 ? colors.primary : colors.accent }]}
    />
  );
}

export function EmberBurst() {
  return (
    <View style={s.container} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <Particle key={i} index={i} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  particle: { position: 'absolute' },
});
