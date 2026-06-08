import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';

interface DayLog {
  id: string; log_date: string; day_number: number; status: string;
  commitment_checks: Record<string, boolean>; freeze_applied: boolean;
  all_complete: boolean; acknowledged_miss: boolean;
}
interface Props {
  dayLogs: DayLog[];
  durationDays: number;
  startDate: string;
  onDayPress: (log: DayLog) => void;
}

export function ChallengeCalendarGrid({ dayLogs, durationDays, startDate, onDayPress }: Props) {
  const colors = useThemeColors();
  const logMap = React.useMemo(() => {
    const m: Record<number, DayLog> = {};
    dayLogs.forEach(l => { m[l.day_number] = l; });
    return m;
  }, [dayLogs]);

  const today = new Date();
  const start = new Date(startDate);

  const getTileColor = (dayNum: number): string => {
    const log = logMap[dayNum];
    const dayDate = new Date(start); dayDate.setDate(start.getDate() + dayNum - 1);
    if (!log) {
      if (dayDate > today) return colors.surfaceSecondary;
      return colors.border;
    }
    if (log.freeze_applied) return colors.warning;
    if (log.all_complete) return colors.primary;
    if (log.status === 'missed') return colors.error;
    return colors.border;
  };

  const tiles = Array.from({ length: durationDays }, (_, i) => i + 1);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
      {tiles.map((dayNum, idx) => {
        const log = logMap[dayNum];
        const bgColor = getTileColor(dayNum);
        return (
          <Animated.View key={dayNum} entering={FadeInDown.delay(idx * 12).duration(200)}>
            <Pressable
              onPress={() => log && onDayPress(log)}
              accessibilityLabel={`Day ${dayNum}`}
              accessibilityHint={log ? `Status: ${log.status}` : 'Future day'}
              style={{
                width: 30, height: 30, borderRadius: 7,
                backgroundColor: bgColor,
                alignItems: 'center', justifyContent: 'center',
                opacity: log ? 1 : 0.45,
              }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 9, color: colors.textOnPrimary }}>{dayNum}</Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}
