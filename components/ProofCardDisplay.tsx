import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Flame, Star, Shield } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

type CardData = {
  name: string; durationDays: number; streak: number;
  freezesUsed: number; completedAt: string; badgeSlug: string;
};

const BADGE_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  flame: Flame, star: Star, shield: Shield,
};

const CARD_BG: Record<string, string | null> = {
  dark: null, ember: null, bone: null, obsidian: null,
};

export default function ProofCardDisplay({ cardData, theme }: { cardData: CardData; theme: string }) {
  const colors = useThemeColors();
  const BadgeIcon = BADGE_ICONS[cardData.badgeSlug] ?? Flame;

  const bgColor = theme === 'bone' ? colors.surfaceElevated
    : theme === 'ember' ? colors.primaryMuted
    : theme === 'obsidian' ? colors.surfaceDark
    : colors.surface;

  const textColor = theme === 'bone' ? colors.text : colors.textOnPrimary;
  const subTextColor = theme === 'bone' ? colors.textSecondary : colors.textMuted;
  const accentColor = theme === 'ember' ? colors.accent : theme === 'bone' ? colors.primary : colors.accent;
  const completedDate = cardData.completedAt ? new Date(cardData.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={{ backgroundColor: bgColor, borderRadius: 24, padding: 28, minHeight: 340, justifyContent: 'space-between', shadowColor: colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: accentColor, fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' }}>ARC</Text>
        <BadgeIcon size={28} color={accentColor} />
      </View>

      <View style={{ marginTop: 24 }}>
        <Text style={{ color: textColor, fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34, letterSpacing: -0.5 }} numberOfLines={2}>{cardData.name}</Text>
        <Text style={{ color: subTextColor, fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 8, letterSpacing: 1 }}>CHALLENGE COMPLETE</Text>
      </View>

      <View style={{ marginTop: 24, flexDirection: 'row', gap: 16 }}>
        {[
          `${cardData.durationDays} DAYS COMPLETED`,
          `${(cardData.streak ?? 0)}-DAY STREAK`,
          `${(cardData.freezesUsed ?? 0)} FREEZES USED`,
        ].map((stat, i) => (
          <Animated.View key={stat} entering={FadeInDown.delay(50 * i).duration(300)} style={{ flex: 1 }}>
            <Text style={{ color: subTextColor, fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', lineHeight: 14 }}>{stat}</Text>
          </Animated.View>
        ))}
      </View>

      <View style={{ marginTop: 20, borderTopWidth: 0.5, borderTopColor: colors.divider, paddingTop: 16 }}>
        <Text style={{ color: subTextColor, fontFamily: 'Inter_400Regular', fontSize: 12, letterSpacing: 0.8 }}>
          {completedDate ? `Completed ${completedDate}` : 'Verified Completion'}
        </Text>
      </View>
    </Animated.View>
  );
}
