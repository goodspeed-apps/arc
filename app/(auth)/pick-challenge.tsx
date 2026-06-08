import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  withSpring,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trackScreenLoad } from '@/lib/performance';
import { ChallengeCard } from '@/components/ChallengeCard';

const CATEGORIES = ['All', 'Discipline', 'Health', 'Focus', 'Sobriety'] as const;
type Category = (typeof CATEGORIES)[number];

export const LIBRARY_CHALLENGES = [
  { id: '1', name: 'No Social Media', category: 'Discipline', duration_days: 30, commitments: ['No Instagram', 'No TikTok', 'No Twitter'] },
  { id: '2', name: 'Daily Workout', category: 'Health', duration_days: 21, commitments: ['30 min exercise', 'Log reps'] },
  { id: '3', name: 'Cold Showers', category: 'Discipline', duration_days: 30, commitments: ['Cold shower before 8am'] },
  { id: '4', name: 'Alcohol-Free Month', category: 'Sobriety', duration_days: 30, commitments: ['No alcohol', 'Log cravings'] },
  { id: '5', name: 'Deep Work Blocks', category: 'Focus', duration_days: 14, commitments: ['2h focused work', 'Phone off'] },
  { id: '6', name: 'Gratitude Journal', category: 'Health', duration_days: 21, commitments: ['Write 3 things daily'] },
  { id: '7', name: 'No Junk Food', category: 'Health', duration_days: 30, commitments: ['No fast food', 'Cook at home'] },
  { id: '8', name: 'Quit Nicotine', category: 'Sobriety', duration_days: 60, commitments: ['No cigarettes', 'No vaping'] },
  { id: '9', name: 'Wake at 5am', category: 'Discipline', duration_days: 21, commitments: ['Alarm at 5am', 'No snooze'] },
  { id: '10', name: 'Meditation Daily', category: 'Focus', duration_days: 30, commitments: ['10 min meditation'] },
];

export default function PickChallenge() {
  const colors = useThemeColors();
  const router = useRouter();
  const { track } = useAnalytics();
  const startTime = useRef(Date.now());
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    track('onboarding_challenge_picker_viewed', {});
    trackScreenLoad('PickChallenge', startTime.current);
  }, [track]);

  const filtered = LIBRARY_CHALLENGES.filter(
    c => activeCategory === 'All' || c.category === activeCategory
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId(prev => (prev === id ? null : id));
  }, []);

  const handleStart = useCallback(async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    track('onboarding_challenge_selected', { challenge_id: id });
    router.push({ pathname: '/(auth)/commitment', params: { challengeId: id } });
  }, [track, router]);

  const handleBuildOwn = useCallback(() => {
    track('onboarding_build_own_tapped', {});
    router.push('/(auth)/custom-challenge');
  }, [track, router]);

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <Animated.View entering={FadeInDown.duration(400)} style={s.container}>
        <Text style={s.heading}>Choose Your{'\n'}Challenge</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow} contentContainerStyle={s.chipContent}>
          {CATEGORIES.map(cat => (
            <Pressable key={cat} onPress={() => setActiveCategory(cat)} style={[s.chip, activeCategory === cat && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
              <Text style={[s.chipText, activeCategory === cat && { color: colors.textOnPrimary }]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <ChallengeCard
              challenge={item}
              index={index}
              selected={selectedId === item.id}
              onSelect={() => handleSelect(item.id)}
              onStart={() => handleStart(item.id)}
              colors={colors}
            />
          )}
        />
      </Animated.View>

      <Pressable
        onPress={handleBuildOwn}
        style={s.buildOwn}
        accessibilityLabel="Build your own challenge"
        accessibilityHint="Navigate to the custom challenge creator"
      >
        <Text style={s.buildOwnText}>Build Your Own →</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
    heading: { fontSize: 32, fontFamily: 'JosefinSans_700Bold', color: colors.text, lineHeight: 38, marginBottom: 20 },
    chipRow: { marginBottom: 16, flexGrow: 0 },
    chipContent: { paddingRight: 12, gap: 8, flexDirection: 'row' },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    chipText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
    list: { paddingBottom: 100 },
    buildOwn: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 18, alignItems: 'center' },
    buildOwnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.accent },
  });
