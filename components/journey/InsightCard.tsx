import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { TrendingDown } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

type Insight = { worst_day_of_week: string; nudge_copy: string; day_of_week_miss_rates: Record<string, number> };
export function InsightCard({ insight, onPress }: { insight: Insight; onPress: () => void }) {
  const colors = useThemeColors();
  const worstRate = insight.day_of_week_miss_rates?.[insight.worst_day_of_week] ?? 0;
  return (
    <Pressable onPress={onPress} accessibilityLabel="Weekly pattern insight" accessibilityHint="Tap to expand weekly pattern details">
      <View style={[s.card, { backgroundColor: colors.warningMuted, borderColor: colors.warning }]}>
        <View style={s.row}>
          <TrendingDown size={20} color={colors.warning} />
          <Text style={[s.label, { color: colors.warning, fontFamily: 'PlusJakartaSans_700Bold' }]}>Weekly Pattern</Text>
        </View>
        <Text style={[s.copy, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>{insight.nudge_copy || `You miss ${insight.worst_day_of_week}s, ${((worstRate ?? 0) * 100).toFixed(0)}% miss rate`}</Text>
      </View>
    </Pressable>
  );
}
const s = StyleSheet.create({
  card: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  label: { fontSize: 13 },
  copy: { fontSize: 14, lineHeight: 20 },
});
