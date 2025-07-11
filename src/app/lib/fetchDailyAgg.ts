import { createClient } from '@supabase/supabase-js';

export interface Row {
  day: string;
  posts: number;
  accounts: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function fetchDailyAgg(): Promise<Row[]> {
  const { data, error } = await supabase
    .from<Row>('daily_agg')
    .select('*')
    .order('day', { ascending: true });
  if (error) throw error;
  return data || [];
} 