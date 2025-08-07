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
      .from('mv_tiktok_daily_totals')
      .select('*')
      .eq('client_id', parseInt(clientId, 10))
      .order('day', { ascending: true });
    
  if (error) {
    console.error('fetchDailyAgg error:', error);
    throw error;
  }
  
  console.log('fetchDailyAgg raw result:', { count: data?.length || 0, sample: data?.[0] });
  
  // Check if we have any data
  if (!data || data.length === 0) {
    console.log('fetchDailyAgg: No data found for clientId:', clientId);
    return [];
  }
  
  // Map the data to match the expected interface
  const mappedData = (data || []).map(row => {
    console.log('fetchDailyAgg mapping row:', row);
    return {
      day: row.day,
      posts: row.total_posts_posted || 0,
      accounts: 0, // This might need to be calculated differently
      views: row.total_views || 0,
      likes: row.total_likes || 0,
      comments: row.total_comments || 0,
      shares: row.total_shares || 0,
      engagement_rate: 0 // This will be calculated by the component
    };
  });
  
  console.log('fetchDailyAgg mapped data:', { count: mappedData.length, sample: mappedData[0] });
  return mappedData;
} 