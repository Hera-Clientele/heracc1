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

export async function fetchDailyAgg(clientId: string): Promise<Row[]> {
  console.log('fetchDailyAgg called with clientId:', clientId);
  
  const { data, error } = await supabase
    .from('tt_daily_agg')
    .select('*')
    .eq('client_id', parseInt(clientId, 10))
    .gte('day', '2025-08-03') // Only fetch data from August 3rd onwards
    .order('day', { ascending: true });
    
  if (error) {
    console.error('fetchDailyAgg error:', error);
    throw error;
  }
  
  console.log('fetchDailyAgg result:', { count: data?.length || 0, sample: data?.[0] });
  
  // Map the data to match the expected interface
  const mappedData = (data || []).map(row => ({
    day: row.day,
    posts: row.total_posts_posted || 0,
    accounts: 0, // This might need to be calculated differently
    views: row.total_views_gained || 0,
    likes: row.total_likes_gained || 0,
    comments: row.total_comments_gained || 0,
    shares: row.total_shares_gained || 0,
    engagement_rate: 0 // This will be calculated by the component
  }));
  
  console.log('fetchDailyAgg mapped data:', { count: mappedData.length, sample: mappedData[0] });
  return mappedData;
} 