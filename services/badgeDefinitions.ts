export interface BadgeDefinition {
  slug: string;
  name: string;
  emoji: string;
  criteria: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { slug: 'first_day',      name: 'First Step',     emoji: '🔥', criteria: 'Complete your very first day log.' },
  { slug: 'streak_3',       name: 'On a Roll',      emoji: '⚡', criteria: 'Maintain a 3-day streak.' },
  { slug: 'streak_7',       name: 'Week Warrior',   emoji: '🗡️', criteria: 'Maintain a 7-day streak.' },
  { slug: 'streak_14',      name: 'Fortnight Fire', emoji: '💎', criteria: 'Maintain a 14-day streak.' },
  { slug: 'streak_30',      name: 'Month Mastery',  emoji: '👑', criteria: 'Maintain a 30-day streak.' },
  { slug: 'challenge_done', name: 'Finisher',       emoji: '🏁', criteria: 'Complete a full challenge from start to finish.' },
  { slug: 'no_freeze',      name: 'Iron Will',      emoji: '🧊', criteria: 'Complete a challenge without using any freeze.' },
  { slug: 'perfect_week',   name: 'Perfect Week',   emoji: '✨', criteria: 'Log all 7 days complete in a single week.' },
  { slug: 'five_challenges', name: 'Veteran',       emoji: '🎖️', criteria: 'Complete five different challenges.' },
  { slug: 'early_bird',     name: 'Early Bird',     emoji: '🌅', criteria: 'Log before 8 AM for 5 days in a row.' },
  { slug: 'comeback',       name: 'Comeback Kid',   emoji: '🔄', criteria: 'Log the day after an acknowledged miss.' },
  { slug: 'all_in',         name: 'All In',         emoji: '🚀', criteria: 'Check every commitment in a single day.' },
];
