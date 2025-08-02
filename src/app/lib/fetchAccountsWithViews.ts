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

export async function fetchAccountsWithViews(platform?: 'tiktok' | 'instagram'): Promise<AccountWithViews[]> {
  let query = supabase
    .from('accounts')
    .select('*')
    .order('views_count_total', { ascending: false });

  // Filter by platform if specified
  if (platform) {
    query = query.eq('platform', platform);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  // Transform the data to match the expected interface
  return (data || []).map(account => ({
    username: account.username,
    profile_url: account.profile_url || '',
    highest_view_post: account.views_count_total || 0,
    post_count: account.media_count || 0,
    average_views: account.media_count && account.views_count_total 
      ? Math.floor(account.views_count_total / account.media_count) 
      : 0,
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
  }));
} 