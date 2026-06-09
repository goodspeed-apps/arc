-- 002_app_schema.sql — app-specific domain tables.
-- Generated deterministically by DevAgent from architecture.dataModels.
-- Do NOT recreate tables from 001_base_schema.sql.

-- User (users)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  created_at timestamptz default now() not null,
  subscription_tier text not null,
  display_name text,
  avatar_url text,
  rc_customer_id text,
  reminder_time time,
  theme_preference text not null,
  onboarding_completed boolean not null,
  updated_at timestamptz default now() not null
);
alter table public.users enable row level security;
drop policy if exists "users_select_self" on public.users;
create policy "users_select_self" on public.users for select using (auth.uid() = id);
drop policy if exists "users_update_self" on public.users;
create policy "users_update_self" on public.users for update using (auth.uid() = id);

-- Challenge (challenges)
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  library_challenge_id text,
  name text not null,
  category text not null,
  duration_days integer not null,
  start_date date not null,
  end_date date not null,
  status text not null,
  commitments jsonb not null,
  freeze_rule_per_days integer not null,
  reminder_time time,
  proof_card_theme text not null,
  completed_at timestamptz,
  abandoned_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index if not exists challenges_user_id_idx on public.challenges(user_id);
alter table public.challenges enable row level security;
drop policy if exists "challenges_select_own" on public.challenges;
create policy "challenges_select_own" on public.challenges for select using (auth.uid() = user_id);
drop policy if exists "challenges_insert_own" on public.challenges;
create policy "challenges_insert_own" on public.challenges for insert with check (auth.uid() = user_id);
drop policy if exists "challenges_update_own" on public.challenges;
create policy "challenges_update_own" on public.challenges for update using (auth.uid() = user_id);
drop policy if exists "challenges_delete_own" on public.challenges;
create policy "challenges_delete_own" on public.challenges for delete using (auth.uid() = user_id);

-- DayLog (day_logs)
create table if not exists public.day_logs (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null,
  user_id uuid not null,
  log_date date not null,
  day_number integer not null,
  status text not null,
  commitment_checks jsonb not null,
  all_complete boolean not null,
  freeze_applied boolean not null,
  acknowledged_miss boolean not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index if not exists day_logs_user_id_idx on public.day_logs(user_id);
alter table public.day_logs enable row level security;
drop policy if exists "day_logs_select_own" on public.day_logs;
create policy "day_logs_select_own" on public.day_logs for select using (auth.uid() = user_id);
drop policy if exists "day_logs_insert_own" on public.day_logs;
create policy "day_logs_insert_own" on public.day_logs for insert with check (auth.uid() = user_id);
drop policy if exists "day_logs_update_own" on public.day_logs;
create policy "day_logs_update_own" on public.day_logs for update using (auth.uid() = user_id);
drop policy if exists "day_logs_delete_own" on public.day_logs;
create policy "day_logs_delete_own" on public.day_logs for delete using (auth.uid() = user_id);

-- StreakSnapshot (streak_snapshots)
create table if not exists public.streak_snapshots (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null,
  user_id uuid not null,
  current_streak integer not null,
  longest_streak integer not null,
  total_completed_days integer not null,
  total_frozen_days integer not null,
  total_missed_days integer not null,
  freezes_used_this_week integer not null,
  last_freeze_date date,
  computed_at timestamptz not null
);
create index if not exists streak_snapshots_user_id_idx on public.streak_snapshots(user_id);
alter table public.streak_snapshots enable row level security;
drop policy if exists "streak_snapshots_select_own" on public.streak_snapshots;
create policy "streak_snapshots_select_own" on public.streak_snapshots for select using (auth.uid() = user_id);
drop policy if exists "streak_snapshots_insert_own" on public.streak_snapshots;
create policy "streak_snapshots_insert_own" on public.streak_snapshots for insert with check (auth.uid() = user_id);
drop policy if exists "streak_snapshots_update_own" on public.streak_snapshots;
create policy "streak_snapshots_update_own" on public.streak_snapshots for update using (auth.uid() = user_id);
drop policy if exists "streak_snapshots_delete_own" on public.streak_snapshots;
create policy "streak_snapshots_delete_own" on public.streak_snapshots for delete using (auth.uid() = user_id);

-- Badge (badges)
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  badge_slug text not null,
  challenge_id uuid,
  earned_at timestamptz not null,
  is_featured boolean not null
);
create index if not exists badges_user_id_idx on public.badges(user_id);
alter table public.badges enable row level security;
drop policy if exists "badges_select_own" on public.badges;
create policy "badges_select_own" on public.badges for select using (auth.uid() = user_id);
drop policy if exists "badges_insert_own" on public.badges;
create policy "badges_insert_own" on public.badges for insert with check (auth.uid() = user_id);
drop policy if exists "badges_update_own" on public.badges;
create policy "badges_update_own" on public.badges for update using (auth.uid() = user_id);
drop policy if exists "badges_delete_own" on public.badges;
create policy "badges_delete_own" on public.badges for delete using (auth.uid() = user_id);

