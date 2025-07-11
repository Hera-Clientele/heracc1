import { createClient } from '@supabase/supabase-js';

export interface AccountWithViews {
  username: string;
  profile_url: string;
  total_views: number;
  post_count: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function fetchAccountsWithViews(): Promise<AccountWithViews[]> {
  const { data, error } = await supabase
    .from('latest_snapshots')
    .select('username, profile_url, views, video_id')
    .order('username', { ascending: true });
  if (error) throw error;
  // Aggregate views and post count by username/profile_url
  const accountMap: Record<string, { username: string; profile_url: string; total_views: number; videoIds: Set<string> }> = {};
  for (const row of data || []) {
    if (!row.username || !row.profile_url) continue;
    const key = row.username + '|' + row.profile_url;
    if (!accountMap[key]) {
      accountMap[key] = {
        username: row.username,
        profile_url: row.profile_url,
        total_views: 0,
        videoIds: new Set(),
      };
    }
    accountMap[key].total_views += row.views || 0;
    if (row.video_id) accountMap[key].videoIds.add(row.video_id.toString());
  }
  return Object.values(accountMap)
    .map(acc => ({
      username: acc.username,
      profile_url: acc.profile_url,
      total_views: acc.total_views,
      post_count: acc.videoIds.size,
    }))
    .sort((a, b) => b.total_views - a.total_views);
} 