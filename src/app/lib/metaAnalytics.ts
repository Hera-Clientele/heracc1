import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface MetaAnalyticsMetric {
  date: string;
  platform: 'instagram' | 'facebook' | 'tiktok';
  account_id?: string; // Changed to string for UUID
  account_name: string;
  views: number;
  reach: number;
  profile_visits: number;
  num_posts?: number; // Make num_posts optional
  client_id: number;
}

export interface DailyTotalsRow {
  day: string;
  platform: string;
  total_views: number;
  total_reach: number;
  total_profile_visits: number;
  total_posts: number; // Add total_posts field
  total_accounts: number;
  active_accounts: number;
  account_usernames?: string; // New field from joined accounts
  // TikTok-specific fields
  total_tt_profile_views?: number;
  total_likes?: number;
  total_shares?: number;
  total_comments?: number;
  total_tt_followers?: number;
  // YouTube-specific fields
  total_yt_subs_gained?: number;
  total_yt_subs_lost?: number;
}

export interface AccountDailyMetric {
  date: string;
  platform: string;
  account_id: string; // Changed to string for UUID
  account_name: string;
  display_name?: string;
  views: number;
  reach: number;
  profile_visits: number;
  client_id: number;
  view_to_reach_ratio: number;
  profile_visit_to_reach_ratio: number;
}

// Account mapping from your Google Sheets to client_id
const ACCOUNT_MAPPING: Record<string, { client_id: number; platform: 'instagram' | 'facebook' }> = {
  'katiele.fit': { client_id: 1, platform: 'instagram' },
  'gymkatie': { client_id: 1, platform: 'instagram' },
  'liftwithkatiee': { client_id: 1, platform: 'instagram' },
  'lovelykatiele': { client_id: 1, platform: 'instagram' },
  'katiele.girl': { client_id: 1, platform: 'instagram' },
  'cutiekatiele': { client_id: 1, platform: 'instagram' },
  'bonitakatex3': { client_id: 1, platform: 'instagram' },
  'katielevida': { client_id: 1, platform: 'instagram' },
  'FunwithKatie': { client_id: 1, platform: 'instagram' },
  // Add Facebook accounts with platform: 'facebook'
};

