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
  const now = new Date();
  let from: Date | null = null;
  let to: Date | null = null;
  
  if (period === 'today') {
    // Today in EST
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (period === 'yesterday') {
    // Yesterday in EST
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === '3days') {
    from = new Date(now);
    from.setDate(now.getDate() - 2);
    from.setHours(0, 0, 0, 0);
  } else if (period === '7days') {
    from = new Date(now);
    from.setDate(now.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { from: from ? from.toISOString() : null, to: to ? to.toISOString() : null };
}

export async function fetchTopPosts(period: 'today' | 'yesterday' | '3days' | '7days' | 'month' | 'all' = 'all'): Promise<TopPost[]> {
  const { from, to } = getDateRange(period);

  let params: any = { period_start: from, limit_count: 10 };
  if (to) params.period_end = to;

  // For 'all', just use a very early start date
  if (period === 'all') {
    params.period_start = '1970-01-01T00:00:00Z';
    params.period_end = null;
  }

  const { data, error } = await supabase.rpc('get_top_posts', params);

  if (error) throw error;
  return data || [];
} 