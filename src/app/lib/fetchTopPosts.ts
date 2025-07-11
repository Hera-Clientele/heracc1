import { createClient } from '@supabase/supabase-js';

export interface TopPost {
  video_id: number;
  username: string;
  url: string;
  views: number;
  post_caption: string;
  snapshot_date?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getDateRange(period: 'today' | '3days' | '7days' | 'month' | 'all') {
  const now = new Date();
  let from: Date | null = null;
  if (period === 'today') {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
  return from ? from.toISOString() : null;
}

export async function fetchTopPosts(period: 'today' | '3days' | '7days' | 'month' | 'all' = 'all'): Promise<TopPost[]> {
  let query = supabase
    .from('latest_snapshots')
    .select('video_id,username,url,views,post_caption,snapshot_date')
    .order('views', { ascending: false })
    .limit(10);

  if (period !== 'all') {
    const from = getDateRange(period);
    if (from) {
      query = query.gte('snapshot_date', from);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
} 