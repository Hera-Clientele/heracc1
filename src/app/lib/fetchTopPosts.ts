import { createClient } from '@supabase/supabase-js';

export interface TopPost {
  video_id: number;
  username: string;
  url: string;
  views: number;
  post_caption: string;
  snapshot_date?: string;
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
  const estYear = estDate.getFullYear();
  const estMonth = estDate.getMonth();
  const estDay = estDate.getDate();
  
  let from: Date | null = null;
  let to: Date | null = null;
  
  if (period === 'today') {
    // Today in EST
    from = new Date(Date.UTC(estYear, estMonth, estDay));
    to = new Date(Date.UTC(estYear, estMonth, estDay + 1));
  } else if (period === 'yesterday') {
    // Yesterday in EST
    from = new Date(Date.UTC(estYear, estMonth, estDay - 1));
    to = new Date(Date.UTC(estYear, estMonth, estDay));
  } else if (period === '3days') {
    from = new Date(Date.UTC(estYear, estMonth, estDay - 2));
    to = new Date(Date.UTC(estYear, estMonth, estDay + 1));
  } else if (period === '7days') {
    from = new Date(Date.UTC(estYear, estMonth, estDay - 6));
    to = new Date(Date.UTC(estYear, estMonth, estDay + 1));
  } else if (period === 'month') {
    from = new Date(Date.UTC(estYear, estMonth, 1));
    to = new Date(Date.UTC(estYear, estMonth + 1, 1));
  }
  return { from: from ? from.toISOString() : null, to: to ? to.toISOString() : null };
}

export async function fetchTopPosts(period: 'today' | 'yesterday' | '3days' | '7days' | 'month' | 'all' = 'all', clientId?: string): Promise<TopPost[]> {
  const { from, to } = getDateRange(period);

  // Use direct query instead of RPC function for debugging
  let query = supabase
    .from('latest_snapshots')
    .select('video_id, username, url, views, post_caption, snapshot_date, created_at, client_id')
    .order('views', { ascending: false })
    .limit(10);

  // First, let's test without any filters to see if we can get any data
  console.log('Testing query without filters first...');
  const { data: allData, error: allError } = await supabase
    .from('latest_snapshots')
    .select('video_id, username, client_id')
    .limit(5);
  
  console.log('All data test:', { count: allData?.length || 0, error: allError, sample: allData?.[0] });

  // Filter by client_id
  if (clientId) {
    query = query.eq('client_id', parseInt(clientId, 10));
  }

  // Filter by date range if specified
  if (period !== 'all' && from && to) {
    query = query.gte('created_at', from).lt('created_at', to);
  }

  console.log('fetchTopPosts query params:', { period, clientId, from, to }); // Debug log

  const { data, error } = await query;

  if (error) {
    console.error('fetchTopPosts error:', error);
    throw error;
  }
  
  console.log('fetchTopPosts result:', data?.length || 0, 'posts found'); // Debug log
  console.log('fetchTopPosts first post:', data?.[0]); // Debug log
  
  return data || [];
} 