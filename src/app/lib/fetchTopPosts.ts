import { createClient } from '@supabase/supabase-js';

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
  // Get current date in Eastern Time
  const now = new Date();
  const estDate = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  // Create dates in EST timezone without UTC conversion
  const createESTDate = (year: number, month: number, day: number) => {
    // Create date string in EST format and parse it
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return new Date(`${dateStr}T00:00:00-05:00`); // EST timezone offset
  };
  
  const estYear = estDate.getFullYear();
  const estMonth = estDate.getMonth();
  const estDay = estDate.getDate();
  
  let from: Date | null = null;
  let to: Date | null = null;
  
  if (period === 'today') {
    // Today in EST - from start of today to start of tomorrow
    from = createESTDate(estYear, estMonth, estDay);
    to = createESTDate(estYear, estMonth, estDay + 1);
  } else if (period === 'yesterday') {
    // Yesterday in EST
    from = createESTDate(estYear, estMonth, estDay - 1);
    to = createESTDate(estYear, estMonth, estDay);
  } else if (period === '3days') {
    from = createESTDate(estYear, estMonth, estDay - 2);
    to = createESTDate(estYear, estMonth, estDay + 1);
  } else if (period === '7days') {
    from = createESTDate(estYear, estMonth, estDay - 6);
    to = createESTDate(estYear, estMonth, estDay + 1);
  } else if (period === 'month') {
    from = createESTDate(estYear, estMonth, 1);
    to = createESTDate(estYear, estMonth + 1, 1);
  }
  
  // Debug logging
  console.log('getDateRange debug:', {
    period,
    now: now.toISOString(),
    estDate: estDate.toISOString(),
    estYear,
    estMonth,
    estDay,
    from: from?.toISOString(),
    to: to?.toISOString()
  });
  
  return { from: from ? from.toISOString() : null, to: to ? to.toISOString() : null };
}

export async function fetchTopPosts(period: 'today' | 'yesterday' | '3days' | '7days' | 'month' | 'all' = 'all', clientId?: string): Promise<TopPost[]> {
  const { from, to } = getDateRange(period);

  console.log('fetchTopPosts query params:', { period, clientId, from, to }); // Debug log

  // For "today" period, check if materialized view has current day data
  if (period === 'today') {
    try {
      // Check if materialized view has data for today
      const today = new Date();
      const todayEST = new Date(today.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const todayDate = todayEST.toISOString().split('T')[0];
      
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