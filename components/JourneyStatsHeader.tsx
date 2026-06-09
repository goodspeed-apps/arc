import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';

interface DisciplineStats { totalFinished: number; totalDaysLogged: number; longestStreak: number; }

export function JourneyStatsHeader({ stats }: { stats: DisciplineStats }) {
  const colors = useThemeColors();
  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>ALL-TIME LONGEST STREAK</Text>
      <Text style={[styles.streak, { color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold' }]}>{(stats.longestStreak ?? 0)} days</Text>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      <View style={styles.chips}>
        <View style={[styles.chip, { backgroundColor: colors.primaryMuted }]}>
          <Text style={[styles.chipText, { color: colors.primary, fontFamily: 'Inter_400Regular' }]}>{stats.totalFinished} Challenges Finished</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: colors.secondaryMuted }]}>
          <Text style={[styles.chipText, { color: colors.secondary, fontFamily: 'Inter_400Regular' }]}>{stats.totalDaysLogged} Total Days Logged</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 20, marginBottom: 20, marginTop: 8, borderWidth: 1 },
  label: { fontSize: 11, letterSpacing: 1.2, marginBottom: 4 },
  streak: { fontSize: 40, lineHeight: 48 },
  divider: { height: 1, marginVertical: 14 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 13 },
});
