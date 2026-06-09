import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, Modal,
  ScrollView, RefreshControl, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { X, Zap, Clock, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trackScreenLoad, trackApiLatency } from '@/lib/performance';
import { captureException } from '@/lib/sentry';
import { LIBRARY_CHALLENGES, type LibraryChallenge } from '@/components/ChallengeLibraryData';

const CATEGORIES = ['All', 'Discipline', 'Sobriety', 'Fitness', 'Focus', 'Mindset'] as const;
type Category = typeof CATEGORIES[number];

const DIFFICULTY_COLORS_KEY: Record<string, 'success' | 'warning' | 'error'> = {
  Easy: 'success', Medium: 'warning', Hard: 'error',
};

export default function ChallengeLibraryScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { track } = useAnalytics();
  const [category, setCategory] = useState<Category>('All');
  const [selected, setSelected] = useState<LibraryChallenge | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const start = Date.now();
    track('library_viewed');
    trackScreenLoad('ChallengeLibrary', start);
  }, []);

  const filtered = category === 'All'
    ? LIBRARY_CHALLENGES
    : LIBRARY_CHALLENGES.filter(c => c.category === category);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const handleCategoryPress = (cat: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategory(cat);
    track('library_category_filter', { category: cat });
  };

  const handleCardPress = (item: LibraryChallenge) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(item);
    track('library_challenge_expanded', { id: item.id });
  };

  const handleStart = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    track('library_challenge_start', { id: selected.id, name: selected.name });
    setSelected(null);
    router.push({ pathname: '/(modal)/create-challenge', params: { libraryId: selected.id } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
        <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 22, color: colors.text }}>Challenge Library</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close" accessibilityHint="Dismiss this screen" style={{ padding: 8 }}>
          <X size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 4 }}>
        {CATEGORIES.map(cat => (
          <Pressable key={cat} onPress={() => handleCategoryPress(cat)}
            accessibilityLabel={`Filter by ${cat}`} accessibilityHint={`Show ${cat} challenges`}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: category === cat ? colors.primary : colors.surface, borderWidth: 1, borderColor: category === cat ? colors.primary : colors.border }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: category === cat ? colors.textOnPrimary : colors.textSecondary }}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(50 * index).springify()}>
            <ChallengeCard item={item} onPress={() => handleCardPress(item)} />
          </Animated.View>
        )}
        ListFooterComponent={
          <Pressable onPress={() => router.push('/(modal)/create-challenge')} accessibilityLabel="Create custom challenge" accessibilityHint="Build your own challenge from scratch"
            style={{ marginTop: 8, padding: 16, borderRadius: 14, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.primary }}>+ Create Custom Challenge</Text>
          </Pressable>
        }
      />

      <Modal visible={!!selected} animationType="slide" transparent presentationStyle="overFullScreen">
        {selected && <DetailSheet challenge={selected} onClose={() => setSelected(null)} onStart={handleStart} />}
      </Modal>
    </SafeAreaView>
  );
}

function ChallengeCard({ item, onPress }: { item: LibraryChallenge; onPress: () => void }) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const diffColor = colors[DIFFICULTY_COLORS_KEY[item.difficulty] ?? 'warning'];
  return (
    <Animated.View style={animStyle}>
      <Pressable onPress={onPress} onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        accessibilityLabel={`${item.name} challenge`} accessibilityHint="Tap to see details and start"
        style={{ backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 17, color: colors.text, flex: 1, marginRight: 8 }}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: diffColor }} />
            <View style={{ backgroundColor: colors.primaryMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.primary }}>{item.duration_days}d</Text>
            </View>
          </View>
        </View>
        <Text numberOfLines={2} style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textSecondary, marginTop: 6 }}>{item.description}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {item.commitments.slice(0, 3).map((c, i) => (
            <View key={i} style={{ backgroundColor: colors.surfaceSecondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.textMuted }}>{c}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary, marginRight: 4 }}>View Details</Text>
          <ChevronRight size={14} color={colors.primary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function DetailSheet({ challenge, onClose, onStart }: { challenge: LibraryChallenge; onClose: () => void; onStart: () => void }) {
  const colors = useThemeColors();
  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.shadow }}>
      <Animated.View entering={FadeInDown.springify()} style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 20, color: colors.text, flex: 1 }}>{challenge.name}</Text>
          <Pressable onPress={onClose} accessibilityLabel="Close detail" style={{ padding: 6 }}>
            <X size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
              <Clock size={13} color={colors.primary} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.primary }}>{challenge.duration_days} days</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceSecondary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
              <Zap size={13} color={colors.textSecondary} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.textSecondary }}>{challenge.difficulty}</Text>
            </View>
          </View>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 18 }}>{challenge.description}</Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.text, marginBottom: 10 }}>Daily Commitments</Text>
          {challenge.commitments.map((c, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text }}>{c}</Text>
            </View>
          ))}
          {challenge.completion_rate != null && (
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted, marginTop: 14 }}>
              {(challenge.completion_rate * 100).toFixed(0)}% of people who started this finished it
            </Text>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
        <Pressable onPress={onStart} accessibilityLabel="Accept and start this challenge" accessibilityHint="Begins the challenge setup flow"
          style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 }}>
          <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 16, color: colors.textOnPrimary }}>I Accept</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
