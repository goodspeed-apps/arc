import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Modal } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Flame } from 'lucide-react-native';

interface Props { onDismiss: () => void; streak: number }

export function CelebrationOverlay({ onDismiss, streak }: Props) {
  const colors = useThemeColors();
  const pulse = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.loop(Animated.sequence([
        Animated.spring(pulse, { toValue: 1.15, useNativeDriver: true, damping: 8 }),
        Animated.spring(pulse, { toValue: 0.95, useNativeDriver: true, damping: 8 }),
      ])),
    ]).start();
  }, []);

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <Animated.View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center', opacity }}>
        <Animated.View style={{ transform: [{ scale: pulse }], alignItems: 'center', marginBottom: 32 }}>
          <Flame size={80} color={colors.accent} />
        </Animated.View>
        <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 36, color: colors.accent, marginBottom: 8 }}>
          ALL DONE!
        </Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 16, color: colors.textSecondary, marginBottom: 8 }}>
          {streak} day streak 🔥
        </Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: colors.textSecondary, marginBottom: 40 }}>
          {"You crushed today's commitments."}
        </Text>
        <Pressable
          onPress={onDismiss}
          accessibilityLabel="Dismiss celebration"
          accessibilityHint="Tap to close and return to today screen"
          style={{ paddingHorizontal: 40, paddingVertical: 14, backgroundColor: colors.accent, borderRadius: 28 }}
        >
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 16, color: colors.background }}>
            Keep going →
          </Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}
