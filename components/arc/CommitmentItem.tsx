import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { ARC_TOKENS } from '@/lib/arcTheme';
import { Check } from 'lucide-react-native';
import type { Commitment } from '@/types/arc';

interface CommitmentItemProps {
  commitment: Commitment;
  checked: boolean;
  onToggle: (id: string, checked: boolean) => void;
  disabled?: boolean;
}

export function CommitmentItem({ commitment, checked, onToggle, disabled = false }: CommitmentItemProps) {
  const colors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  const handlePress = async () => {
    if (disabled) return;
    const next = !checked;
    if (next) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      checkAnim.setValue(0);
      Animated.timing(checkAnim, {
        toValue: 1,
        duration: ARC_TOKENS.checkDraw,
        useNativeDriver: true,
      }).start();
    }
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 60, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
    onToggle(commitment.id, next);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        accessibilityLabel={`${commitment.label}, ${checked ? 'completed' : 'not completed'}`}
        accessibilityHint="Double tap to toggle completion"
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: ARC_TOKENS.itemHeight,
          paddingHorizontal: ARC_TOKENS.cardPadding,
          backgroundColor: colors.surface,
          gap: ARC_TOKENS.cardPadding,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderWidth: checked ? 0 : 1.5,
            borderColor: colors.border,
            backgroundColor: checked ? colors.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {checked && (
            <Animated.View style={{ opacity: checkAnim }}>
              <Check size={14} color={colors.textOnPrimary} strokeWidth={3} />
            </Animated.View>
          )}
        </View>
        <Text
          style={{
            flex: 1,
            fontFamily: ARC_TOKENS.fontBody,
            fontSize: ARC_TOKENS.bodySize,
            color: checked ? colors.textSecondary : colors.text,
            textDecorationLine: checked ? 'line-through' : 'none',
          }}
        >
          {commitment.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
