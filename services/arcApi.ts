import { supabase } from '@/lib/supabase';
import { withCache, trackApiLatency } from '@/services/api';
import { captureException } from '@/lib/sentry';
import type { Challenge, DayLog, StreakSnapshot, Badge, ProofCard, WeeklyInsight } from '@/types/arc';

export async function getActiveChallenge(userId: string): Promise<Challenge | null> {
  return trackApiLatency('getActiveChallenge', async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) { captureException(error, { screen: 'arcApi', action: 'getActiveChallenge' }); throw error; }
    return data as Challenge | null;
  });
}

export async function getChallenges(userId: string): Promise<Challenge[]> {
  return trackApiLatency('getChallenges', async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { captureException(error, { screen: 'arcApi', action: 'getChallenges' }); throw error; }
    return (data ?? []) as Challenge[];
  });
}

export async function getStreakSnapshot(challengeId: string): Promise<StreakSnapshot | null> {
  return trackApiLatency('getStreakSnapshot', async () => {
    const { data, error } = await supabase
      .from('streak_snapshots')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) { captureException(error, { screen: 'arcApi', action: 'getStreakSnapshot' }); throw error; }
    return data as StreakSnapshot | null;
  });
}

export async function getDayLogs(challengeId: string): Promise<DayLog[]> {
  return trackApiLatency('getDayLogs', async () => {
    const { data, error } = await supabase
      .from('day_logs')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('day_number', { ascending: true });
    if (error) { captureException(error, { screen: 'arcApi', action: 'getDayLogs' }); throw error; }
    return (data ?? []) as DayLog[];
  });
}

export async function getTodayLog(challengeId: string, userId: string): Promise<DayLog | null> {
  const today = new Date().toISOString().split('T')[0];
  return trackApiLatency('getTodayLog', async () => {
    const { data, error } = await supabase
      .from('day_logs')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .eq('log_date', today)
      .maybeSingle();
    if (error) { captureException(error, { screen: 'arcApi', action: 'getTodayLog' }); throw error; }
    return data as DayLog | null;
  });
}

export async function upsertDayLog(log: Partial<DayLog> & { challenge_id: string; user_id: string; log_date: string; day_number: number }): Promise<DayLog> {
  return trackApiLatency('upsertDayLog', async () => {
    const { data, error } = await supabase
      .from('day_logs')
      .upsert(log, { onConflict: 'challenge_id,log_date' })
      .select()
      .single();
    if (error) { captureException(error, { screen: 'arcApi', action: 'upsertDayLog' }); throw error; }
    return data as DayLog;
  });
}

export async function createChallenge(challenge: Omit<Challenge, 'id' | 'created_at' | 'updated_at'>): Promise<Challenge> {
  return trackApiLatency('createChallenge', async () => {
    const { data, error } = await supabase
      .from('challenges')
      .insert(challenge)
      .select()
      .single();
    if (error) { captureException(error, { screen: 'arcApi', action: 'createChallenge' }); throw error; }
    return data as Challenge;
  });
}

export async function getBadges(userId: string): Promise<Badge[]> {
  return trackApiLatency('getBadges', async () => {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
    if (error) { captureException(error, { screen: 'arcApi', action: 'getBadges' }); throw error; }
    return (data ?? []) as Badge[];
  });
}

export async function getProofCards(userId: string): Promise<ProofCard[]> {
  return trackApiLatency('getProofCards', async () => {
    const { data, error } = await supabase
      .from('proof_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { captureException(error, { screen: 'arcApi', action: 'getProofCards' }); throw error; }
    return (data ?? []) as ProofCard[];
  });
}

export async function getWeeklyInsight(userId: string): Promise<WeeklyInsight | null> {
  return trackApiLatency('getWeeklyInsight', async () => {
    const { data, error } = await supabase
      .from('weekly_insights')
      .select('*')
      .eq('user_id', userId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) { captureException(error, { screen: 'arcApi', action: 'getWeeklyInsight' }); throw error; }
    return data as WeeklyInsight | null;
  });
}

export async function updateChallengeStatus(challengeId: string, status: 'completed' | 'abandoned', timestamp: string): Promise<void> {
  return trackApiLatency('updateChallengeStatus', async () => {
    const field = status === 'completed' ? 'completed_at' : 'abandoned_at';
    const { error } = await supabase
      .from('challenges')
      .update({ status, [field]: timestamp, updated_at: new Date().toISOString() })
      .eq('id', challengeId);
    if (error) { captureException(error, { screen: 'arcApi', action: 'updateChallengeStatus' }); throw error; }
  });
}
