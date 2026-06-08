import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

type Props = {
  missRates: Record<string, number>;
  rolling: number[];
  breakdown: Record<string, number>;
};

export function WeeklyInsightCharts({ missRates, rolling, breakdown }: Props) {
  const colors = useThemeColors();
  const [tooltip, setTooltip] = useState<string | null>(null);

  const handleDayPress = (day: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const rate = (missRates?.[day] ?? 0);
    const missed = (rate * 100).toFixed(0);
    const completed = (100 - rate * 100).toFixed(0);
    setTooltip(tooltip === day ? null : `${day}: ${missed}% missed, ${completed}% done`);
  };

  return (
    <View style={{ paddingHorizontal: 20, gap: 20 }}>
      <Animated.View entering={FadeInDown.delay(50).springify()} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>DAY-OF-WEEK MISS RATE</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 6, justifyContent: 'space-between' }}>
          {DAYS.map((day, i) => {
            const rate = missRates?.[day] ?? 0;
            const barH = Math.max(8, rate * 72);
            const scale = useSharedValue(1);
            const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
            return (
              <Animated.View key={day} entering={FadeInDown.delay(50 * i).springify()} style={{ flex: 1, alignItems: 'center' }}>
                <Pressable
                  onPress={() => { scale.value = withSpring(0.97, { damping: 15 }, () => { scale.value = withSpring(1); }); handleDayPress(day); }}
                  accessibilityLabel={`${day} miss rate`}
                  accessibilityHint="Tap to see exact counts"
                  style={{ width: '100%', alignItems: 'center', minHeight: 44, justifyContent: 'flex-end' }}
                >
                  <Animated.View style={[aStyle, { width: '80%', height: barH, borderRadius: 6, backgroundColor: rate > 0.5 ? colors.error : rate > 0.25 ? colors.warning : colors.success }]} />
                </Pressable>
                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 10, color: colors.textSecondary, marginTop: 4 }}>{day}</Text>
              </Animated.View>
            );
          })}
        </View>
        {tooltip && (
          <Animated.View entering={FadeInDown.springify()} style={{ marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: colors.surfaceElevated }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text }}>{tooltip}</Text>
          </Animated.View>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).springify()} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>7-DAY COMPLETION RATE</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 56, gap: 4 }}>
          {(rolling ?? []).slice(-7).map((v, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(50 * i).springify()} style={{ flex: 1, height: Math.max(4, (v ?? 0) * 52), borderRadius: 4, backgroundColor: colors.primary, opacity: 0.7 + 0.3 * ((v ?? 0)) }} />
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).springify()} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>CHALLENGE BREAKDOWN</Text>
        {Object.entries(breakdown ?? {}).map(([type, rate], i) => (
          <Animated.View key={type} entering={FadeInDown.delay(50 * i).springify()} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text }}>{type}</Text>
              <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: colors.textSecondary }}>{((rate ?? 0) * 100).toFixed(0)}%</Text>
            </View>
            <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3 }}>
              <View style={{ height: 6, width: `${((rate ?? 0) * 100)}%`, backgroundColor: colors.primary, borderRadius: 3 }} />
            </View>
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
}
