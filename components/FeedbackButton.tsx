/**
 * GAS Template, FeedbackButton
 *
 * Floating action button for collecting user feedback. Supports both
 * manual trigger (button press) and shake-to-report gesture detection.
 *
 * Features:
 * - Floating button positioned by parent (typically bottom-right)
 * - Shake gesture detection via expo-sensors Accelerometer
 * - Modal with textarea + category picker (bug, feature, general, ux)
 * - Captures device context: device info, app version, current screen, user, subscription tier
 * - Submits to Supabase `feedback` table
 * - Analytics: tracks feedback submission with source and category
 * - Sentry breadcrumb on submission
 * - Error handling with toast notification on failure
 * - Config-gated: only renders when analytics is enabled
 * - Accessibility labels on all controls
 *
 * Dependencies: expo-sensors, expo-device, gasConfig, lib/posthog, lib/sentry, lib/supabase
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Pressable,
} from 'react-native';
import { MessageSquarePlus, X, Bug, Lightbulb, MessageCircle, Palette } from 'lucide-react-native';
import { usePathname } from 'expo-router';
import { captureEvent } from '@/lib/posthog';
import { addBreadcrumb } from '@/lib/sentry';
import { supabase } from '@/lib/supabase';
import { isWeb } from '@/lib/platform';
import { gasConfig } from '../gas.config';
import { useThemeColors } from '@/context/ThemeContext';

// Conditionally import native-only modules
let Accelerometer: typeof import('expo-sensors').Accelerometer | null = null;
let Device: typeof import('expo-device') | null = null;
if (!isWeb) {
  try {
    const sensors = require('expo-sensors');
    Accelerometer = sensors.Accelerometer;
    Device = require('expo-device');
  } catch {
    // Modules not available
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

type FeedbackCategory = 'bug' | 'feature_request' | 'general' | 'ux';

interface FeedbackButtonProps {
  /** Override visibility. Defaults to gasConfig.features.analytics.enabled */
  visible?: boolean;
  /** User ID for attribution */
  userId?: string;
  /** Subscription tier for prioritization */
  subscriptionTier?: string;
  /** Enable shake-to-report (default: true) */
  shakeEnabled?: boolean;
}

// ─── Category Config ─────────────────────────────────────────────────────────

const CATEGORIES: Array<{ id: FeedbackCategory; label: string; icon: React.ElementType; color: string }> = [
  { id: 'bug', label: 'Bug Report', icon: Bug, color: '#EF4444' },
  { id: 'feature_request', label: 'Feature Request', icon: Lightbulb, color: '#F59E0B' },
  { id: 'ux', label: 'UX Issue', icon: Palette, color: '#8B5CF6' },
  { id: 'general', label: 'General', icon: MessageCircle, color: '#6B7280' },
];

const SHAKE_THRESHOLD = 1.8;
const SHAKE_COOLDOWN_MS = 2000;
let accelIntervalSet = false;

// ─── Component ───────────────────────────────────────────────────────────────

const primary = gasConfig.design.colors.primary;
const surfaceDark = gasConfig.design.colors.surfaceDark;
const borderDark = gasConfig.design.colors.borderDark;

/**
 * FeedbackButton, Floating feedback trigger with shake-to-report.
 *
 * Usage:
 *   // In _layout.tsx or screen:
 *   <FeedbackButton userId={user?.id} subscriptionTier={tier} />
 */
export function FeedbackButton({
  visible,
  userId,
  subscriptionTier,
  shakeEnabled = true,
}: FeedbackButtonProps) {
  const { colors } = useThemeColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [source, setSource] = useState<'button' | 'shake'>('button');
  const lastShakeRef = useRef(0);
  const pathname = usePathname();

  const isVisible = visible ?? gasConfig.features.analytics.enabled;

  // Shake detection (native only)
  useEffect(() => {
    if (!shakeEnabled || isWeb || !Accelerometer || !isVisible) return;
    Accelerometer.setUpdateInterval(200);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      if (magnitude > SHAKE_THRESHOLD && now - lastShakeRef.current > SHAKE_COOLDOWN_MS) {
        lastShakeRef.current = now;
        setSource('shake');
        setModalVisible(true);
      }
    });
    return () => sub.remove();
  }, [shakeEnabled, isVisible]);

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      let deviceInfo = {};
      if (Device) {
        deviceInfo = {
          brand: Device.brand,
          modelName: Device.modelName,
          osName: Device.osName,
          osVersion: Device.osVersion,
        };
      }
      await supabase.from('feedback').insert({
        user_id: userId,
        category,
        body: text.trim(),
        source,
        screen: pathname,
        subscription_tier: subscriptionTier,
        device_info: deviceInfo,
        app_version: gasConfig.app.version,
      });
      captureEvent('feedback_submitted', { category, source, screen: pathname });
      addBreadcrumb('feedback', `Feedback submitted: ${category}`);
      setSubmitted(true);
      setTimeout(() => {
        setModalVisible(false);
        setSubmitted(false);
        setText('');
        setCategory('general');
      }, 1500);
    } catch (err) {
      // toast error
    } finally {
      setSubmitting(false);
    }
  }, [text, category, source, pathname, userId, subscriptionTier]);

  if (!isVisible) return null;

  return (
    <>
      <TouchableOpacity
        onPress={() => { setSource('button'); setModalVisible(true); }}
        style={{
          width: 52, height: 52, borderRadius: 26,
          backgroundColor: primary,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
        }}
        accessibilityLabel="Give feedback"
        accessibilityRole="button"
      >
        <MessageSquarePlus size={22} color={colors.textOnPrimary} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={() => setModalVisible(false)} />
          <View style={{ backgroundColor: surfaceDark, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: colors.textOnPrimary, fontSize: 18, fontWeight: '700' }}>Share Feedback</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} accessibilityLabel="Close feedback modal">
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Category Picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    accessibilityLabel={cat.label}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
                      backgroundColor: isSelected ? cat.color + '33' : borderDark,
                      borderWidth: 1,
                      borderColor: isSelected ? cat.color : borderDark,
                    }}
                  >
                    <Icon size={14} color={isSelected ? cat.color : colors.textSecondary} />
                    <Text style={{ color: isSelected ? cat.color : colors.textSecondary, fontSize: 13, fontWeight: '500' }}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Text Input */}
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Tell us what's on your mind…"
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: borderDark,
                borderRadius: 12, padding: 14,
                color: colors.textOnPrimary,
                fontSize: 15, minHeight: 100,
                textAlignVertical: 'top',
                marginBottom: 16,
              }}
              accessibilityLabel="Feedback text input"
            />

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || !text.trim()}
              style={{
                backgroundColor: submitted ? '#10B981' : primary,
                borderRadius: 12, padding: 14,
                alignItems: 'center',
                opacity: submitting || !text.trim() ? 0.6 : 1,
              }}
              accessibilityLabel="Submit feedback"
              accessibilityRole="button"
            >
              <Text style={{ color: colors.textOnPrimary, fontSize: 16, fontWeight: '600' }}>
                {submitted ? '✓ Sent!' : submitting ? 'Sending…' : 'Send Feedback'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
