import React from 'react';
import { View, Text } from 'react-native';
import { ARC_COLORS, ARC_FONTS, ARC_SPACING } from '@/lib/arcTheme';

interface StatBlockProps {
  value: string | number;
  label: string;
  accent?: boolean;
}

export function StatBlock({ value, label, accent = false }: StatBlockProps) {
  return (
    <View style={{
      flex: 1, alignItems: 'center', justifyContent: 'center',
      backgroundColor: ARC_COLORS.surface,
      paddingVertical: ARC_SPACING.md,
      paddingHorizontal: ARC_SPACING.sm,
      borderRadius: 0,
    }}>
      <Text style={{
        fontFamily: ARC_FONTS.display, fontSize: 28,
        color: accent ? ARC_COLORS.ember : ARC_COLORS.bone,
        letterSpacing: 2,
      }}>
        {value}
      </Text>
      <Text style={{
        fontFamily: ARC_FONTS.bodyMedium, fontSize: 10,
        color: ARC_COLORS.muted, letterSpacing: 1.5,
        marginTop: ARC_SPACING.xs, textTransform: 'uppercase',
      }}>
        {label}
      </Text>
    </View>
  );
}