export async function fetchMetaAnalyticsDailyAgg(clientId: string, platform?: 'instagram' | 'facebook' | 'tiktok' | 'youtube', startDate?: string, endDate?: string, accountUsernames?: string[]): Promise<DailyTotalsRow[]> {
  console.log('fetchMetaAnalyticsDailyAgg called with clientId:', clientId, 'platform:', platform, 'startDate:', startDate, 'endDate:', endDate, 'accountUsernames:', accountUsernames);
  
  
  try {
    // If filtering by specific accounts, use raw meta_analytics table directly
    if (accountUsernames && accountUsernames.length > 0) {
      console.log('Using raw meta_analytics table for account filtering');
      
      let query = supabase
        .from('meta_analytics')
        .select(`
          date,
          platform,
          account_name,
          views,
          reach,
          profile_visits,
          num_posts,
          client_id,
          tt_profile_views,
          likes,
          shares,
          comments,
          tt_followers,
          yt_subs_gained,
          yt_subs_lost
        `)
        .eq('client_id', parseInt(clientId, 10))
        .in('account_name', accountUsernames)
        .order('date', { ascending: true });
      
      if (platform) {
        query = query.eq('platform', platform);
      }
      
      // Add date filtering if provided
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching filtered meta analytics data:', error);
        return [];
      }
      
      // Aggregate the data by date
      const aggregatedData = (data || []).reduce((acc: any, row) => {
        const key = row.date;
        if (!acc[key]) {
          acc[key] = {
            day: row.date,
            platform: row.platform,
            total_views: 0,
            total_reach: 0,
            total_profile_visits: 0,
            total_posts: 0,
            total_accounts: 0,
            active_accounts: 0,
            account_usernames: '',
            // TikTok-specific fields
            total_tt_profile_views: 0,
            total_likes: 0,
            total_shares: 0,
            total_comments: 0,
            total_tt_followers: 0,
            // YouTube-specific fields
            total_yt_subs_gained: 0,
            total_yt_subs_lost: 0,
          };
        }
        acc[key].total_views += row.views || 0;
        acc[key].total_reach += row.reach || 0;
        acc[key].total_profile_visits += row.profile_visits || 0;
        acc[key].total_posts += row.num_posts || 0;
        acc[key].total_accounts += 1;
        acc[key].active_accounts += 1;
        
        // TikTok-specific aggregations
        if (row.platform === 'tiktok') {
          acc[key].total_tt_profile_views += row.tt_profile_views || 0;
          acc[key].total_likes += row.likes || 0;
          acc[key].total_shares += row.shares || 0;
          acc[key].total_comments += row.comments || 0;
          acc[key].total_tt_followers += row.tt_followers || 0;
        }
        
        // YouTube-specific aggregations
        if (row.platform === 'youtube') {
          acc[key].total_yt_subs_gained += row.yt_subs_gained || 0;
          acc[key].total_yt_subs_lost += row.yt_subs_lost || 0;
          acc[key].total_likes += row.likes || 0;
          acc[key].total_shares += row.shares || 0;
          acc[key].total_comments += row.comments || 0;
        }
        
        if (acc[key].account_usernames) {
          acc[key].account_usernames += ', ' + row.account_name;
        } else {
          acc[key].account_usernames = row.account_name;
        }
        return acc;
      }, {});
      
      const result = Object.values(aggregatedData);
      console.log('Filtered meta analytics result:', { count: result.length, sample: result[0] });
      return result as DailyTotalsRow[];
    }
    
    // For YouTube, skip materialized view and go directly to fallback
    if (platform === 'youtube') {
      console.log('Skipping materialized view for YouTube, using fallback query directly');
      // Skip to fallback logic below
    } else {
      // Try materialized view first for other platforms
      let query = supabase
        .from('mv_meta_analytics_daily_totals')
        .select('*')
        .eq('client_id', parseInt(clientId, 10))
        .order('date', { ascending: true });
      
      if (platform) {
        query = query.eq('platform', platform);
      }

      // Add date filtering if provided
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      
      if (!error && data && data.length > 0) {
        console.log('Materialized view query result:', { data: data?.length || 0, error: error?.message, sample: data?.[0] });
        
        // Debug the actual query being executed
        console.log('Materialized view query details:', {
          clientId: clientId,
          platform: platform,
          startDate: startDate,
          endDate: endDate,
          queryParams: {
            client_id: parseInt(clientId, 10),
            platform: platform,
            date_gte: startDate,
            date_lte: endDate
          }
        });
        
        // Return the data directly from materialized view
        const result = data.map(row => ({
          day: row.date,
          platform: row.platform,
          total_views: row.total_views || 0,
          total_reach: row.total_reach || 0,
          total_profile_visits: row.total_profile_visits || 0,
          total_posts: row.total_posts || 0,
          total_accounts: row.total_accounts || 0,
          active_accounts: row.active_accounts || 0,
          account_usernames: row.account_usernames || '',
          // TikTok-specific fields
          total_tt_profile_views: row.total_tt_profile_views || 0,
          total_likes: row.total_likes || 0,
          total_shares: row.total_shares || 0,
          total_comments: row.total_comments || 0,
          total_tt_followers: row.total_tt_followers || 0,
          // YouTube-specific fields
          total_yt_subs_gained: row.total_yt_subs_gained || 0,
          total_yt_subs_lost: row.total_yt_subs_lost || 0,
        }));
        
        console.log('Materialized view result:', { count: result.length, sample: result[0] });
        return result as DailyTotalsRow[];
      }
    }
    
    // Fallback: try to get data from the raw meta_analytics table
    console.log('Using fallback query for meta_analytics with clientId:', clientId, 'platform:', platform);
    let fallbackQuery = supabase
      .from('meta_analytics')
      .select(`
        date,
        platform,
        views,
        reach,
        profile_visits,
        num_posts,
        client_id,
        tt_profile_views,
        likes,
        shares,
        comments,
        tt_followers,
        yt_subs_gained,
        yt_subs_lost
      `)
      .eq('client_id', parseInt(clientId, 10))
      .order('date', { ascending: true });
    
    if (platform) {
      fallbackQuery = fallbackQuery.eq('platform', platform);
    }
    
    const { data: fallbackData, error: fallbackError } = await fallbackQuery;
    
    console.log('Fallback query result:', {
      error: fallbackError,
      count: fallbackData?.length || 0,
      sample: fallbackData?.[0],
      platform: platform,
      clientId: clientId
    });
    
    // Special debugging for YouTube fallback
    if (platform === 'youtube') {
      console.log('YouTube fallback data:', {
        count: fallbackData?.length || 0,
        sample: fallbackData?.[0],
        hasYtSubsGained: fallbackData?.[0]?.yt_subs_gained !== undefined,
        hasYtSubsLost: fallbackData?.[0]?.yt_subs_lost !== undefined,
        ytSubsGainedValue: fallbackData?.[0]?.yt_subs_gained,
        ytSubsLostValue: fallbackData?.[0]?.yt_subs_lost
      });
    }
    
    if (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      // Return empty array instead of throwing error
      return [];
    }
    
    // Aggregate the fallback data by date and platform
    const aggregatedData = (fallbackData || []).reduce((acc: any, row) => {
      const key = `${row.date}_${row.platform}`;
      if (!acc[key]) {
        acc[key] = {
          day: row.date,
          platform: row.platform,
          total_views: 0,
          total_reach: 0,
          total_profile_visits: 0,
          total_posts: 0,
          total_accounts: 0,
          active_accounts: 0,
          account_usernames: '',
          // TikTok-specific fields
          total_tt_profile_views: 0,
          total_likes: 0,
          total_shares: 0,
          total_comments: 0,
          total_tt_followers: 0,
          // YouTube-specific fields
          total_yt_subs_gained: 0,
          total_yt_subs_lost: 0,
        };
      }
      
      acc[key].total_views += row.views || 0;
      acc[key].total_reach += row.reach || 0;
      acc[key].total_profile_visits += row.profile_visits || 0;
      acc[key].total_posts += row.num_posts || 0;
      
      if (row.platform === 'tiktok') {
        acc[key].total_tt_profile_views += row.tt_profile_views || 0;
        acc[key].total_likes += row.likes || 0;
        acc[key].total_shares += row.shares || 0;
        acc[key].total_comments += row.comments || 0;
        acc[key].total_tt_followers += row.tt_followers || 0;
      }
      
      if (row.platform === 'youtube') {
        acc[key].total_yt_subs_gained += row.yt_subs_gained || 0;
        acc[key].total_yt_subs_lost += row.yt_subs_lost || 0;
        acc[key].total_likes += row.likes || 0;
        acc[key].total_shares += row.shares || 0;
        acc[key].total_comments += row.comments || 0;
      }
      
      // For active accounts, we need to count distinct account_ids
      // This aggregation is more complex and might be better handled by the materialized view
      // For now, we'll just sum up the accounts if available, or rely on the MV for accuracy
      acc[key].total_accounts = (acc[key].total_accounts || 0) + 1; // Simple count, not distinct
      if (row.views > 0 || row.tt_profile_views > 0) {
        acc[key].active_accounts = (acc[key].active_accounts || 0) + 1; // Simple count, not distinct
      }
      
      return acc;
    }, {});
    
    const result = Object.values(aggregatedData);
    console.log('Filtered meta analytics result:', { count: result.length, sample: result[0] });
    return result as DailyTotalsRow[];
  } catch (error) {
    console.error('fetchMetaAnalyticsDailyAgg function error:', error);
    // Return empty array instead of throwing error to prevent UI crashes
    return [];
  }
}

