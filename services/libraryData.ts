export type Difficulty = 'easy' | 'medium' | 'hard';

export interface LibraryChallenge {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  durationDays: number;
  difficulty: Difficulty;
  commitmentTags: string[];
  commitments: string[];
  completionRate: number;
  participantCount: number;
}

export const CATEGORIES = ['All', 'Discipline', 'Sobriety', 'Fitness', 'Focus', 'Mindset'] as const;

export const LIBRARY_CHALLENGES: LibraryChallenge[] = [
  {
    id: 'no-alcohol-30',
    name: '30-Day No Alcohol',
    category: 'Sobriety',
    tagline: 'Reclaim clarity and energy by going fully dry for a month.',
    description: "Thirty days without alcohol resets your baseline, improves sleep, and proves to yourself you don't need it. Thousands have done it, most say it changed their relationship with drinking permanently.",
    durationDays: 30,
    difficulty: 'medium',
    commitmentTags: ['No alcohol', 'Daily log'],
    commitments: ['Zero alcohol for the day', 'Log how you feel each evening', 'Replace with a non-alcoholic ritual'],
    completionRate: 71,
    participantCount: 8420,
  },
  {
    id: 'cold-shower-21',
    name: '21-Day Cold Showers',
    category: 'Discipline',
    tagline: 'Build resilience one cold shower at a time.',
    description: 'Cold exposure sharpens mental toughness, boosts alertness, and conditions you to embrace discomfort. Starting with 21 days builds the habit without overwhelming your schedule.',
    durationDays: 21,
    difficulty: 'medium',
    commitmentTags: ['Cold shower', 'No warm water'],
    commitments: ['End shower fully cold, minimum 60 seconds', 'No turning the warm tap back on', 'Note your mood after'],
    completionRate: 64,
    participantCount: 5130,
  },
  {
    id: 'no-phone-morning-14',
    name: '14-Day Phone-Free Morning',
    category: 'Focus',
    tagline: 'Own your first hour before the world does.',
    description: "The first thing you consume shapes your mental state for the day. Two weeks of phone-free mornings rewires your default toward intention over reaction.",
    durationDays: 14,
    difficulty: 'easy',
    commitmentTags: ['No phone 1hr', 'Intentional start'],
    commitments: ['No phone for the first 60 minutes after waking', 'Do one intentional morning activity', 'Log the activity before unlocking'],
    completionRate: 83,
    participantCount: 11200,
  },
  {
    id: 'daily-movement-30',
    name: '30-Day Daily Movement',
    category: 'Fitness',
    tagline: 'Move your body every single day, no excuses.',
    description: 'Consistency beats intensity. A minimum 20-minute movement session daily builds the identity of someone who moves, regardless of mood, weather, or schedule.',
    durationDays: 30,
    difficulty: 'easy',
    commitmentTags: ['20min movement', 'Any form counts'],
    commitments: ['At least 20 minutes of intentional movement', 'Log the type and duration', 'No rest days, walks count'],
    completionRate: 78,
    participantCount: 14600,
  },
  {
    id: 'no-social-7',
    name: '7-Day Social Media Detox',
    category: 'Focus',
    tagline: 'A week off the feed to reconnect with reality.',
    description: "Seven days away from social media is enough to notice how much mental bandwidth it consumes. Most people extend voluntarily after feeling the difference.",
    durationDays: 7,
    difficulty: 'medium',
    commitmentTags: ['No social apps', 'Screen time log'],
    commitments: ['Zero social media, delete apps if needed', 'Log what you did with recovered time', 'Replace one session with a real conversation'],
    completionRate: 69,
    participantCount: 9870,
  },
  {
    id: 'meditation-30',
    name: '30-Day Daily Meditation',
    category: 'Mindset',
    tagline: 'Ten minutes of stillness, every day, for a month.',
    description: 'A daily meditation practice is one of the highest-ROI habits. Even 10 minutes compounded over 30 days creates measurable shifts in stress, focus, and emotional regulation.',
    durationDays: 30,
    difficulty: 'easy',
    commitmentTags: ['10min meditation', 'Logged'],
    commitments: ['Minimum 10 minutes of guided or silent meditation', 'Same time each day preferred', 'Log duration and quality'],
    completionRate: 76,
    participantCount: 12300,
  },
  {
    id: 'no-junk-21',
    name: '21-Day Clean Eating',
    category: 'Discipline',
    tagline: 'Cut the junk and feel the difference in three weeks.',
    description: 'No processed food, added sugars, or fast food for 21 days. The first week is the hardest, after that your body stops craving what it no longer gets.',
    durationDays: 21,
    difficulty: 'hard',
    commitmentTags: ['No processed food', 'Meal log'],
    commitments: ['No junk food, fast food, or added sugar', 'Prepare or log every meal', 'Drink at least 2L of water'],
    completionRate: 58,
    participantCount: 6750,
  },
  {
    id: 'journaling-30',
    name: '30-Day Evening Journal',
    category: 'Mindset',
    tagline: 'Five minutes of reflection to close every day with intention.',
    description: "Journaling externalises your inner world, surfaces patterns, and keeps you accountable to your own growth. Five minutes before bed is the minimum effective dose.",
    durationDays: 30,
    difficulty: 'easy',
    commitmentTags: ['Evening journal', '5min min'],
    commitments: ['Write at least 5 minutes before sleep', 'Reflect on one win and one lesson', 'No phone after journaling'],
    completionRate: 81,
    participantCount: 10400,
  },
  {
    id: 'no-alcohol-90',
    name: '90-Day Sobriety',
    category: 'Sobriety',
    tagline: 'The full reset, 90 days to transform your relationship with alcohol.',
    description: '90 days is where the real transformation happens. Your brain chemistry rebalances, sleep deepens, and you build undeniable proof of your own discipline.',
    durationDays: 90,
    difficulty: 'hard',
    commitmentTags: ['No alcohol', 'Weekly check-in'],
    commitments: ['Zero alcohol every day', 'Weekly written reflection on changes noticed', 'Log cravings without acting on them'],
    completionRate: 49,
    participantCount: 3200,
  },
  {
    id: 'reading-14',
    name: '14-Day Daily Reading',
    category: 'Focus',
    tagline: 'Twenty pages a day. Two weeks of consistent growth.',
    description: 'Reading 20 pages daily keeps your mind sharp, builds knowledge, and offers a dopamine-clean wind-down alternative. Two weeks is enough to finish most non-fiction books.',
    durationDays: 14,
    difficulty: 'easy',
    commitmentTags: ['20 pages', 'Physical book'],
    commitments: ['Read at least 20 pages', 'Physical or e-ink only, no apps', 'Note one idea that landed'],
    completionRate: 85,
    participantCount: 7800,
  },
];