-- ProofCard (proof_cards)
create table if not exists public.proof_cards (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null,
  user_id uuid not null,
  theme text not null,
  stats_snapshot jsonb not null,
  badge_slug text,
  share_count integer not null,
  created_at timestamptz default now() not null
);
create index if not exists proof_cards_user_id_idx on public.proof_cards(user_id);
alter table public.proof_cards enable row level security;
drop policy if exists "proof_cards_select_own" on public.proof_cards;
create policy "proof_cards_select_own" on public.proof_cards for select using (auth.uid() = user_id);
drop policy if exists "proof_cards_insert_own" on public.proof_cards;
create policy "proof_cards_insert_own" on public.proof_cards for insert with check (auth.uid() = user_id);
drop policy if exists "proof_cards_update_own" on public.proof_cards;
create policy "proof_cards_update_own" on public.proof_cards for update using (auth.uid() = user_id);
drop policy if exists "proof_cards_delete_own" on public.proof_cards;
create policy "proof_cards_delete_own" on public.proof_cards for delete using (auth.uid() = user_id);

-- NotificationPreference (notification_preferences)
create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  challenge_id uuid,
  notification_type text not null,
  enabled boolean not null,
  reminder_time time,
  updated_at timestamptz default now() not null
);
create index if not exists notification_preferences_user_id_idx on public.notification_preferences(user_id);
alter table public.notification_preferences enable row level security;
drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own" on public.notification_preferences for select using (auth.uid() = user_id);
drop policy if exists "notification_preferences_insert_own" on public.notification_preferences;
create policy "notification_preferences_insert_own" on public.notification_preferences for insert with check (auth.uid() = user_id);
drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own" on public.notification_preferences for update using (auth.uid() = user_id);
drop policy if exists "notification_preferences_delete_own" on public.notification_preferences;
create policy "notification_preferences_delete_own" on public.notification_preferences for delete using (auth.uid() = user_id);

-- WeeklyInsight (weekly_insights)
create table if not exists public.weekly_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  week_start_date date not null,
  day_of_week_miss_rates jsonb not null,
  rolling_7day_completion_rate numeric not null,
  worst_day_of_week text,
  nudge_copy text,
  challenge_breakdown jsonb,
  computed_at timestamptz not null
);
create index if not exists weekly_insights_user_id_idx on public.weekly_insights(user_id);
alter table public.weekly_insights enable row level security;
drop policy if exists "weekly_insights_select_own" on public.weekly_insights;
create policy "weekly_insights_select_own" on public.weekly_insights for select using (auth.uid() = user_id);
drop policy if exists "weekly_insights_insert_own" on public.weekly_insights;
create policy "weekly_insights_insert_own" on public.weekly_insights for insert with check (auth.uid() = user_id);
drop policy if exists "weekly_insights_update_own" on public.weekly_insights;
create policy "weekly_insights_update_own" on public.weekly_insights for update using (auth.uid() = user_id);
drop policy if exists "weekly_insights_delete_own" on public.weekly_insights;
create policy "weekly_insights_delete_own" on public.weekly_insights for delete using (auth.uid() = user_id);

-- Foreign keys (PostgREST embedded joins depend on these).
do $$ begin
  alter table public.day_logs add constraint day_logs_challenge_id_fkey foreign key (challenge_id) references public.challenges(id) on delete cascade;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.streak_snapshots add constraint streak_snapshots_challenge_id_fkey foreign key (challenge_id) references public.challenges(id) on delete cascade;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.badges add constraint badges_challenge_id_fkey foreign key (challenge_id) references public.challenges(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.proof_cards add constraint proof_cards_challenge_id_fkey foreign key (challenge_id) references public.challenges(id) on delete cascade;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.notification_preferences add constraint notification_preferences_challenge_id_fkey foreign key (challenge_id) references public.challenges(id) on delete set null;
exception when duplicate_object then null; end $$;