export async function fetchAccountDailyMetrics(clientId: string, platform?: 'instagram' | 'facebook'): Promise<AccountDailyMetric[]> {
  try {
    let query = supabase
      .from('v_meta_analytics_account_daily')
      .select('*')
      .eq('client_id', parseInt(clientId, 10))
      .order('date', { ascending: false });
    
    if (platform) {
      query = query.eq('platform', platform);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('fetchAccountDailyMetrics error:', error);
      throw error;
    }
    
    return (data || []) as AccountDailyMetric[];
  } catch (error) {
    console.error('fetchAccountDailyMetrics function error:', error);
    throw error;
  }
}

export async function getAccountId(username: string, platform: 'instagram' | 'facebook', clientId: number): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('id')
      .eq('username', username)
      .eq('platform', platform)
      .eq('client_id', clientId)
      .single();
    
    if (error) {
      console.error('getAccountId error:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('getAccountId function error:', error);
    return null;
  }
}

export async function createAccountIfNotExists(username: string, platform: 'instagram' | 'facebook', clientId: number): Promise<string> {
  try {
    // First try to get existing account
    const existingId = await getAccountId(username, platform, clientId);
    if (existingId) {
      return existingId;
    }
    
    // Create new account if it doesn't exist
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        username,
        platform,
        client_id: clientId,
        display_name: username,
        account_status: 'active'
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('createAccountIfNotExists error:', error);
      throw error;
    }
    
    return data.id;
  } catch (error) {
    console.error('createAccountIfNotExists function error:', error);
    throw error;
  }
}

