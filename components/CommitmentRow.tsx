import React, { useRef } from 'react';
import { Pressable, Text, View, Animated } from 'react-native';
import { withSpring } from 'react-native-reanimated';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

interface Commitment { id: string; label: string; checked: boolean; checked_at?: string }
interface Props { item: Commitment; onToggle: () => void }

export function CommitmentRow({ item, onToggle }: Props) {
  const colors = useThemeColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, damping: 15 }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 15 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], marginHorizontal: 16, marginBottom: 8 }}>
      <Pressable
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={`Commitment: ${item.label}`}
        accessibilityHint={item.checked ? 'Tap to uncheck' : 'Tap to mark complete'}
        style={{
          height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
          backgroundColor: item.checked ? colors.primaryMuted : colors.surface,
          borderRadius: 12, borderWidth: 1,
          borderColor: item.checked ? colors.accent : colors.border,
        }}
      >
        {item.checked
          ? <CheckCircle2 size={22} color={colors.accent} />
          : <Circle size={22} color={colors.textSecondary} />}
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: item.checked ? colors.accent : colors.text, marginLeft: 12, flex: 1 }}>
          {item.label}
        </Text>
        {item.checked_at && (
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: colors.textSecondary }}>
            {new Date(item.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
