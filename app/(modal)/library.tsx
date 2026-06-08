import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Plus, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trackScreenLoad } from '@/lib/performance';
import { ChallengeCard } from '@/components/ChallengeCard';
import { ChallengeDetailSheet } from '@/components/ChallengeDetailSheet';
import { LIBRARY_CHALLENGES, CATEGORIES, LibraryChallenge } from '@/services/libraryData';

export default function LibraryScreen() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const startTime = useRef(Date.now());

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedChallenge, setSelectedChallenge] = useState<LibraryChallenge | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = activeCategory === 'All'
    ? LIBRARY_CHALLENGES
    : LIBRARY_CHALLENGES.filter(c => c.category === activeCategory);

  useEffect(() => {
    track('library_viewed');
    trackScreenLoad('ChallengeLibrary', startTime.current);
  }, []);

  const handleCategory = useCallback((cat: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(cat);
    track('library_category_filtered', { category: cat });
  }, [track]);

  const handleCardPress = useCallback((challenge: LibraryChallenge) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedChallenge(challenge);
    track('library_challenge_expanded', { id: challenge.id });
  }, [track]);

  const handleStart = useCallback((challenge: LibraryChallenge) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedChallenge(null);
    track('library_challenge_started', { id: challenge.id, name: challenge.name });
    router.push({ pathname: '/(modal)/create-challenge', params: { libraryId: challenge.id } });
  }, [track]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View entering={FadeInDown.duration(350)} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 26, color: colors.text, letterSpacing: 0.5 }}>
            Challenge Library
          </Text>
          <Pressable onPress={() => router.back()} accessibilityLabel="Close library" accessibilityHint="Dismisses this screen" hitSlop={10} style={{ padding: 8, borderRadius: 20, backgroundColor: colors.surfaceElevated }}>
            <X size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Category Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8, flexDirection: 'row' }}>
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => handleCategory(cat)}
                accessibilityLabel={`Filter by ${cat}`}
                accessibilityHint={`Shows only ${cat} challenges`}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? colors.primary : colors.surfaceElevated, borderWidth: 1, borderColor: active ? colors.primary : colors.border, minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: active ? colors.textOnPrimary : colors.textSecondary }}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Challenge List */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(50 * index).duration(300)}>
              <ChallengeCard challenge={item} onPress={() => handleCardPress(item)} />
            </Animated.View>
          )}
          ListFooterComponent={
            <Pressable
              onPress={() => { track('library_custom_tapped'); router.push('/(modal)/create-challenge'); }}
              accessibilityLabel="Create a custom challenge"
              accessibilityHint="Opens screen to build your own challenge"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, padding: 18, borderRadius: 16, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed', gap: 8, minHeight: 60 }}
            >
              <Plus size={18} color={colors.primary} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.primary }}>Create Custom Challenge</Text>
            </Pressable>
          }
        />
      </Animated.View>

      {selectedChallenge && (
        <ChallengeDetailSheet
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
          onStart={() => handleStart(selectedChallenge)}
        />
      )}
    </SafeAreaView>
  );
}
