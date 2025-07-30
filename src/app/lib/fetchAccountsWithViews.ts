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
  // Get all data from latest_snapshots
  const { data, error } = await supabase
    .from('latest_snapshots')
    .select('username, profile_url, views, video_id, followers')
    .order('views', { ascending: false }); // Sort by views descending to get highest first
  
  if (error) throw error;
  
  // Aggregate data by username/profile_url combination
  const accountMap: Record<string, { 
    username: string; 
    profile_url: string; 
    highest_view_post: number; 
    videoIds: Set<string>; 
    followers: number; 
    totalViews: number;
    posts: Array<{views: number, video_id: string}>;
  }> = {};
  
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
        totalViews: 0,
        posts: [],
      };
    }
    
    // Track all posts for this account
    if (row.video_id) {
      accountMap[key].videoIds.add(row.video_id.toString());
      if (row.views) {
        accountMap[key].posts.push({ views: row.views, video_id: row.video_id.toString() });
        accountMap[key].totalViews += row.views;
      }
    }
    
    // Update highest view post if this post has more views
    if (row.views && row.views > accountMap[key].highest_view_post) {
      accountMap[key].highest_view_post = row.views;
    }
    
    // Update followers if this record has more followers
    if (row.followers && row.followers > accountMap[key].followers) {
      accountMap[key].followers = row.followers;
    }
  }
  
  // Convert to final format and sort by highest view post
  return Object.values(accountMap)
    .map(acc => {
      const post_count = acc.videoIds.size;
      return {
        username: acc.username,
        profile_url: acc.profile_url,
        highest_view_post: acc.highest_view_post,
        post_count,
        average_views: post_count > 0 ? Math.floor(acc.totalViews / post_count) : 0,
        followers: acc.followers,
      };
    })
    .sort((a, b) => b.highest_view_post - a.highest_view_post);
} 