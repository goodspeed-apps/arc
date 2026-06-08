import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Inbox } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { EmptyState } from '@/components/ui/EmptyState';

export default function WeeklyInsightDetail() {
  const { colors } = useThemeColors();
  const { track } = useAnalytics();
  const params = useLocalSearchParams();
  void params;
  useEffect(() => {
    track('insight_detail_viewed');
  }, [track]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 6 }}>
          Weekly Insight Detail
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 24 }}>
          Premium-only expanded view of on-device weekly pattern analysis. Shows day-of-week miss rate, best streaks by challenge type, and actionable nudge copy.
        </Text>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState icon={Inbox} title="Weekly Insight Detail" description="Content for this screen is on the way." />
        </View>
      </View>
    </SafeAreaView>
  );
}
