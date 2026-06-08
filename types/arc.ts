import { User } from './index';

export type ChallengeStatus = 'active' | 'completed' | 'abandoned' | 'paused';
export type DayLogStatus = 'complete' | 'partial' | 'missed' | 'frozen' | 'pending';
export type ChallengeCategory = 'fitness' | 'mindset' | 'nutrition' | 'learning' | 'custom';

export interface Challenge {
  id: string;
  user_id: string;
  library_challenge_id: string | null;
  name: string;
  category: ChallengeCategory;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: ChallengeStatus;
  commitments: Commitment[];
  freeze_rule_per_days: number;
  reminder_time: string | null;
  proof_card_theme: string | null;
  completed_at: string | null;
  abandoned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Commitment {
  id: string;
  label: string;
  order: number;
}

export interface DayLog {
  id: string;
  challenge_id: string;
  user_id: string;
  log_date: string;
  day_number: number;
  status: DayLogStatus;
  commitment_checks: Record<string, boolean>;
  all_complete: boolean;
  freeze_applied: boolean;
  acknowledged_miss: boolean;
  created_at: string;
  updated_at: string;
}

export interface StreakSnapshot {
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

export interface Badge {
  id: string;
  user_id: string;
  badge_slug: string;
  challenge_id: string | null;
  earned_at: string;
  is_featured: boolean;
}

export interface ProofCard {
  id: string;
  challenge_id: string;
  user_id: string;
  theme: string;
  stats_snapshot: ProofCardStats;
  badge_slug: string;
  share_count: number;
  created_at: string;
}

export interface ProofCardStats {
  challenge_name: string;
  duration_days: number;
  completed_days: number;
  longest_streak: number;
  completion_rate: number;
  start_date: string;
  end_date: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  challenge_id: string | null;
  notification_type: string;
  enabled: boolean;
  reminder_time: string;
  updated_at: string;
}

export interface WeeklyInsight {
  id: string;
  user_id: string;
  week_start_date: string;
  day_of_week_miss_rates: Record<string, number>;
  rolling_7day_completion_rate: number;
  worst_day_of_week: string | null;
  nudge_copy: string | null;
  challenge_breakdown: Record<string, unknown>;
  computed_at: string;
}

export interface LibraryChallenge {
  id: string;
  name: string;
  category: ChallengeCategory;
  duration_days: number;
  commitments: Commitment[];
  description: string;
  is_pro: boolean;
}
