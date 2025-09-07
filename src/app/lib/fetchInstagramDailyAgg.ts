import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

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

export async function fetchInstagramDailyAgg(clientId: string, startDate?: string, endDate?: string): Promise<Row[]> {
  console.log('fetchInstagramDailyAgg called with clientId:', clientId, 'startDate:', startDate, 'endDate:', endDate);
  
  const startTime = Date.now();
  
  try {
    console.log('fetchInstagramDailyAgg: Creating Supabase query...');
    
    let query = supabase
      .from('mv_instagram_daily_totals')
      .select('*')
      .eq('client_id', parseInt(clientId, 10))
      .order('day', { ascending: true });

    // Add date filtering if provided
    if (startDate) {
      query = query.gte('day', startDate);
    }
    if (endDate) {
      query = query.lte('day', endDate);
    }

    const { data, error } = await query;
      
    if (error) {
      console.error('fetchInstagramDailyAgg error:', error);
      throw error;
    }
    
    console.log('fetchInstagramDailyAgg raw result:', data);
    console.log('fetchInstagramDailyAgg result:', { count: data?.length || 0, sample: data?.[0] });
    
    // Map the data to match the expected interface (same as TikTok)
    const mappedData = (data || []).map(row => ({
      day: row.day,
      posts: row.total_posts_posted || 0,
      accounts: 0, // This might need to be calculated differently
      views: row.total_views || 0,
      likes: row.total_likes || 0,
      comments: row.total_comments || 0,
      shares: 0, // Instagram doesn't have shares in this view
      engagement_rate: 0 // This will be calculated by the component
    }));
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`fetchInstagramDailyAgg completed in ${duration}ms`);
    console.log('fetchInstagramDailyAgg mapped data:', { count: mappedData.length, sample: mappedData[0] });
    return mappedData;
  } catch (error) {
    console.error('fetchInstagramDailyAgg function error:', error);
    throw error;
  }
} 