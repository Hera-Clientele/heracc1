import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

export interface FacebookRow {
  day: string;
  video_views: number;
  post_engagements: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function fetchFacebookDailyAgg(clientId: string): Promise<FacebookRow[]> {
  console.log('fetchFacebookDailyAgg called with clientId:', clientId);
  
  const startTime = Date.now();
  
  try {
    console.log('fetchFacebookDailyAgg: Creating Supabase query...');
    
    const { data, error } = await supabase
      .from('fb_daily_agg')
      .select('*')
      .eq('client_id', parseInt(clientId, 10))
      .order('day', { ascending: true });
      
    if (error) {
      console.error('fetchFacebookDailyAgg error:', error);
      throw error;
    }
    
    console.log('fetchFacebookDailyAgg raw result:', data);
    console.log('fetchFacebookDailyAgg result:', { count: data?.length || 0, sample: data?.[0] });
    
    // Map the data to match the expected interface
    const mappedData = (data || []).map(row => ({
      day: row.day,
      video_views: Number(row.video_views) || 0,
      post_engagements: Number(row.post_engagements) || 0,
    }));
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`fetchFacebookDailyAgg completed in ${duration}ms`);
    console.log('fetchFacebookDailyAgg mapped data:', { count: mappedData.length, sample: mappedData[0] });
    return mappedData;
  } catch (error) {
    console.error('fetchFacebookDailyAgg function error:', error);
    throw error;
  }
}
