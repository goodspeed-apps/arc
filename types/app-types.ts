export interface Challenge {
  id: string;
  user_id: string;
  name: string;
  category: string;
  duration_days: number;
  status: 'active' | 'completed' | 'abandoned';
  start_date: string | null;
  created_at: string;
}

export interface Badge {
  id: string;
  user_id: string;
  badge_slug: string;
  earned_at: string;
}
