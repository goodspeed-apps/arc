import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ARC_TOKENS } from '@/lib/arcTheme';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: boolean;
  flex?: number;
}

export function StatCard({ label, value, sublabel, accent = false, flex }: StatCardProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flex: flex ?? 1,
        backgroundColor: colors.surface,
        padding: ARC_TOKENS.cardPadding,
        borderRadius: ARC_TOKENS.cardRadius,
        borderLeftWidth: accent ? 2 : 0,
        borderLeftColor: accent ? colors.primary : 'transparent',
      }}
    >
      <Text
        style={{
          fontFamily: ARC_TOKENS.fontBodyMedium,
          fontSize: ARC_TOKENS.sectionLabelSize,
          color: colors.textSecondary,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: ARC_TOKENS.spacingXs,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: ARC_TOKENS.fontDisplay,
          fontSize: ARC_TOKENS.statValueSize,
          color: accent ? colors.primary : colors.text,
        }}
      >
        {value}
      </Text>
      {sublabel && (
        <Text
          style={{
            fontFamily: ARC_TOKENS.fontBody,
            fontSize: ARC_TOKENS.captionSize,
            color: colors.textMuted,
            marginTop: ARC_TOKENS.spacingXs,
          }}
        >
          {sublabel}
        </Text>
      )}
    </View>
  );
}
