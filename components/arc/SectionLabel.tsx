import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ARC_TOKENS } from '@/lib/arcTheme';

interface SectionLabelProps {
  title: string;
  right?: React.ReactNode;
}

export function SectionLabel({ title, right }: SectionLabelProps) {
  const colors = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ARC_TOKENS.spacingSm }}>
      <Text
        style={{
          fontFamily: ARC_TOKENS.fontBodyMedium,
          fontSize: ARC_TOKENS.sectionLabelSize,
          color: colors.textSecondary,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      {right}
    </View>
  );
}
