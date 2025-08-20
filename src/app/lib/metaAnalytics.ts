import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface MetaAnalyticsMetric {
  date: string;
  platform: 'instagram' | 'facebook';
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

export async function fetchMetaAnalyticsDailyAgg(clientId: string, platform?: 'instagram' | 'facebook'): Promise<DailyTotalsRow[]> {
  console.log('fetchMetaAnalyticsDailyAgg called with clientId:', clientId, 'platform:', platform);
  
  try {
    let query = supabase
      .from('mv_meta_analytics_daily_totals')
      .select('*')
      .eq('client_id', parseInt(clientId, 10))
      .order('date', { ascending: true });
    
    if (platform) {
      query = query.eq('platform', platform);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('fetchMetaAnalyticsDailyAgg error:', error);
      throw error;
    }
    
    console.log('fetchMetaAnalyticsDailyAgg result:', { count: data?.length || 0, sample: data?.[0] });
    
    // Map the data to match the expected interface
    const mappedData = (data || []).map(row => ({
      day: row.date,
      platform: row.platform,
      total_views: row.total_views || 0,
      total_reach: row.total_reach || 0,
      total_profile_visits: row.total_profile_visits || 0,
      total_posts: row.total_posts || 0, // Add total_posts to mapped data
      total_accounts: row.total_accounts || 0,
      active_accounts: row.active_accounts || 0,
      account_usernames: row.account_usernames || '',
    }));
    
    return mappedData;
  } catch (error) {
    console.error('fetchMetaAnalyticsDailyAgg function error:', error);
    throw error;
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
