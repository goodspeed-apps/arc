import React, { useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ARC_TOKENS } from '@/lib/arcTheme';
import type { Challenge } from '@/types/arc';

interface ChallengeCardProps {
  challenge: Challenge;
  currentDay?: number;
  completionRate?: number;
  onPress: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'ACTIVE',
  completed: 'COMPLETED',
  abandoned: 'ABANDONED',
  paused: 'PAUSED',
};

export function ChallengeCard({ challenge, currentDay, completionRate, onPress }: ChallengeCardProps) {
  const colors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }).start();
  };

  const statusColor =
    challenge.status === 'active' ? colors.primary :
    challenge.status === 'completed' ? colors.success :
    challenge.status === 'abandoned' ? colors.error :
    colors.textSecondary;

  const progress = Math.min(((currentDay ?? 0) / challenge.duration_days) * 100, 100);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={`${challenge.name} challenge`}
        accessibilityHint="Tap to view challenge details"
        style={{
          backgroundColor: colors.surface,
          padding: ARC_TOKENS.cardPadding,
          borderRadius: ARC_TOKENS.cardRadius,
          borderLeftWidth: 3,
          borderLeftColor: statusColor,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: ARC_TOKENS.spacingSm }}>
          <Text
            style={{
              fontFamily: ARC_TOKENS.fontDisplay,
              fontSize: ARC_TOKENS.cardTitleSize,
              color: colors.text,
              flex: 1,
              marginRight: ARC_TOKENS.spacingSm,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
            numberOfLines={1}
          >
            {challenge.name}
          </Text>
          <Text
            style={{
              fontFamily: ARC_TOKENS.fontBodyMedium,
              fontSize: 10,
              color: statusColor,
              letterSpacing: 1.5,
            }}
          >
            {STATUS_LABELS[challenge.status] ?? challenge.status.toUpperCase()}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: ARC_TOKENS.spacingLg, marginBottom: ARC_TOKENS.spacingSm }}>
          <View>
            <Text style={{ fontFamily: ARC_TOKENS.fontBody, fontSize: 11, color: colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Day
            </Text>
            <Text style={{ fontFamily: ARC_TOKENS.fontDisplay, fontSize: 22, color: colors.text }}>
              {String(currentDay ?? 0).padStart(3, '0')}
            </Text>
          </View>
          <View>
            <Text style={{ fontFamily: ARC_TOKENS.fontBody, fontSize: 11, color: colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Duration
            </Text>
            <Text style={{ fontFamily: ARC_TOKENS.fontDisplay, fontSize: 22, color: colors.text }}>
              {challenge.duration_days}D
            </Text>
          </View>
          {completionRate !== undefined && (
            <View>
              <Text style={{ fontFamily: ARC_TOKENS.fontBody, fontSize: 11, color: colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Rate
              </Text>
              <Text style={{ fontFamily: ARC_TOKENS.fontDisplay, fontSize: 22, color: colors.text }}>
                {(completionRate ?? 0).toFixed(0)}%
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 2, backgroundColor: colors.border }}>
          <View style={{ height: 2, width: `${progress}%`, backgroundColor: statusColor }} />
        </View>
      </Pressable>
    </Animated.View>
  );
}
