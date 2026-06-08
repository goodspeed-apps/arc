import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Inbox } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ProofCard() {
  const { colors } = useThemeColors();
  const { track } = useAnalytics();
  const params = useLocalSearchParams();
  void params;
  useEffect(() => {
    track('proof_card_viewed');
  }, [track]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 6 }}>
          Proof Card
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 24 }}>
          Completion ceremony and shareability moment. On finishing a challenge, generate a branded, verified proof card. Users share to Instagram Stories, TikTok, Reddit
        </Text>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState icon={Inbox} title="Proof Card" description="Content for this screen is on the way." />
        </View>
      </View>
    </SafeAreaView>
  );
}
