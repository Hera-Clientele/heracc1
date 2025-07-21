import { createClient } from '@supabase/supabase-js';

export interface InstagramRow {
  date: string;
  total_views: number;
  total_likes: number;
  total_comments: number;
  videos_scraped: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function fetchInstagramDailyAgg(): Promise<InstagramRow[]> {
  const { data, error } = await supabase
    .from('v_instagram_totals_by_day')
    .select('*')
    .order('date', { ascending: true });
  if (error) throw error;
  return data || [];
} 