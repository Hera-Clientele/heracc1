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

function getDateRange(period: 'today' | '3days' | '7days' | 'month' | 'all') {
  const now = new Date();
  let from: Date | null = null;
  let to: Date | null = null;
  if (period === 'today') {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
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

export async function fetchTopPosts(period: 'today' | '3days' | '7days' | 'month' | 'all' = 'all'): Promise<TopPost[]> {
  const { from, to } = getDateRange(period);

  let query = supabase
    .from('latest_snapshots')
    .select('video_id, username, url, views, post_caption, snapshot_date, created_at')
    .not('views', 'is', null)
    .gt('views', 0)
    .order('views', { ascending: false })
    .limit(10);

  // Apply date filtering using created_at
  if (period !== 'all') {
    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      query = query.lt('created_at', to);
    }
  }

  const { data, error } = await query;

  if (error) throw error;
  
  return (data || []).map(row => ({
    video_id: row.video_id,
    username: row.username || 'Unknown',
    url: row.url || '#',
    views: row.views || 0,
    post_caption: row.post_caption || 'No caption',
    snapshot_date: row.snapshot_date,
    created_at: row.created_at,
  }));
} 