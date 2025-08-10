import { createClient } from '@supabase/supabase-js';

export interface AccountWithViews {
  username: string;
  profile_url: string;
  highest_view_post: number;
  post_count: number;
  average_views: number;
  followers: number;
  platform: string;
  display_name?: string;
  bio?: string;
  account_niche?: string;
  pfp_url?: string;
  account_status?: string;
  views_count_total?: number;
  likes_count_total?: number;
  comments_count_total?: number;
  shares_count_total?: number;
  profile_views?: number;
  reach_count?: number;
  last_updated?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function fetchAccountsWithViews(platform?: 'tiktok' | 'instagram', clientId?: string): Promise<AccountWithViews[]> {
  console.log('fetchAccountsWithViews called with platform:', platform, 'clientId:', clientId);
  
  try {
    console.log('fetchAccountsWithViews: Creating Supabase query...');
    let query = supabase
      .from('accounts')
      .select('*')
      .order('views_count_total', { ascending: false });

    // Filter by platform if specified
    if (platform) {
      console.log('fetchAccountsWithViews: Filtering by platform:', platform);
      query = query.eq('platform', platform);
    }

    // Filter by client_id if specified
    if (clientId && clientId !== 'all') {
      console.log('fetchAccountsWithViews: Filtering by clientId:', clientId);
      query = query.eq('client_id', clientId);
    }

    console.log('fetchAccountsWithViews: Executing query...');
    const { data, error } = await query;
    
    if (error) {
      console.error('fetchAccountsWithViews Supabase error:', error);
      throw error;
    }
    
    console.log('fetchAccountsWithViews raw result:', { count: data?.length || 0, sample: data?.[0] });
    
    // Transform the data to match the expected interface
    const transformedData = (data || []).map(account => ({
      username: account.username,
      profile_url: account.profile_url || '',
      // Map views to match component interface
      views: account.views_count_total || 0,
      highest_view_post: account.views_count_total || 0,
      post_count: account.media_count || 0,
      posts: account.media_count || 0, // Add this for component compatibility
      average_views: account.media_count && account.views_count_total 
        ? Math.floor(account.views_count_total / account.media_count) 
        : 0,
      avg_views: account.media_count && account.views_count_total 
        ? Math.floor(account.views_count_total / account.media_count) 
        : 0, // Add this for component compatibility
      followers: account.followers_count || 0,
      platform: account.platform,
      display_name: account.display_name,
      bio: account.bio,
      account_niche: account.account_niche,
      pfp_url: account.pfp_url,
      account_status: account.account_status,
      views_count_total: account.views_count_total,
      likes_count_total: account.likes_count_total,
      comments_count_total: account.comments_count_total,
      shares_count_total: account.shares_count_total,
      profile_views: account.profile_views,
      reach_count: account.reach_count,
      last_updated: account.last_updated,
      // Add likes and comments for component compatibility
      likes: account.likes_count_total || 0,
      comments: account.comments_count_total || 0,
    }));
    
    console.log('fetchAccountsWithViews transformed result:', { count: transformedData.length, sample: transformedData[0] });
    return transformedData;
  } catch (error) {
    console.error('fetchAccountsWithViews function error:', error);
    throw error;
  }
} 