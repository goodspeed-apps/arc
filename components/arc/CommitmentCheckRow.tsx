import React, { useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { ARC_COLORS, ARC_FONTS, ARC_SPACING } from '@/lib/arcTheme';

interface CommitmentCheckRowProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  index: number;
}

export function CommitmentCheckRow({ label, checked, onToggle, index }: CommitmentCheckRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!checked) {
      Animated.sequence([
        Animated.timing(checkAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      checkAnim.setValue(0);
    }
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        accessibilityLabel={`${label} commitment`}
        accessibilityHint={checked ? 'Tap to uncheck' : 'Tap to check off this commitment'}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={{
          flexDirection: 'row', alignItems: 'center',
          minHeight: 56, paddingHorizontal: ARC_SPACING.md,
          backgroundColor: ARC_COLORS.surface,
          marginBottom: ARC_SPACING.sm, borderRadius: 0,
          borderLeftWidth: checked ? 2 : 0,
          borderLeftColor: ARC_COLORS.ember,
        }}
      >
        <View style={{
          width: 24, height: 24, borderWidth: 1.5,
          borderColor: checked ? ARC_COLORS.ember : ARC_COLORS.mutedDim,
          alignItems: 'center', justifyContent: 'center',
          marginRight: ARC_SPACING.md,
        }}>
          {checked && <Check size={14} color={ARC_COLORS.ember} strokeWidth={3} />}
        </View>
        <Text style={{
          fontFamily: ARC_FONTS.bodyMedium, fontSize: 14,
          color: checked ? ARC_COLORS.muted : ARC_COLORS.bone,
          flex: 1, letterSpacing: 0.3,
          textDecorationLine: checked ? 'line-through' : 'none',
        }}>
          {label}
        </Text>
        <Text style={{ fontFamily: ARC_FONTS.display, fontSize: 11, color: ARC_COLORS.mutedDim, letterSpacing: 1 }}>
          {String(index + 1).padStart(2, '0')}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
