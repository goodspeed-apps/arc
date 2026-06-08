import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';

type Stats = { total_completed: number; total_days: number; longest_streak: number };
export function JourneyStatsHeader({ stats }: { stats: Stats }) {
  const colors = useThemeColors();
  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[s.streak, { color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold' }]}>{(stats.longest_streak ?? 0)}</Text>
      <Text style={[s.streakLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>All-time longest streak</Text>
      <View style={s.chips}>
        <Text style={[s.chip, { color: colors.text, backgroundColor: colors.surfaceElevated, fontFamily: 'Inter_400Regular' }]}>{stats.total_completed} Challenges Finished</Text>
        <Text style={[s.chip, { color: colors.text, backgroundColor: colors.surfaceElevated, fontFamily: 'Inter_400Regular' }]}>{stats.total_days} Total Days Logged</Text>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  card: { borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1 },
  streak: { fontSize: 48, lineHeight: 56 },
  streakLabel: { fontSize: 13, marginBottom: 12 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { fontSize: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
});
