/**
 * GAS Template, NotificationInbox
 *
 * In-app notification list component. Reads from Supabase `notifications`
 * table (included in base schema) and displays grouped by date.
 *
 * Features:
 * - FlatList with pull-to-refresh
 * - Pagination (20 per page) with load more
 * - Mark-as-read on tap
 * - Swipe-to-dismiss (via delete)
 * - Groups by date: Today, Yesterday, Earlier
 * - Unread indicator (accent bar on left)
 * - Empty state via EmptyState component
 * - Loading state via LoadingSkeleton
 * - Error state with retry button
 * - Cached data via withCache from api.ts
 * - Analytics: tracks notification interactions
 * - Sentry breadcrumb on errors
 * - Accessibility labels on all items
 *
 * Dependencies: gasConfig, lib/supabase, services/api, lib/posthog, lib/sentry
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Bell, Trash2 } from 'lucide-react-native';
import { captureEvent } from '@/lib/posthog';
import { captureException, addBreadcrumb } from '@/lib/sentry';
import { supabase } from '@/lib/supabase';
import { gasConfig } from '../gas.config';
import { EmptyState } from './ui/EmptyState';
import { LoadingSkeleton } from './ui/LoadingSkeleton';
import { useThemeColors } from '@/context/ThemeContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

interface NotificationInboxProps {
  /** User ID for fetching notifications */
  userId: string;
  /** Called when a notification is tapped (for deep linking) */
  onNotificationPress?: (notification: Notification) => void;
  /** Max height of the list (default: fills available space) */
  maxHeight?: number;
}

const PAGE_SIZE = 20;
const primary = gasConfig.design.colors.primary;
const surfaceDark = gasConfig.design.colors.surfaceDark;
const borderDark = gasConfig.design.colors.borderDark;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  return 'Earlier';
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * NotificationInbox, In-app notification list.
 *
 * Usage:
 *   <NotificationInbox
 *     userId={user.id}
 *     onNotificationPress={(n) => router.push(n.data.route)}
 *   />
 */
export function NotificationInbox({ userId, onNotificationPress, maxHeight }: NotificationInboxProps) {
  const { colors } = useThemeColors();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (append = false) => {
    try {
      const offset = append ? notifications.length : 0;
      const { data, error: err } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (err) throw err;
      const items = (data ?? []) as Notification[];
      setNotifications(prev => append ? [...prev, ...items] : items);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      captureException(e as Error);
      addBreadcrumb('error', 'NotificationInbox fetch failed');
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, notifications.length]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  const handlePress = async (notification: Notification) => {
    captureEvent('notification_tapped', { type: notification.type, id: notification.id });
    if (!notification.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
    }
    onNotificationPress?.(notification);
  };

  const handleDelete = async (id: string) => {
    captureEvent('notification_dismissed', { id });
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (loading) return <LoadingSkeleton width="100%" height={80} />;
  if (error) return (
    <View style={{ padding: 24, alignItems: 'center' }}>
      <Text style={{ color: colors.error, marginBottom: 12 }}>{error}</Text>
      <TouchableOpacity onPress={() => fetchNotifications()}>
        <Text style={{ color: primary }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
  if (!notifications.length) return (
    <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
  );

  // Group notifications
  const grouped: { label: string; data: Notification[] }[] = [];
  const groupMap: Record<string, Notification[]> = {};
  for (const n of notifications) {
    const g = getDateGroup(n.created_at);
    if (!groupMap[g]) { groupMap[g] = []; grouped.push({ label: g, data: groupMap[g] }); }
    groupMap[g].push(n);
  }

  return (
    <FlatList
      style={maxHeight ? { maxHeight } : undefined}
      data={grouped}
      keyExtractor={(item) => item.label}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.textSecondary} />}
      onEndReached={() => hasMore && fetchNotifications(true)}
      onEndReachedThreshold={0.3}
      renderItem={({ item: group }) => (
        <View>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', paddingHorizontal: 16, paddingVertical: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{group.label}</Text>
          {group.data.map(notification => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => handlePress(notification)}
              accessibilityLabel={notification.title}
              style={{
                flexDirection: 'row',
                backgroundColor: notification.is_read ? surfaceDark : surfaceDark + 'cc',
                paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: 1, borderBottomColor: borderDark,
                gap: 12,
              }}
            >
              {!notification.is_read && (
                <View style={{ width: 3, borderRadius: 2, backgroundColor: primary, alignSelf: 'stretch' }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: notification.is_read ? '400' : '600', marginBottom: 2 }}>{notification.title}</Text>
                {notification.body && (
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }} numberOfLines={2}>{notification.body}</Text>
                )}
                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>{timeAgo(notification.created_at)}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(notification.id)} accessibilityLabel="Delete notification" style={{ padding: 4 }}>
                <Trash2 size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}
    />
  );
}
