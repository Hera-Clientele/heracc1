import { createClient } from '@supabase/supabase-js';

export interface TopPost {
  video_id: number;
  username: string;
  url: string;
  views: number;
  post_caption: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function fetchTopPosts(): Promise<TopPost[]> {
  const { data, error } = await supabase
    .from<TopPost>('latest_snapshots')
    .select('video_id,username,url,views,post_caption')
    .order('views', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data || [];
} 