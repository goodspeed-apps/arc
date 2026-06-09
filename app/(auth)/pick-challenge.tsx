import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, ScrollView,
  StyleSheet, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trackScreenLoad } from '@/lib/performance';
import { captureException } from '@/lib/sentry';
import { ChallengeCard } from '@/components/ChallengeCard';

const CATEGORIES = ['All', 'Discipline', 'Health', 'Focus', 'Sobriety'];

const LIBRARY: LibraryChallenge[] = [
  { id: '1', name: 'No Social Media', category: 'Discipline', duration_days: 30, commitments: ['No Instagram', 'No TikTok', 'No Twitter'] },
  { id: '2', name: 'Daily Exercise', category: 'Health', duration_days: 21, commitments: ['30 min movement', 'Log it daily'] },
  { id: '3', name: 'Deep Work Blocks', category: 'Focus', duration_days: 14, commitments: ['2h focused work', 'No phone during block'] },
  { id: '4', name: 'Alcohol Free', category: 'Sobriety', duration_days: 30, commitments: ['No alcohol', 'Track urges'] },
  { id: '5', name: 'Cold Showers', category: 'Discipline', duration_days: 21, commitments: ['Cold shower every morning'] },
  { id: '6', name: 'Read Daily', category: 'Focus', duration_days: 30, commitments: ['Read 20 pages', 'No screens 1h before bed'] },
  { id: '7', name: 'Meditation', category: 'Health', duration_days: 14, commitments: ['10 min meditation', 'Journal after'] },
  { id: '8', name: 'No Junk Food', category: 'Health', duration_days: 21, commitments: ['No fast food', 'Cook at home', 'Log meals'] },
  { id: '9', name: 'Quit Nicotine', category: 'Sobriety', duration_days: 30, commitments: ['Zero cigarettes', 'Track cravings'] },
  { id: '10', name: 'No Procrastination', category: 'Discipline', duration_days: 14, commitments: ['MIT done by 10am', 'No idle browsing'] },
];

export type LibraryChallenge = {
  id: string; name: string; category: string;
  duration_days: number; commitments: string[];
};

export default function PickChallengeScreen() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const [category, setCategory] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const startTime = Date.now();

  useEffect(() => {
    try {
      track('onboarding_challenge_picker_viewed', {});
      trackScreenLoad('pick_challenge', startTime);
    } catch (e) { captureException(e as Error, { screen: 'pick_challenge', action: 'mount' }); }
  }, []);

  const filtered = category === 'All' ? LIBRARY : LIBRARY.filter(c => c.category === category);

  const handleStart = useCallback(async (challenge: LibraryChallenge) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      track('challenge_selected', { challenge_id: challenge.id, name: challenge.name });
      router.push({ pathname: '/(auth)/commitment', params: { challengeId: challenge.id, name: challenge.name, duration: challenge.duration_days, commitments: JSON.stringify(challenge.commitments) } });
    } catch (e) { captureException(e as Error, { screen: 'pick_challenge', action: 'start_challenge' }); }
  }, [track]);

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1 }}>
        <Text style={s.header}>Choose Your{'\n'}Challenge</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {CATEGORIES.map(cat => (
            <Pressable key={cat} onPress={() => setCategory(cat)}
              style={[s.chip, cat === category && s.chipActive]}
              accessibilityLabel={`Filter by ${cat}`} accessibilityHint="Filters the challenge list">
              <Text style={[s.chipText, cat === category && s.chipTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          renderItem={({ item, index }) => (
            <ChallengeCard item={item} index={index} selected={selectedId === item.id}
              onSelect={() => setSelectedId(prev => prev === item.id ? null : item.id)}
              onStart={() => handleStart(item)} colors={colors} />
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(200)} style={[s.sticky, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.push('/(auth)/custom-challenge')} style={s.buildBtn}
          accessibilityLabel="Build your own challenge" accessibilityHint="Opens the custom challenge creator">
          <Text style={[s.buildText, { color: colors.primary }]}>Build Your Own →</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = (c: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  header: { fontSize: 32, fontFamily: 'JosefinSans_700Bold', color: c.text, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, lineHeight: 38 },
  chips: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  chipActive: { borderColor: c.primary, backgroundColor: c.primaryMuted },
  chipText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: c.textSecondary },
  chipTextActive: { color: c.primary },
  sticky: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1, borderTopColor: c.border },
  buildBtn: { alignItems: 'center', paddingVertical: 14, minHeight: 44 },
  buildText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
