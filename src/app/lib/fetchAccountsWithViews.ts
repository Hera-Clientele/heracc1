import { createClient } from '@supabase/supabase-js';

export interface AccountWithViews {
  username: string;
  profile_url: string;
  highest_view_post: number;
  post_count: number;
  average_views: number;
  followers: number;
  platform: string;
  client_id?: number;
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

export async function fetchAccountsWithViews(platform?: 'tiktok' | 'instagram' | 'facebook' | 'youtube', clientId?: string): Promise<AccountWithViews[]> {
  console.log('fetchAccountsWithViews called with platform:', platform, 'clientId:', clientId);
  
  // Special debugging for YouTube
  if (platform === 'youtube') {
    console.log('YouTube accounts fetch - checking for YouTube accounts in accounts table...');
  }
  
  try {
    // Get account information from accounts table
    console.log('fetchAccountsWithViews: Fetching account info from accounts table...');
    let accountsQuery = supabase
      .from('accounts')
      .select('*')
      .order('followers_count', { ascending: false });

    // Filter by platform if specified
    if (platform) {
      console.log('fetchAccountsWithViews: Filtering by platform:', platform);
      accountsQuery = accountsQuery.eq('platform', platform);
    }

    // Filter by client_id if specified
    if (clientId && clientId !== 'all') {
      console.log('fetchAccountsWithViews: Filtering by clientId:', clientId);
      accountsQuery = accountsQuery.eq('client_id', clientId);
    }

    // Only show active accounts
    console.log('fetchAccountsWithViews: Filtering by account_status: Active');
    accountsQuery = accountsQuery.eq('account_status', 'Active');

    const { data: accountsData, error: accountsError } = await accountsQuery;
    
    if (accountsError) {
      console.error('fetchAccountsWithViews accounts error:', accountsError);
      throw accountsError;
    }
    
    console.log('fetchAccountsWithViews accounts result:', { count: accountsData?.length || 0, sample: accountsData?.[0] });
    
    // Special debugging for YouTube
    if (platform === 'youtube') {
      console.log('YouTube accounts found:', {
        total: accountsData?.length || 0,
        accounts: accountsData?.map(acc => ({ username: acc.username, platform: acc.platform, client_id: acc.client_id })) || []
      });
    }
    
    // Transform the data to match the expected interface - use accounts table data directly
    const transformedData = (accountsData || []).map(account => ({
      username: account.username,
      profile_url: account.profile_url || '',
      // Use account table data directly for all metrics
      views: account.views_count_total || 0,
      highest_view_post: account.views_count_total || 0,
      post_count: account.media_count || 0,
      posts: account.media_count || 0,
      average_views: account.media_count && account.views_count_total 
        ? Math.floor(account.views_count_total / account.media_count) 
        : 0,
      avg_views: account.media_count && account.views_count_total 
        ? Math.floor(account.views_count_total / account.media_count) 
        : 0,
      // Use account info from accounts table for profile details
      followers: account.followers_count || 0,
      platform: account.platform,
      client_id: account.client_id,
      display_name: account.display_name,
      bio: account.bio,
      account_niche: account.account_niche,
      pfp_url: account.pfp_url,
      account_status: account.account_status,
      // Use account table data for engagement data
      views_count_total: account.views_count_total || 0,
      likes_count_total: account.likes_count_total || 0,
      comments_count_total: account.comments_count_total || 0,
      shares_count_total: account.shares_count_total || 0,
      profile_views: account.profile_views || 0,
      reach_count: account.reach_count || 0,
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