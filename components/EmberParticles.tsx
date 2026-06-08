import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

type ParticleProps = { x: number; delay: number; color: string; size: number };

function Particle({ x, delay, color, size }: ParticleProps) {
  const y = useSharedValue(height + 20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withTiming(-40, { duration: 2800, easing: Easing.out(Easing.quad) }), -1, false));
    opacity.value = withDelay(delay, withRepeat(withSequence(withTiming(0.85, { duration: 400 }), withTiming(0, { duration: 2400 })), -1, false));
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: opacity.value }));

  return (
    <Animated.View
      style={[style, { position: 'absolute', left: x, bottom: 0, width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}
    />
  );
}

export function EmberParticles({ count, color }: { count: number; color: string }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    delay: Math.random() * 2000,
    size: Math.random() * 6 + 3,
  }));

  return (
    <View style={{ position: 'absolute', width, height, pointerEvents: 'none' }}>
      {particles.map(p => (
        <Particle key={p.id} x={p.x} delay={p.delay} color={color} size={p.size} />
      ))}
    </View>
  );
}
