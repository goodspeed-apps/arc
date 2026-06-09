import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Flame } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

type ProofCardData = {
  challenge: Record<string, unknown>;
  snap: Record<string, unknown> | null;
  badge: Record<string, unknown> | null;
} | null;

const THEME_SURFACES: Record<string, string> = {};

function useCardColors(theme: string, colors: ReturnType<typeof useThemeColors>) {
  if (theme === 'ember') return { bg: colors.surfaceDark, accent: colors.primary, text: colors.textOnPrimary, sub: colors.textSecondary };
  if (theme === 'bone') return { bg: colors.surfaceElevated, accent: colors.secondary, text: colors.text, sub: colors.textSecondary };
  if (theme === 'obsidian') return { bg: colors.surfaceDark, accent: colors.accent, text: colors.textOnPrimary, sub: colors.textMuted };
  return { bg: colors.surfaceDark, accent: colors.primary, text: colors.textOnPrimary, sub: colors.textMuted };
}

export function ProofCardView({ data, theme }: { data: ProofCardData; theme: string }) {
  const colors = useThemeColors();
  const card = useCardColors(theme, colors);

  const name = (data?.challenge?.name as string) ?? 'Challenge';
  const durationDays = (data?.challenge?.duration_days as number) ?? 0;
  const totalCompleted = (data?.snap?.total_completed_days as number) ?? 0;
  const longestStreak = (data?.snap?.longest_streak as number) ?? 0;
  const freezesUsed = (data?.snap?.freezes_used_this_week as number) ?? 0;
  const completedAt = data?.challenge?.completed_at as string | null;
  const completedLabel = completedAt ? new Date(completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={{ borderRadius: 24, backgroundColor: card.bg, padding: 28, aspectRatio: 0.75, justifyContent: 'space-between', shadowColor: colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, letterSpacing: 4, color: card.accent }}>ARC</Text>
        <Flame size={28} color={card.accent} />
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 32, color: card.text, lineHeight: 38 }} numberOfLines={3}>{name}</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: card.sub, letterSpacing: 1 }}>COMPLETED</Text>
      </View>

      <View style={{ gap: 12 }}>
        <View style={{ height: 1, backgroundColor: card.accent, opacity: 0.25 }} />
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: card.sub, letterSpacing: 2 }}>
          {`${totalCompleted} DAYS COMPLETED · ${longestStreak}-DAY STREAK · ${freezesUsed} FREEZES USED`}
        </Text>
        <View style={{ height: 1, backgroundColor: card.accent, opacity: 0.25 }} />
        {completedLabel ? (
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: card.sub, letterSpacing: 1 }}>{`Completed ${completedLabel}`}</Text>
        ) : null}
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: card.accent, letterSpacing: 3, opacity: 0.5 }}>ARC · VERIFIED</Text>
      </View>
    </Animated.View>
  );
}
