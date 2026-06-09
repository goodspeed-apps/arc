import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { CheckCircle, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ScoreRing } from '@/components/ui/ScoreRing';
import type { Challenge } from '@/types/app-types';

interface Props { challenge: Challenge; isActive: boolean; onPress: () => void; }

export function ChallengeRowCard({ challenge, isActive, onPress }: Props) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const progress = isActive && challenge.duration_days
    ? Math.min(1, (Date.now() - new Date(challenge.start_date ?? '').getTime()) / (challenge.duration_days * 86400000))
    : 1;

  return (
    <Animated.View style={anim}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={onPress}
        accessibilityLabel={`Challenge: ${challenge.name}`}
        accessibilityHint={isActive ? 'In-progress challenge' : 'Completed challenge'}
        style={[styles.card, { backgroundColor: colors.card, borderColor: isActive ? colors.primary : colors.border }]}
      >
        <ScoreRing score={Math.round(progress * 100)} size={44} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text, fontFamily: 'PlusJakartaSans_700Bold' }]} numberOfLines={1}>{challenge.name}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{challenge.duration_days} days · {challenge.category}</Text>
        </View>
        {isActive
          ? <Clock size={18} color={colors.primary} />
          : <CheckCircle size={18} color={colors.success} />}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1.5, gap: 12 },
  info: { flex: 1 },
  name: { fontSize: 15, marginBottom: 2 },
  meta: { fontSize: 12 },
});
