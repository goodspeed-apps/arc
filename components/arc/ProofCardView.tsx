import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ARC_TOKENS } from '@/lib/arcTheme';
import type { ProofCard } from '@/types/arc';
import { Shield } from 'lucide-react-native';

interface ProofCardViewProps {
  card: ProofCard;
  compact?: boolean;
}

export function ProofCardView({ card, compact = false }: ProofCardViewProps) {
  const colors = useThemeColors();
  const stats = card.stats_snapshot;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: ARC_TOKENS.cardRadius,
        padding: compact ? ARC_TOKENS.cardPadding : ARC_TOKENS.spacingXl,
        borderWidth: 1,
        borderColor: colors.primary,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: ARC_TOKENS.spacingSm, marginBottom: ARC_TOKENS.spacingMd }}>
        <Shield size={compact ? 16 : 20} color={colors.primary} />
        <Text
          style={{
            fontFamily: ARC_TOKENS.fontBody,
            fontSize: ARC_TOKENS.captionSize,
            color: colors.primary,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          Arc Verified
        </Text>
      </View>

      <Text
        style={{
          fontFamily: ARC_TOKENS.fontDisplay,
          fontSize: compact ? 20 : 28,
          color: colors.text,
          textTransform: 'uppercase',
          marginBottom: ARC_TOKENS.spacingXs,
        }}
        numberOfLines={2}
      >
        {stats.challenge_name}
      </Text>

      <Text
        style={{
          fontFamily: ARC_TOKENS.fontBody,
          fontSize: ARC_TOKENS.captionSize,
          color: colors.textMuted,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: compact ? ARC_TOKENS.spacingSm : ARC_TOKENS.spacingLg,
        }}
      >
        {stats.start_date}, {stats.end_date}
      </Text>

      <View style={{ flexDirection: 'row', gap: ARC_TOKENS.spacingSm }}>
        {[
          { label: 'Days', value: String(stats.duration_days ?? 0) },
          { label: 'Done', value: String(stats.completed_days ?? 0) },
          { label: 'Rate', value: `${(stats.completion_rate ?? 0).toFixed(0)}%` },
          { label: 'Streak', value: String(stats.longest_streak ?? 0) },
        ].map((s) => (
          <View key={s.label} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: ARC_TOKENS.fontDisplay, fontSize: compact ? 18 : 24, color: colors.primary }}>
              {s.value}
            </Text>
            <Text style={{ fontFamily: ARC_TOKENS.fontBody, fontSize: 10, color: colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
