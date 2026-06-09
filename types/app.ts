import type { PurchasesOfferings, CustomerInfo } from 'react-native-purchases';

// ─── Enums / Literals ─────────────────────────────────────────────────────────

export type ChallengeStatus = 'active' | 'completed' | 'abandoned';
export type DayLogStatus = 'pending' | 'complete' | 'frozen' | 'missed';
export type SubscriptionTier = 'free' | 'pro';
export type ThemePreference = 'system' | 'light' | 'dark';
export type NotificationType = 'reminder' | 'streak_warning' | 'badge_earned' | 'weekly_insight';

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  email: string | null;
  created_at: string;
  subscription_tier: SubscriptionTier;
  display_name: string | null;
  avatar_url: string | null;
  rc_customer_id: string | null;
  reminder_time: string | null;
  theme_preference: ThemePreference;
  onboarding_completed: boolean;
  updated_at: string;
}

export interface ChallengeRow {
  id: string;
  user_id: string;
  library_challenge_id: string | null;
  name: string;
  category: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: ChallengeStatus;
  commitments: CommitmentDefinition[];
  freeze_rule_per_days: number;
  reminder_time: string | null;
  proof_card_theme: string;
  completed_at: string | null;
  abandoned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DayLogRow {
  id: string;
  challenge_id: string;
  user_id: string;
  log_date: string;
  day_number: number;
  status: DayLogStatus;
  commitment_checks: CommitmentCheck[];
  all_complete: boolean;
  freeze_applied: boolean;
  acknowledged_miss: boolean;
  created_at: string;
  updated_at: string;
}

export interface StreakSnapshotRow {
  id: string;
  challenge_id: string;
  user_id: string;
  current_streak: number | null;
  longest_streak: number | null;
  total_completed_days: number | null;
  total_frozen_days: number | null;
  total_missed_days: number | null;
  freezes_used_this_week: number | null;
  last_freeze_date: string | null;
  computed_at: string;
}

export interface BadgeRow {
  id: string;
  user_id: string;
  badge_slug: string;
  challenge_id: string | null;
  earned_at: string;
  is_featured: boolean;
}

export interface ProofCardRow {
  id: string;
  challenge_id: string;
  user_id: string;
  theme: string;
  stats_snapshot: ProofCardStatsSnapshot;
  badge_slug: string | null;
  share_count: number;
  created_at: string;
}

export interface NotificationPreferenceRow {
  id: string;
  user_id: string;
  challenge_id: string | null;
  notification_type: NotificationType;
  enabled: boolean;
  reminder_time: string | null;
  updated_at: string;
}

export interface WeeklyInsightRow {
  id: string;
  user_id: string;
  week_start_date: string;
  day_of_week_miss_rates: Record<string, number>;
  rolling_7day_completion_rate: number | null;
  worst_day_of_week: string | null;
  nudge_copy: string | null;
  challenge_breakdown: ChallengeBreakdownItem[] | null;
  computed_at: string;
}

// ─── JSONB Sub-shapes ─────────────────────────────────────────────────────────

export interface CommitmentDefinition {
  id: string;
  label: string;
  icon: string | null;
  required: boolean;
}

export interface CommitmentCheck {
  commitment_id: string;
  checked: boolean;
  checked_at: string | null;
}

export interface ProofCardStatsSnapshot {
  challenge_name: string;
  duration_days: number;
  total_completed_days: number;
  total_frozen_days: number;
  total_missed_days: number;
  longest_streak: number;
  final_streak: number;
  completion_rate: number;
  completed_at: string;
}

export interface ChallengeBreakdownItem {
  challenge_id: string;
  challenge_name: string;
  completion_rate: number | null;
  current_streak: number | null;
  status: ChallengeStatus;
}

// ─── API Payload Types ────────────────────────────────────────────────────────

export interface DayLogUpsertPayload {
  challenge_id: string;
  log_date: string;
  commitment_checks: CommitmentCheck[];
}

export interface CreateChallengePayload {
  name: string;
  category: string;
  duration_days: number;
  start_date: string;
  commitments: CommitmentDefinition[];
  freeze_rule_per_days: number;
  reminder_time: string | null;
  proof_card_theme: string;
  library_challenge_id: string | null;
}

// ─── API Result Types ─────────────────────────────────────────────────────────

export interface DayLogUpsertResult {
  day_log: DayLogRow;
  streak_snapshot: StreakSnapshotRow;
  badge_awarded: BadgeRow | null;
  challenge_completed: boolean;
}

export interface AcknowledgeMissedDayResult {
  day_log: DayLogRow;
  streak_snapshot: StreakSnapshotRow;
  freeze_applied: boolean;
  streak_reset: boolean;
}

export interface CreateChallengeResult {
  challenge: ChallengeRow | null;
  streak_snapshot: StreakSnapshotRow | null;
  paywall_required: boolean;
}

export interface ProofCardResult {
  proof_card: ProofCardRow;
  share_count: number;
}

export interface WeeklyInsightResult {
  insight: WeeklyInsightRow;
  formatted_miss_rate: string;
}

export interface RevenueCatOfferingsResult {
  offerings: PurchasesOfferings;
  customer_info: CustomerInfo;
  is_pro: boolean;
}

export interface ExportUserDataResult {
  export_version: string;
  exported_at: string;
  user: UserRow;
  challenges: ChallengeRow[];
  day_logs: DayLogRow[];
  streak_snapshots: StreakSnapshotRow[];
  badges: BadgeRow[];
  proof_cards: ProofCardRow[];
  notification_preferences: NotificationPreferenceRow[];
  weekly_insights: WeeklyInsightRow[];
}

export interface DeleteAllUserDataResult {
  anonymized: boolean;
  deleted_at: string;
}

// ─── Composed / Screen-Level Types ────────────────────────────────────────────

export interface ActiveChallengeWithStreak extends ChallengeRow {
  streak_snapshots: StreakSnapshotRow[];
  day_logs: DayLogRow[];
}

export interface ChallengeWithSnapshot extends ChallengeRow {
  streak_snapshots: StreakSnapshotRow[];
  badges: BadgeRow[];
}

export interface ChallengeDetail extends ChallengeRow {
  day_logs: DayLogRow[];
  streak_snapshots: StreakSnapshotRow[];
  proof_cards: ProofCardRow[];
}

export interface DisciplineStats {
  total_completed_challenges: number;
  total_completed_days: number;
  total_frozen_days: number;
  total_missed_days: number;
  best_streak_ever: number;
}

export interface JourneyData {
  challenges: ChallengeWithSnapshot[];
  active: ChallengeWithSnapshot[];
  completed: ChallengeWithSnapshot[];
  abandoned: ChallengeWithSnapshot[];
  badges: BadgeRow[];
  discipline_stats: DisciplineStats;
}

// ─── Formatted Display Helpers ────────────────────────────────────────────────

/** Null-safe streak display — DB returns null for unscored rows */
export function formatStreak(value: number | null): string {
  return (value ?? 0).toString();
}

/** Null-safe completion rate display */
export function formatCompletionRate(value: number | null): string {
  return `${((value ?? 0) * 100).toFixed(1)}%`;
}

/** Null-safe rolling completion rate */
export function formatRollingRate(value: number | null): string {
  return `${((value ?? 0) * 100).toFixed(1)}%`;
}
