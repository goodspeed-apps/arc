import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Inbox } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ChallengeDetail() {
  const { colors } = useThemeColors();
  const { track } = useAnalytics();
  const params = useLocalSearchParams();
  void params;
  useEffect(() => {
    track('challenge_detail_viewed');
  }, [track]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 6 }}>
          Challenge Detail
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 24 }}>
          Deep-dive view of a single active or completed challenge. Shows the full streak calendar grid, progress to finish line, and reminder editing. The evidence trail
        </Text>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState icon={Inbox} title="Challenge Detail" description="Content for this screen is on the way." />
        </View>
      </View>
    </SafeAreaView>
  );
}
