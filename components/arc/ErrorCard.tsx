import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ARC_TOKENS } from '@/lib/arcTheme';
import { AlertTriangle } from 'lucide-react-native';

interface ErrorCardProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorCard({ message = 'Failed to load data.', onRetry }: ErrorCardProps) {
  const colors = useThemeColors();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        padding: ARC_TOKENS.cardPadding,
        borderRadius: ARC_TOKENS.cardRadius,
        borderLeftWidth: 2,
        borderLeftColor: colors.error,
        flexDirection: 'row',
        alignItems: 'center',
        gap: ARC_TOKENS.spacingSm,
      }}
    >
      <AlertTriangle size={16} color={colors.error} />
      <Text style={{ flex: 1, fontFamily: ARC_TOKENS.fontBody, fontSize: ARC_TOKENS.bodySize, color: colors.textSecondary }}>
        {message}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          accessibilityLabel="Retry"
          accessibilityHint="Tap to retry loading"
          style={{ paddingHorizontal: ARC_TOKENS.spacingSm, paddingVertical: ARC_TOKENS.spacingXs }}
        >
          <Text style={{ fontFamily: ARC_TOKENS.fontBodyBold, fontSize: ARC_TOKENS.captionSize, color: colors.primary, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Retry
          </Text>
        </Pressable>
      )}
    </View>
  );
}
