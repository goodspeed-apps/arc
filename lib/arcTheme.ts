// Arc-specific design tokens, ember-orange on near-black
export const ARC_COLORS = {
  nearBlack: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  ember: '#E8520A',
  emberDim: '#A03A07',
  bone: '#E8E0D0',
  muted: '#888888',
  mutedDim: '#555555',
  danger: '#C0392B',
  success: '#2ECC71',
  white: '#FFFFFF',
} as const;

export const ARC_FONTS = {
  display: 'JosefinSans_700Bold',
  displayLight: 'JosefinSans_300Light',
  displayRegular: 'JosefinSans_400Regular',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
} as const;

export const ARC_SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const ARC_RADII = {
  none: 0,
  xs: 4,
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  fitness: 'FITNESS',
  mindset: 'MINDSET',
  nutrition: 'NUTRITION',
  productivity: 'PRODUCTIVITY',
  custom: 'CUSTOM',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'STANDARD',
  medium: 'HARD',
  hard: 'ELITE',
  elite: 'EXTREME',
};

export const LIBRARY_CHALLENGES = [
  {
    id: 'lc-75-hard',
    name: '75 HARD',
    category: 'fitness' as const,
    duration_days: 75,
    description: "Two 45-min workouts daily. One outdoor. Diet. No alcohol. No cheat meals. Read 10 pages.",
    commitments: ['Workout 1 (45 min)', 'Workout 2 (45 min, outdoor)', 'Follow diet', 'Read 10 pages', 'Progress photo'],
    difficulty: 'elite' as const,
  },
  {
    id: 'lc-30-day-run',
    name: '30-DAY RUN STREAK',
    category: 'fitness' as const,
    duration_days: 30,
    description: 'Run at least 1 mile every day for 30 days.',
    commitments: ['Run 1+ mile'],
    difficulty: 'medium' as const,
  },
  {
    id: 'lc-no-social',
    name: 'NO SOCIAL MEDIA',
    category: 'mindset' as const,
    duration_days: 30,
    description: 'Zero social media. All platforms.',
    commitments: ['No Instagram', 'No Twitter/X', 'No TikTok', 'No Reddit'],
    difficulty: 'medium' as const,
  },
  {
    id: 'lc-cold-shower',
    name: '30-DAY COLD SHOWERS',
    category: 'mindset' as const,
    duration_days: 30,
    description: 'Cold shower every morning. No warm water.',
    commitments: ['Cold shower (min 3 min)'],
    difficulty: 'easy' as const,
  },
  {
    id: 'lc-clean-eat',
    name: 'CLEAN 21',
    category: 'nutrition' as const,
    duration_days: 21,
    description: '21 days. No processed food. No added sugar. No alcohol.',
    commitments: ['No processed food', 'No added sugar', 'No alcohol'],
    difficulty: 'hard' as const,
  },
];
