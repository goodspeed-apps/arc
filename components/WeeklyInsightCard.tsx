import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TrendingDown } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

interface WeeklyInsight { id: string; worst_day_of_week: string; nudge_copy: string; day_of_week_miss_rates: Record<string, number>; }

export function WeeklyInsightCard({ insight }: { insight: WeeklyInsight }) {
  const colors = useThemeColors();
  const worstRate = Math.round(((insight.day_of_week_miss_rates?.[insight.worst_day_of_week] ?? 0)) * 100);
  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.card, { backgroundColor: colors.warningMuted, borderColor: colors.warning }]}>
      <View style={styles.row}>
        <TrendingDown size={18} color={colors.warning} />
        <Text style={[styles.title, { color: colors.warning, fontFamily: 'PlusJakartaSans_700Bold' }]}>Weekly Pattern</Text>
      </View>
      <Text style={[styles.nudge, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>{insight.nudge_copy || `You miss ${insight.worst_day_of_week}s, ${worstRate}% miss rate`}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  title: { fontSize: 14 },
  nudge: { fontSize: 14, lineHeight: 20 },
});
