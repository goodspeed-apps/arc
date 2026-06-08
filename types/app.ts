import type { PurchasesOfferings, CustomerInfo, PurchasesOffering } from 'react-native-purchases';

// ─── Enums / Literal Unions ───────────────────────────────────────────────────

export type ChallengeStatus = 'active' | 'completed' | 'abandoned';
export type DayLogStatus = 'pending' | 'complete' | 'frozen' | 'missed';
export type SubscriptionTier = 'free' | 'pro';
export type ThemePreference = 'system' | 'light' | 'dark';
export type NotificationType = 'daily_reminder' | 'streak_alert' | 'weekly_insight' | 'badge_earned';

// ─── Row Types (mirror Supabase columns exactly) ──────────────────────────────

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
  current_streak: number;
  longest_streak: number;
  total_completed_days: number;
  total_frozen_days: number;
  total_missed_days: number;
  freezes_used_this_week: number;
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
  challenge_breakdown: ChallengeBreakdownEntry[] | null;
  computed_at: string;
}

// ─── Re-exported convenience aliases ─────────────────────────────────────────

export type ArcUser = UserRow;
export type Challenge = ChallengeRow;
export type DayLog = DayLogRow;
export type StreakSnapshot = StreakSnapshotRow;
export type Badge = BadgeRow;
export type ProofCard = ProofCardRow;
export type NotificationPreference = NotificationPreferenceRow;
export type WeeklyInsight = WeeklyInsightRow;

// ─── Embedded JSONB shapes ────────────────────────────────────────────────────

export interface CommitmentDefinition {
  id: string;
  label: string;
  description: string | null;
  sort_order: number;
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
  longest_streak: number;
  total_frozen_days: number;
  total_missed_days: number;
  completion_rate: number;
  completed_at: string;
}

export interface ChallengeBreakdownEntry {
  challenge_id: string;
  challenge_name: string;
  completion_rate: number | null;
  missed_days: number;
}

// ─── Joined / Aggregate types (for query results) ─────────────────────────────

export interface ChallengeWithSnapshot extends ChallengeRow {
  streak_snapshots: StreakSnapshotRow[] | null;
  badges: BadgeRow[] | null;
}

export interface ActiveChallengeWithStreak extends ChallengeRow {
  streak_snapshots: StreakSnapshotRow[] | null;
  day_logs: DayLogRow[] | null;
}

export interface ChallengeDetail extends ChallengeRow {
  day_logs: DayLogRow[] | null;
  streak_snapshots: StreakSnapshotRow[] | null;
  proof_cards: ProofCardRow[] | null;
}

export interface JourneyData {
  challenges: ChallengeWithSnapshot[];
  active: ChallengeWithSnapshot[];
  completed: ChallengeWithSnapshot[];
  abandoned: ChallengeWithSnapshot[];
  total_discipline_days: number;
  total_challenges_completed: number;
}

// ─── Edge function payloads ───────────────────────────────────────────────────

export interface DayLogUpsertPayload {
  challenge_id: string;
  log_date: string;
  commitment_checks: CommitmentCheck[];
}

export interface DayLogUpsertResult {
  day_log: DayLogRow;
  streak_snapshot: StreakSnapshotRow;
  badges_awarded: BadgeRow[];
  challenge_completed: boolean;
}

export interface AcknowledgeMissedDayResult {
  day_log: DayLogRow;
  streak_snapshot: StreakSnapshotRow;
  freeze_applied: boolean;
  streak_reset: boolean;
}

export interface CreateChallengePayload {
  name: string;
  category: string;
  duration_days: number;
  start_date: string;
  commitments: Omit<CommitmentDefinition, 'id'>[];
  freeze_rule_per_days: number;
  reminder_time: string | null;
  proof_card_theme: string;
  library_challenge_id: string | null;
}

export interface CreateChallengeResult {
  challenge: ChallengeRow;
  streak_snapshot: StreakSnapshotRow;
  first_day_log: DayLogRow;
  paywall_required: boolean;
}

export interface ProofCardResult {
  proof_card: ProofCardRow;
  is_new: boolean;
}

export interface RevenueCatOfferingsResult {
  offerings: Record<string, PurchasesOffering>;
  current_offering: PurchasesOffering | null;
  is_pro_active: boolean;
  customer_info: CustomerInfo;
}

export interface ExportUserDataResult {
  user: UserRow;
  challenges: ChallengeRow[];
  day_logs: DayLogRow[];
  streak_snapshots: StreakSnapshotRow[];
  badges: BadgeRow[];
  proof_cards: ProofCardRow[];
  notification_preferences: NotificationPreferenceRow[];
  weekly_insights: WeeklyInsightRow[];
  exported_at: string;
}

export interface DeleteAllUserDataResult {
  anonymized: boolean;
  deleted_records: Record<string, number>;
  completed_at: string;
}

// ─── UI / Navigation state types ─────────────────────────────────────────────

export interface MissedDayModalState {
  visible: boolean;
  challenge_id: string | null;
  missed_date: string | null;
  freeze_available: boolean;
}

export interface PaywallTriggerContext {
  trigger: 'challenge_limit' | 'weekly_insight' | 'proof_card_theme' | 'manual';
  source_screen: string;
}

export interface BadgeSlugDefinition {
  slug: string;
  label: string;
  description: string;
  icon_name: string;
  is_secret: boolean;
}

export type BadgeSlug =
  | 'first_complete'
  | 'streak_7'
  | 'streak_30'
  | 'streak_66'
  | 'streak_100'
  | 'perfect_week'
  | 'comeback_kid'
  | 'arc_lifer'
  | 'triple_threat'
  | 'iron_discipline';
