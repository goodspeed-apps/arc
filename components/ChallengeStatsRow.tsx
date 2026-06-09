import React from 'react';
import { View, Text } from 'react-native';
import type { ReturnType } from 'react';

type Streak = { current_streak: number; longest_streak: number; total_completed_days: number; freezes_used_this_week: number } | null;
interface Props { streak: Streak; colors: Record<string, string>; }

function StatCell({ label, value, colors }: { label: string; value: string; colors: Record<string, string> }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
      <Text style={{ color: colors.text, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20 }}>{value}</Text>
      <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export function ChallengStatsRow({ streak, colors }: Props) {
  return (
    <View style={{ flexDirection: 'row', marginHorizontal: 16, marginVertical: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}>
      <StatCell label="Streak" value={`${streak?.current_streak ?? 0}🔥`} colors={colors} />
      <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 10 }} />
      <StatCell label="Best" value={`${streak?.longest_streak ?? 0}`} colors={colors} />
      <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 10 }} />
      <StatCell label="Done" value={`${streak?.total_completed_days ?? 0}`} colors={colors} />
      <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 10 }} />
      <StatCell label="Freezes" value={`${streak?.freezes_used_this_week ?? 0}`} colors={colors} />
    </View>
  );
}
