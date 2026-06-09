import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Inbox } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CustomChallenge() {
  const { colors } = useThemeColors();
  const { track } = useAnalytics();
  useEffect(() => {
    track('custom_challenge_view');
  }, [track]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 6 }}>
          Custom Challenge
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 24 }}>
          Custom Challenge is on the way.
        </Text>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState icon={Inbox} title="Custom Challenge" description="Content for this screen is on the way." />
        </View>
      </View>
    </SafeAreaView>
  );
}
