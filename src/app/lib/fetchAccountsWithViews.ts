import { createClient } from '@supabase/supabase-js';

export interface AccountWithViews {
  username: string;
  profile_url: string;
  total_views: number;
  post_count: number;
  average_views: number;
  followers: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function fetchAccountsWithViews(): Promise<AccountWithViews[]> {
  const { data, error } = await supabase
    .from('latest_snapshots')
    .select('username, profile_url, views, video_id, followers')
    .order('username', { ascending: true });
  if (error) throw error;
  // Aggregate views, post count, and followers by username/profile_url
  const accountMap: Record<string, { username: string; profile_url: string; total_views: number; videoIds: Set<string>; followers: number }> = {};
  for (const row of data || []) {
    if (!row.username || !row.profile_url) continue;
    const key = row.username + '|' + row.profile_url;
    if (!accountMap[key]) {
      accountMap[key] = {
        username: row.username,
        profile_url: row.profile_url,
        total_views: 0,
        videoIds: new Set(),
        followers: 0,
      };
    }
    accountMap[key].total_views += row.views || 0;
    if (row.video_id) accountMap[key].videoIds.add(row.video_id.toString());
    if (row.followers && row.followers > accountMap[key].followers) {
      accountMap[key].followers = row.followers;
    }
  }
  return Object.values(accountMap)
    .map(acc => {
      const post_count = acc.videoIds.size;
      return {
        username: acc.username,
        profile_url: acc.profile_url,
        total_views: acc.total_views,
        post_count,
        average_views: post_count > 0 ? Math.floor(acc.total_views / post_count) : 0,
        followers: acc.followers,
      };
    })
    .sort((a, b) => b.total_views - a.total_views);
} 