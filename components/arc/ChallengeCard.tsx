import React, { useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { ARC_COLORS, ARC_FONTS, ARC_SPACING, CATEGORY_LABELS } from '@/lib/arcTheme';
import type { Challenge } from '@/types/arc';

interface ChallengeCardProps {
  challenge: Challenge;
  streak?: number;
  dayNumber?: number;
  onPress: () => void;
  index?: number;
}

export function ChallengeCard({ challenge, streak, dayNumber, onPress, index = 0 }: ChallengeCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  };

  const statusColor = challenge.status === 'active' ? ARC_COLORS.ember
    : challenge.status === 'completed' ? ARC_COLORS.success : ARC_COLORS.muted;

  const progress = dayNumber && challenge.duration_days > 0
    ? Math.round((dayNumber / challenge.duration_days) * 100) : 0;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={`${challenge.name} challenge`}
        accessibilityHint="Tap to view challenge details"
        style={{
          backgroundColor: ARC_COLORS.surface, padding: ARC_SPACING.md,
          marginBottom: ARC_SPACING.sm, borderRadius: 0,
          borderTopWidth: 1, borderTopColor: statusColor,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: ARC_SPACING.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: ARC_FONTS.bodyMedium, fontSize: 10, color: ARC_COLORS.muted, letterSpacing: 2, marginBottom: ARC_SPACING.xs }}>
              {CATEGORY_LABELS[challenge.category] ?? 'CUSTOM'} · {challenge.duration_days}D
            </Text>
            <Text style={{ fontFamily: ARC_FONTS.display, fontSize: 18, color: ARC_COLORS.bone, letterSpacing: 1.5 }}>
              {challenge.name}
            </Text>
          </View>
          {challenge.status === 'active' && dayNumber !== undefined && (
            <Text style={{ fontFamily: ARC_FONTS.display, fontSize: 14, color: ARC_COLORS.ember, letterSpacing: 2 }}>
              D{String(dayNumber).padStart(3, '0')}
            </Text>
          )}
          {challenge.status === 'completed' && (
            <Text style={{ fontFamily: ARC_FONTS.display, fontSize: 10, color: ARC_COLORS.success, letterSpacing: 2 }}>
              COMPLETE
            </Text>
          )}
        </View>
        {challenge.status === 'active' && (
          <View style={{ height: 2, backgroundColor: ARC_COLORS.surfaceElevated, borderRadius: 0, overflow: 'hidden' }}>
            <View style={{ height: 2, width: `${progress}%`, backgroundColor: ARC_COLORS.ember }} />
          </View>
        )}
        {streak !== undefined && streak > 0 && (
          <Text style={{ fontFamily: ARC_FONTS.bodyMedium, fontSize: 11, color: ARC_COLORS.muted, marginTop: ARC_SPACING.sm, letterSpacing: 1 }}>
            {streak} DAY STREAK
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
