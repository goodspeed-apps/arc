import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Inbox } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CompletionCelebration() {
  const { colors } = useThemeColors();
  const { track } = useAnalytics();
  const params = useLocalSearchParams();
  void params;
  useEffect(() => {
    track('challenge_completion_celebrated');
  }, [track]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 6 }}>
          Completion Celebration
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 24 }}>
          Full-screen ceremony when a challenge is 100% finished. The emotional peak of the Arc experience. Transitions directly into proof card generation.
        </Text>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState icon={Inbox} title="Completion Celebration" description="Content for this screen is on the way." />
        </View>
      </View>
    </SafeAreaView>
  );
}
