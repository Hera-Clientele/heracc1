import { createClient } from '@supabase/supabase-js';
import { getDateRangeForPeriod, getTodayInAppTimezone } from './timezone';

export interface TopPost {
  video_id: number;
  username: string;
  url: string;
  views: number;
  post_caption: string;
  created_at?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getDateRange(period: 'today' | 'yesterday' | '3days' | '7days' | 'month' | 'all') {
  return getDateRangeForPeriod(period);
}

export async function fetchTopPosts(period: 'today' | 'yesterday' | '3days' | '7days' | 'month' | 'all' = 'all', clientId?: string): Promise<TopPost[]> {
  const { from, to } = getDateRange(period);

  console.log('fetchTopPosts query params:', { period, clientId, from, to }); // Debug log

  // For "today" period, check if materialized view has current day data
  if (period === 'today') {
    try {
      // Check if materialized view has data for today
      const todayDate = getTodayInAppTimezone();
      
      const { data: todayCheck, error: todayError } = await supabase
        .from('mv_tiktok_top_posts_enhanced')
        .select('created_at')
        .eq('client_id', parseInt(clientId || '1', 10))
        .eq('period', 'today')
        .gte('created_at', `${todayDate}T00:00:00`)
        .lt('created_at', `${todayDate}T23:59:59`)
        .limit(1);

      // If no data for today in materialized view, use fallback
      if (todayError || !todayCheck || todayCheck.length === 0) {
        console.log('No today data in materialized view, using fallback for today...');
        return fetchTopPostsFallback(period, clientId);
      }
    } catch (error) {
      console.log('Error checking today data, using fallback...', error);
      return fetchTopPostsFallback(period, clientId);
    }
  }

  // Check if enhanced materialized view exists and has data for this period
  try {
    const { data: testData, error: testError } = await supabase
      .from('mv_tiktok_top_posts_enhanced')
      .select('video_id, client_id, period')
      .eq('client_id', parseInt(clientId || '1', 10))
      .eq('period', period)
      .limit(1);

    if (testError) {
      console.log('Enhanced materialized view not available, using fallback...', testError);
      return fetchTopPostsFallback(period, clientId);
    }

    if (!testData || testData.length === 0) {
      console.log('Enhanced materialized view has no data for this period, using fallback...');
      return fetchTopPostsFallback(period, clientId);
    }

    console.log('Enhanced materialized view is available and has data for period:', period);
  } catch (error) {
    console.log('Error checking enhanced materialized view, using fallback...', error);
    return fetchTopPostsFallback(period, clientId);
  }

  // Use enhanced materialized view for pre-computed periods
  let query = supabase
    .from('mv_tiktok_top_posts_enhanced')
    .select('video_id, username, url, views, post_caption, created_at, client_id, rank, period')
    .eq('client_id', parseInt(clientId || '1', 10))
    .eq('period', period)
    .order('rank', { ascending: true })
    .limit(10);

  const { data, error } = await query;

  if (error) {
    console.error('fetchTopPosts enhanced materialized view error:', error);
    // Fallback to original query if materialized view fails
    console.log('Falling back to original latest_snapshots query...');
    return fetchTopPostsFallback(period, clientId);
  }
  
  console.log('fetchTopPosts enhanced materialized view result:', data?.length || 0, 'posts found'); // Debug log
  console.log('fetchTopPosts first post:', data?.[0]); // Debug log
  
  // If materialized view returns no data, try fallback
  if (!data || data.length === 0) {
    console.log('Enhanced materialized view returned no data, trying fallback...');
    return fetchTopPostsFallback(period, clientId);
  }
  
  return data || [];
}

// Fallback function using original query
async function fetchTopPostsFallback(period: 'today' | 'yesterday' | '3days' | '7days' | 'month' | 'all' = 'all', clientId?: string): Promise<TopPost[]> {
  const { from, to } = getDateRange(period);

  console.log('fetchTopPostsFallback query params:', { period, clientId, from, to }); // Debug log

  let query = supabase
    .from('latest_snapshots')
    .select('video_id, username, url, views, post_caption, created_at, client_id')
    .order('views', { ascending: false })
    .limit(10);

  // Filter by client_id
  if (clientId) {
    query = query.eq('client_id', parseInt(clientId, 10));
  }

  // Filter by date range if specified
  if (period !== 'all' && from && to) {
    // Use the ISO string dates directly since they're already in the correct timezone
    query = query.gte('created_at', from).lt('created_at', to);
  }

  const { data, error } = await query;

  if (error) {
    console.error('fetchTopPosts fallback error:', error);
    throw error;
  }
  
  console.log('fetchTopPostsFallback result:', data?.length || 0, 'posts found'); // Debug log
  console.log('fetchTopPostsFallback first post:', data?.[0]); // Debug log
  
  return data || [];
} 