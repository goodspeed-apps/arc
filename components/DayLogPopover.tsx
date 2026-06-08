import React from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { X, CheckCircle2, XCircle, Snowflake } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

interface DayLog {
  id: string; log_date: string; day_number: number; status: string;
  commitment_checks: Record<string, boolean>; freeze_applied: boolean;
  all_complete: boolean; acknowledged_miss: boolean;
}
interface Props { log: DayLog; onClose: () => void; }

export function DayLogPopover({ log, onClose }: Props) {
  const colors = useThemeColors();
  const entries = Object.entries(log.commitment_checks ?? {});

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.shadow, justifyContent: 'center', paddingHorizontal: 24 }} onPress={onClose}>
        <Animated.View entering={FadeInDown.duration(300)} style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: colors.text }}>Day {log.day_number}</Text>
            <Pressable onPress={onClose} accessibilityLabel="Close" accessibilityHint="Dismisses the day detail">
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            {log.freeze_applied && <Snowflake size={16} color={colors.warning} />}
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSecondary }}>
              {log.freeze_applied ? 'Freeze used' : log.status.charAt(0).toUpperCase() + log.status.slice(1)} · {log.log_date}
            </Text>
          </View>
          {entries.length > 0 && (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 200 }}>
              {entries.map(([key, done]) => (
                <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
                  {done ? <CheckCircle2 size={16} color={colors.success} /> : <XCircle size={16} color={colors.error} />}
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text, flex: 1 }}>{key}</Text>
                </View>
              ))}
            </ScrollView>
          )}
          {entries.length === 0 && <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>No commitments logged for this day.</Text>}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
