import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { CheckCircle, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ScoreRing } from '@/components/ui/ScoreRing';

type Challenge = { id: string; name: string; status: string; duration_days: number; start_date: string; completed_at: string | null };
export function ChallengeCard({ challenge, variant, onPress }: { challenge: Challenge; variant: 'active' | 'completed'; onPress: () => void }) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const isActive = variant === 'active';
  const start = new Date(challenge.start_date);
  const elapsed = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
  const progress = Math.min(1, elapsed / (challenge.duration_days ?? 1));
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={onPress}
      accessibilityLabel={`${challenge.name} challenge`}
      accessibilityHint="View challenge details"
    >
      <Animated.View style={[s.card, { backgroundColor: colors.surface, borderColor: isActive ? colors.primary : colors.border }]}>
        <View style={s.row}>
          {isActive ? <ScoreRing score={Math.round(progress * 100)} size={40} /> : <CheckCircle size={32} color={colors.success} />}
          <View style={s.info}>
            <Text style={[s.name, { color: colors.text, fontFamily: 'PlusJakartaSans_700Bold' }]}>{challenge.name}</Text>
            <Text style={[s.sub, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              {isActive ? `Day ${elapsed} of ${challenge.duration_days}` : `Completed ${challenge.completed_at ? new Date(challenge.completed_at).toLocaleDateString() : ''}`}
            </Text>
          </View>
          {isActive && <Clock size={18} color={colors.primary} />}
        </View>
      </Animated.View>
    </Pressable>
  );
}
const s = StyleSheet.create({
  card: { borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  name: { fontSize: 15 },
  sub: { fontSize: 12, marginTop: 2 },
});
