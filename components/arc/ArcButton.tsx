import React, { useRef } from 'react';
import { Text, Pressable, Animated, ActivityIndicator } from 'react-native';
import { ARC_COLORS, ARC_FONTS, ARC_SPACING } from '@/lib/arcTheme';

interface ArcButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function ArcButton({ label, onPress, variant = 'primary', loading = false, disabled = false, accessibilityLabel, accessibilityHint }: ArcButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }).start();
  };

  const bg = variant === 'primary' ? ARC_COLORS.ember
    : variant === 'danger' ? ARC_COLORS.danger
    : variant === 'secondary' ? ARC_COLORS.surface
    : 'transparent';
  const textColor = variant === 'ghost' ? ARC_COLORS.muted : ARC_COLORS.bone;
  const borderColor = variant === 'secondary' ? ARC_COLORS.mutedDim : 'transparent';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        style={{
          backgroundColor: disabled ? ARC_COLORS.mutedDim : bg,
          paddingVertical: ARC_SPACING.md,
          paddingHorizontal: ARC_SPACING.lg,
          alignItems: 'center', justifyContent: 'center',
          borderRadius: 0, minHeight: 48,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor,
        }}
      >
        {loading
          ? <ActivityIndicator color={ARC_COLORS.bone} size="small" />
          : <Text style={{ fontFamily: ARC_FONTS.display, fontSize: 14, color: textColor, letterSpacing: 2 }}>{label}</Text>
        }
      </Pressable>
    </Animated.View>
  );
}