export async function upsertMetaAnalytics(metrics: MetaAnalyticsMetric[]): Promise<string> {
  try {
    console.log('Upserting meta analytics metrics:', metrics.length, 'records');
    
    const results = await Promise.all(
      metrics.map(async (metric) => {
        // Ensure we have an account_id
        let accountId = metric.account_id;
        if (!accountId) {
          accountId = await createAccountIfNotExists(metric.account_name, metric.platform, metric.client_id);
        }
        
        return supabase.rpc('upsert_meta_analytics', {
          p_date: metric.date,
          p_platform: metric.platform,
          p_account_name: metric.account_name,
          p_views: metric.views,
          p_reach: metric.reach,
          p_profile_visits: metric.profile_visits,
          p_num_posts: metric.num_posts || 0,
          p_client_id: metric.client_id
        });
      })
    );
    
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Some upserts failed:', errors);
      throw new Error(`Failed to upsert ${errors.length} records`);
    }
    
    // Refresh the materialized view
    const { error: refreshError } = await supabase.rpc('refresh_meta_analytics_daily_totals');
    if (refreshError) {
      console.error('Failed to refresh materialized view:', refreshError);
    }
    
    return `Successfully upserted ${metrics.length} metrics records`;
  } catch (error) {
    console.error('upsertMetaAnalytics error:', error);
    throw error;
  }
}

export async function syncFromGoogleSheets(sheetData: any[]): Promise<string> {
  try {
    console.log('Syncing data from Google Sheets:', sheetData.length, 'rows');
    
    const metrics: MetaAnalyticsMetric[] = [];
    
    for (const row of sheetData) {
      // Parse the date from Google Sheets format
      const date = new Date(row.Date);
      const dateStr = date.toISOString().split('T')[0];
      
      // Extract account name from the sheet name or row data
      // You'll need to adjust this based on your actual Google Sheets structure
      const accountName = row.AccountName || 'katiele.fit'; // Default fallback
      
      const mapping = ACCOUNT_MAPPING[accountName];
      if (!mapping) {
        console.warn(`No mapping found for account: ${accountName}`);
        continue;
      }
      
      metrics.push({
        date: dateStr,
        platform: mapping.platform,
        account_name: accountName,
        views: parseInt(row.Views) || 0,
        reach: parseInt(row.Reach) || 0,
        profile_visits: parseInt(row['Instagram Profile Visit']) || 0,
        num_posts: parseInt(row['Instagram Posts']) || 0, // Add num_posts
        client_id: mapping.client_id
      });
    }
    
    return await upsertMetaAnalytics(metrics);
  } catch (error) {
    console.error('syncFromGoogleSheets error:', error);
    throw error;
  }
}

export function getAccountMapping(): Record<string, { client_id: number; platform: 'instagram' | 'facebook' }> {
  return ACCOUNT_MAPPING;
}

export async function refreshMetaAnalyticsMaterializedView(): Promise<void> {
  try {
    console.log('Refreshing meta analytics materialized view...');
    const { error } = await supabase.rpc('refresh_meta_analytics_daily_totals');
    if (error) {
      console.error('Failed to refresh materialized view:', error);
      throw error;
    }
    console.log('Materialized view refreshed successfully');
  } catch (error) {
    console.error('Error refreshing materialized view:', error);
    throw error;
  }
}