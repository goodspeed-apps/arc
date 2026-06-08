import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
  const [showEmail, setShowEmail] = useState(false);

  React.useEffect(() => {
    const start = Date.now();
    track('sign_in_viewed');
    trackScreenLoad('SignIn', start);
  }, []);

  const handleApple = async () => {
    if (!AppleAuth) return;
    try {
      setLoading('apple');
      setError(null);
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
      track('sign_in_success', { provider: 'apple' });
      router.back();
    } catch (e) {
      const err = e as Error;
      captureException(err, { screen: 'SignIn', action: 'apple_auth' });
      setError("Apple sign-in failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading('google');
      setError(null);
      const { error: sbError } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (sbError) throw sbError;
      track('sign_in_success', { provider: 'google' });
    } catch (e) {
      const err = e as Error;
      captureException(err, { screen: 'SignIn', action: 'google_auth' });
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityHint="Returns to settings"
          style={{ padding: 16 }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>

        <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'JosefinSans_700Bold', fontSize: 28, color: colors.text, marginBottom: 8 }}>
            Sync Your Record
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: colors.textSecondary, marginBottom: 32 }}>
            Create an account to back up your discipline record.
          </Text>

          {error && (
            <Animated.View entering={FadeInDown} style={{ backgroundColor: colors.negativeMuted, borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <Text style={{ color: colors.error, fontFamily: 'Manrope_400Regular', fontSize: 14 }}>{error}</Text>
            </Animated.View>
          )}

          {Platform.OS === 'ios' && AppleAuth && (
            <Animated.View entering={FadeInDown.delay(50)}>
              <Pressable
                onPress={handleApple}
                disabled={loading !== null}
                accessibilityLabel="Sign in with Apple"
                accessibilityHint="Opens Apple authentication"
                style={{ backgroundColor: colors.text, borderRadius: 12, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
              >
                {loading === 'apple' ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={{ color: colors.background, fontFamily: 'Manrope_400Regular', fontSize: 16, fontWeight: '600' }}>
                    🍎  Sign in with Apple
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(100)}>
            <Pressable
              onPress={handleGoogle}
              disabled={loading !== null}
              accessibilityLabel="Sign in with Google"
              accessibilityHint="Opens Google authentication"
              style={{ backgroundColor: colors.surfaceElevated, borderRadius: 12, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: colors.border }}
            >
              {loading === 'google' ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={{ color: colors.text, fontFamily: 'Manrope_400Regular', fontSize: 16, fontWeight: '600' }}>
                  G  Sign in with Google
                </Text>
              )}
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150)}>
            <Pressable
              onPress={() => setShowEmail(v => !v)}
              accessibilityLabel="Other sign-in options"
              accessibilityHint="Expand email and password option"
              style={{ alignItems: 'center', marginBottom: 32 }}
            >
              <Text style={{ color: colors.primary, fontFamily: 'Manrope_400Regular', fontSize: 14 }}>
                {showEmail ? 'Hide options' : 'Other options'}
              </Text>
            </Pressable>

            {showEmail && (
              <Pressable
                onPress={() => router.push('/(auth)/login')}
                accessibilityLabel="Sign in with email"
                accessibilityHint="Opens email and password sign in"
                style={{ backgroundColor: colors.surface, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: colors.border }}
              >
                <Text style={{ color: colors.text, fontFamily: 'Manrope_400Regular', fontSize: 15 }}>
                  Sign in with Email
                </Text>
              </Pressable>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <Shield size={14} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontFamily: 'Manrope_400Regular', fontSize: 12, textAlign: 'center', flex: 1 }}>
              Your challenge data stays on-device. Account only for backup.
            </Text>
          </Animated.View>

          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Skip sign in"
            accessibilityHint="Continue without an account"
            style={{ alignItems: 'center', marginTop: 24 }}
          >
            <Text style={{ color: colors.textSecondary, fontFamily: 'Manrope_400Regular', fontSize: 14 }}>
              Skip for now
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
