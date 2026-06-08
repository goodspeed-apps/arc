import React from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import Animated, { FadeInDown, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { X, Check } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { LibraryChallenge } from '@/services/libraryData';

interface Props { challenge: LibraryChallenge; onClose: () => void; onStart: () => void; }

export function ChallengeDetailSheet({ challenge, onClose, onStart }: Props) {
  const colors = useThemeColors();
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.shadow }} onPress={onClose} accessibilityLabel="Close detail sheet" />
      <Animated.View entering={FadeInDown.duration(320)} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '78%' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 22, color: colors.text, flex: 1 }}>{challenge.name}</Text>
          <Pressable onPress={onClose} accessibilityLabel="Close" hitSlop={10} style={{ padding: 6, borderRadius: 16, backgroundColor: colors.surfaceElevated }}>
            <X size={18} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 18 }}>{challenge.description}</Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.text, marginBottom: 10, letterSpacing: 0.8, textTransform: 'uppercase' }}>Daily Commitments</Text>
          {challenge.commitments.map((c, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(40 * i).duration(250)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                <Check size={13} color={colors.primary} />
              </View>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text, flex: 1 }}>{c}</Text>
            </Animated.View>
          ))}
          <View style={{ marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: colors.surfaceElevated }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Community Stats</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.primary }}>{challenge.completionRate}% completion</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted }}>{challenge.participantCount.toLocaleString()} participants</Text>
          </View>
        </ScrollView>
        <Animated.View style={btnStyle}>
          <Pressable
            onPress={onStart}
            onPressIn={() => { btnScale.value = withSpring(0.97, { damping: 15 }); }}
            onPressOut={() => { btnScale.value = withSpring(1, { damping: 15 }); }}
            accessibilityLabel={`Accept and start ${challenge.name}`}
            accessibilityHint="Creates this challenge and navigates to commitment setup"
            style={{ backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', minHeight: 56 }}
          >
            <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 17, color: colors.textOnPrimary, letterSpacing: 0.5 }}>I Accept, Start Challenge</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
