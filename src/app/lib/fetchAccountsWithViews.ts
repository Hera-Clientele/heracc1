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
  try {
    // Try to use the peak performance view first
    const { data: peakData, error: peakError } = await supabase
      .from('v_peak_video_performance')
      .select('*')
      .order('peak_views', { ascending: false });

    if (peakError) {
      console.error('Peak performance view error:', peakError);
      throw new Error('Peak performance view not available');
    }

    if (peakData && peakData.length > 0) {
      // Use peak performance data
      const accountMap: Record<string, { 
        username: string; 
        profile_url: string; 
        highest_view_post: number; 
        videoIds: Set<string>; 
        followers: number;
        total_views: number;
      }> = {};

      for (const row of peakData) {
        if (!row.username || !row.profile_url) continue;
        
        const key = row.username + '|' + row.profile_url;
        
        if (!accountMap[key]) {
          accountMap[key] = {
            username: row.username,
            profile_url: row.profile_url,
            highest_view_post: 0,
            videoIds: new Set(),
            followers: 0,
            total_views: 0,
          };
        }
        
        // Use peak_views (highest view count this video ever achieved)
        if (row.peak_views && row.peak_views > accountMap[key].highest_view_post) {
          accountMap[key].highest_view_post = row.peak_views;
        }
        
        if (row.video_id) accountMap[key].videoIds.add(row.video_id.toString());
        
        // Use the highest follower count for this account
        if (row.followers && row.followers > accountMap[key].followers) {
          accountMap[key].followers = row.followers;
        }
        
        // Sum up total views for average calculation
        if (row.peak_views) {
          accountMap[key].total_views += row.peak_views;
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
            average_views: post_count > 0 ? Math.floor(acc.total_views / post_count) : 0,
            followers: acc.followers,
          };
        })
        .sort((a, b) => b.highest_view_post - a.highest_view_post);
    }
    
    // If no peak data, fall back to original method
    throw new Error('No peak performance data available');
      
  } catch (error) {
    console.error('Error fetching accounts with peak performance:', error);
    
    // Fallback to original method using latest_snapshots
    const { data, error: supabaseError } = await supabase
      .from('latest_snapshots')
      .select('username, profile_url, views, video_id, followers')
      .order('username', { ascending: true });
      
    if (supabaseError) throw supabaseError;
    
    // Original aggregation logic as fallback
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
          average_views: post_count > 0 ? Math.floor(acc.highest_view_post / post_count) : 0,
          followers: acc.followers,
        };
      })
      .sort((a, b) => b.highest_view_post - a.highest_view_post);
  }
} 