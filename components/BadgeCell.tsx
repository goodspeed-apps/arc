import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Lock } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { BadgeDefinition } from '@/services/badgeDefinitions';

interface EarnedBadge { badge_slug: string; earned_at: string; is_featured: boolean; }
interface Props { item: { def: BadgeDefinition; earn?: EarnedBadge }; onPress: () => void; }

export function BadgeCell({ item, onPress }: Props) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isEarned = !!item.earn;

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={onPress}
      accessibilityLabel={`${item.def.name} badge, ${isEarned ? 'earned' : 'locked'}`}
      accessibilityHint={isEarned ? 'Tap to view badge details' : 'Tap to see unlock criteria'}
      style={{ minHeight: 44 }}
    >
      <Animated.View style={[animStyle, {
        backgroundColor: isEarned ? colors.surface : colors.surfaceDark,
        borderRadius: 12, padding: 10, alignItems: 'center', opacity: isEarned ? 1 : 0.5,
      }]}>
        <Text style={{ fontSize: 28, opacity: isEarned ? 1 : 0.4 }}>{item.def.emoji}</Text>
        {!isEarned && (
          <View style={{ position: 'absolute', top: 6, right: 6 }}>
            <Lock size={10} color={colors.textSecondary} />
          </View>
        )}
        <Text numberOfLines={1} style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: isEarned ? colors.text : colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
          {item.def.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
