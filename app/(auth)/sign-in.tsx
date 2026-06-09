import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';
import { trackScreenLoad } from '@/lib/performance';
import { ChevronLeft, Shield } from 'lucide-react-native';

const AppleAuth = Platform.OS === 'ios' ? require('expo-apple-authentication') : null;

export default function SignInScreen() {
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const start = Date.now();

  useEffect(() => {
    track('sign_in_viewed');
    trackScreenLoad('SignIn', start);
  }, []);

  const handleApple = useCallback(async () => {
    if (!AppleAuth) return;
    try {
      setError(null);
      setLoading('apple');
      track('sign_in_apple_tapped');
      const credential = await AppleAuth.signInAsync({
        requestedScopes: [
          AppleAuth.AppleAuthenticationScope.FULL_NAME,
          AppleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });
      const { error: sbError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken ?? '',
      });
      if (sbError) throw sbError;
      router.replace('/(tabs)/placeholder');
    } catch (e) {
      captureException(e as Error, { screen: 'SignIn', action: 'apple' });
      setError('Apple sign-in failed. Please try again.');
    } finally {
      setLoading(null);
    }
  }, []);

  const handleGoogle = useCallback(async () => {
    try {
      setError(null);
      setLoading('google');
      track('sign_in_google_tapped');
      const { error: sbError } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (sbError) throw sbError;
    } catch (e) {
      captureException(e as Error, { screen: 'SignIn', action: 'google' });
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(null);
    }
  }, []);

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <Animated.View entering={FadeInDown.duration(400)} style={s.container}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" accessibilityHint="Return to settings" style={s.back}>
          <ChevronLeft size={22} color={colors.textSecondary} />
          <Text style={s.backText}>Back</Text>
        </Pressable>

        <View style={s.card}>
          <Text style={s.title}>Sync Your Record</Text>
          <Text style={s.subtitle}>{"Create an account to back up your discipline record."}</Text>

          {error ? <Text style={s.error}>{error}</Text> : null}

          {Platform.OS === 'ios' && AppleAuth ? (
            <Pressable onPress={handleApple} disabled={!!loading} accessibilityLabel="Sign in with Apple" accessibilityHint="Authenticates using your Apple ID" style={[s.appleBtn]}>
              {loading === 'apple' ? <ActivityIndicator color={colors.textOnPrimary} /> : (
                <Text style={s.appleBtnText}>🍎  Sign in with Apple</Text>
              )}
            </Pressable>
          ) : null}

          <Pressable onPress={handleGoogle} disabled={!!loading} accessibilityLabel="Sign in with Google" accessibilityHint="Authenticates using your Google account" style={s.googleBtn}>
            {loading === 'google' ? <ActivityIndicator color={colors.text} /> : (
              <Text style={s.googleBtnText}>G   Sign in with Google</Text>
            )}
          </Pressable>

          <View style={s.privacyRow}>
            <Shield size={14} color={colors.textMuted} />
            <Text style={s.privacyText}>{"Your challenge data stays on-device. Account only for backup."}</Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
    back: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 16, left: 16, minHeight: 44, paddingHorizontal: 8 },
    backText: { color: colors.textSecondary, fontSize: 15, fontFamily: 'Inter_400Regular', marginLeft: 2 },
    card: { backgroundColor: colors.surface, borderRadius: 20, padding: 28, shadowColor: colors.shadow, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
    title: { fontSize: 26, fontFamily: 'JosefinSans_700Bold', color: colors.text, marginBottom: 8 },
    subtitle: { fontSize: 14, fontFamily: 'Manrope_400Regular', color: colors.textSecondary, marginBottom: 24, lineHeight: 20 },
    error: { color: colors.error, fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 12 },
    appleBtn: { backgroundColor: colors.text, borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    appleBtnText: { color: colors.background, fontSize: 15, fontFamily: 'Inter_400Regular' },
    googleBtn: { backgroundColor: colors.surfaceElevated, borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    googleBtnText: { color: colors.text, fontSize: 15, fontFamily: 'Inter_400Regular' },
    privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    privacyText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textMuted, lineHeight: 16 },
  });
