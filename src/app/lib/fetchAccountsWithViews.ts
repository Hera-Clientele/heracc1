import { createClient } from '@supabase/supabase-js';

export interface AccountWithViews {
  username: string;
  profile_url: string;
  highest_view_post: number;
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
  // Aggregate highest view post, post count, and followers by username/profile_url
  const accountMap: Record<string, { username: string; profile_url: string; highest_view_post: number; videoIds: Set<string>; followers: number }> = {};
  for (const row of data || []) {
    if (!row.username || !row.profile_url) continue;
    const key = row.username + '|' + row.profile_url;
    if (!accountMap[key]) {
      accountMap[key] = {
        username: row.username,
        profile_url: row.profile_url,
        highest_view_post: 0,
        videoIds: new Set(),
        followers: 0,
      };
    }
    if (row.views && row.views > accountMap[key].highest_view_post) {
      accountMap[key].highest_view_post = row.views;
    }
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
        highest_view_post: acc.highest_view_post,
        post_count,
        average_views: post_count > 0 ? Math.floor(acc.highest_view_post / post_count) : 0, // You may want to update this logic if needed
        followers: acc.followers,
      };
    })
    .sort((a, b) => b.highest_view_post - a.highest_view_post);
} 