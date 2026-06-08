/**
 * Admin, Support
 *
 * Triage view for feedback_threads. Lists threads, shows full message history
 * in a modal, allows admin replies and marking threads resolved.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VirtualList } from '@/components/VirtualList';
import { useThemeColors } from '@/context/ThemeContext';

interface Thread {
  id: string;
  subject: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Supabase returns the joined relation as an array or single object depending on query shape
  profiles?: { display_name: string | null } | { display_name: string | null }[] | null;
}

interface Message {
  id: string;
  body: string | null;
  author_role: string | null;
  author_id: string | null;
  created_at: string | null;
}

export default function AdminSupportScreen() {
  const { colors } = useThemeColors();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    // Disambiguate the FK to public.profiles (added in migration 012); the
    // base feedback_threads.user_id FK points at auth.users which PostgREST
    // can't traverse from the anon schema.
    const { data } = await supabase
      .from('feedback_threads')
      .select('id, subject, status, created_at, updated_at, profiles!feedback_threads_user_id_profiles_fk(display_name)')
      .order('updated_at', { ascending: false });
    setThreads((data ?? []) as unknown as Thread[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  const openThread = useCallback(async (thread: Thread) => {
    setActive(thread);
    setMsgLoading(true);
    const { data } = await supabase
      .from('feedback_messages')
      .select('id, body, author_role, author_id, created_at')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true });
    setMessages((data ?? []) as Message[]);
    setMsgLoading(false);
  }, []);

  const sendReply = useCallback(async () => {
    if (!active || !reply.trim()) return;
    setSending(true);
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user?.id;
    // Round-tripping select().single() avoids re-fetching the entire thread
    // after every reply; we just append the new row to local state.
    const { data: inserted, error } = await supabase
      .from('feedback_messages')
      .insert({
        thread_id: active.id,
        body: reply.trim(),
        author_role: 'admin',
        author_id: uid,
      })
      .select('id, body, author_role, author_id, created_at')
      .single();
    if (!error && inserted) {
      setMessages(prev => [...prev, inserted as Message]);
      setReply('');
    }
    setSending(false);
  }, [active, reply]);

  const markResolved = useCallback(async () => {
    if (!active) return;
    const previousStatus = active.status;
    // Optimistic update with revert-on-failure: snapshot the prior status so
    // a network failure rolls the badge back instead of stranding a stale UI.
    setActive(prev => prev ? { ...prev, status: 'resolved' } : prev);
    setThreads(prev => prev.map(t => t.id === active.id ? { ...t, status: 'resolved' } : t));
    const { error } = await supabase.from('feedback_threads').update({ status: 'resolved' }).eq('id', active.id);
    if (error) {
      setActive(prev => prev ? { ...prev, status: previousStatus } : prev);
      setThreads(prev => prev.map(t => t.id === active.id ? { ...t, status: previousStatus } : t));
    }
  }, [active]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    messagesList: {
      flex: 1,
      padding: 16,
    },
    messageBubble: {
      maxWidth: '80%',
      borderRadius: 12,
      padding: 10,
      marginBottom: 8,
    },
    adminBubble: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
    },
    userBubble: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
    },
    adminBubbleText: {
      color: colors.textOnPrimary,
    },
    userBubbleText: {
      color: colors.text,
    },
    replyRow: {
      flexDirection: 'row',
      padding: 12,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    replyInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonText: {
      color: colors.textOnPrimary,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VirtualList
        data={threads}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          return (
            <Card onPress={() => openThread(item)} style={{ margin: 8 }}>
              <Text style={{ fontWeight: '600', color: colors.text }}>{item.subject ?? '(no subject)'}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {profile?.display_name ?? 'Unknown'} · {item.status ?? 'open'}
              </Text>
            </Card>
          );
        }}
      />

      {active && (
        <Modal visible animationType="slide" onRequestClose={() => setActive(null)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{active.subject ?? '(no subject)'}</Text>
              <Button title="Close" onPress={() => setActive(null)} />
              {active.status !== 'resolved' && (
                <Button title="Resolve" onPress={markResolved} />
              )}
            </View>

            {msgLoading ? (
              <ActivityIndicator style={{ margin: 20 }} color={colors.primary} />
            ) : (
              <ScrollView style={styles.messagesList}>
                {messages.map(m => {
                  const isAdmin = m.author_role === 'admin';
                  return (
                    <View
                      key={m.id}
                      style={[styles.messageBubble, isAdmin ? styles.adminBubble : styles.userBubble]}
                    >
                      <Text style={isAdmin ? styles.adminBubbleText : styles.userBubbleText}>
                        {m.body}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.replyRow}>
              <TextInput
                style={styles.replyInput}
                value={reply}
                onChangeText={setReply}
                placeholder="Reply…"
                placeholderTextColor={colors.placeholder}
                multiline
              />
              <TouchableOpacity style={styles.sendButton} onPress={sendReply} disabled={sending}>
                {sending ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.sendButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
