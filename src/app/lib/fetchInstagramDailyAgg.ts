import { createClient } from '@supabase/supabase-js';

export interface InstagramRow {
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

export async function fetchInstagramDailyAgg(): Promise<InstagramRow[]> {
  const { data, error } = await supabase
    .from('v_instagram_filled_daily_agg')
    .select('*')
    .order('date', { ascending: true });
  if (error) throw error;
  
  // Transform the data to match the expected format
  return (data || []).map(row => ({
    day: row.date,
    posts: row.total_posts || 0,
    accounts: row.unique_accounts || 0,
    views: row.total_views || 0,
    likes: row.total_views || 0, // Using views as likes for now
    comments: 0, // You can add this field to the view if needed
    shares: 0, // You can add this field to the view if needed
    engagement_rate: 0 // You can calculate this if needed
  }));
} 