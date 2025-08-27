import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface GoogleSheetsMetric {
  date: string;
  platform: 'instagram' | 'facebook';
  account_name: string;
  views: number;
  reach: number;
  profile_visits: number;
  client_id: number;
}

export interface DailyTotalsRow {
  day: string;
  platform: string;
  total_views: number;
  total_reach: number;
  total_profile_visits: number;
  total_accounts: number;
  active_accounts: number;
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

export async function fetchGoogleSheetsDailyAgg(clientId: string, platform?: 'instagram' | 'facebook'): Promise<DailyTotalsRow[]> {
  console.log('fetchGoogleSheetsDailyAgg called with clientId:', clientId, 'platform:', platform);
  
  try {
    let query = supabase
      .from('mv_google_sheets_daily_totals')
      .select('*')
      .eq('client_id', parseInt(clientId, 10))
      .order('date', { ascending: true });
    
    if (platform) {
      query = query.eq('platform', platform);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('fetchGoogleSheetsDailyAgg error:', error);
      throw error;
    }
    
    console.log('fetchGoogleSheetsDailyAgg result:', { count: data?.length || 0, sample: data?.[0] });
    
    // Map the data to match the expected interface
    const mappedData = (data || []).map(row => ({
      day: row.date,
      platform: row.platform,
      total_views: row.total_views || 0,
      total_reach: row.total_reach || 0,
      total_profile_visits: row.total_profile_visits || 0,
      total_accounts: row.total_accounts || 0,
      active_accounts: row.active_accounts || 0,
    }));
    
    return mappedData;
  } catch (error) {
    console.error('fetchGoogleSheetsDailyAgg function error:', error);
    throw error;
  }
}

export async function fetchAccountDailyMetrics(clientId: string, platform?: 'instagram' | 'facebook'): Promise<any[]> {
  try {
    let query = supabase
      .from('v_account_daily_metrics')
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
    
    return data || [];
  } catch (error) {
    console.error('fetchAccountDailyMetrics function error:', error);
    throw error;
  }
}

export async function upsertGoogleSheetsMetrics(metrics: GoogleSheetsMetric[]): Promise<string> {
  try {
    console.log('Upserting Google Sheets metrics:', metrics.length, 'records');
    
    const results = await Promise.all(
      metrics.map(metric => 
        supabase.rpc('upsert_google_sheets_metrics', {
          p_date: metric.date,
          p_platform: metric.platform,
          p_account_name: metric.account_name,
          p_views: metric.views,
          p_reach: metric.reach,
          p_profile_visits: metric.profile_visits,
          p_client_id: metric.client_id
        })
      )
    );
    
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Some upserts failed:', errors);
      throw new Error(`Failed to upsert ${errors.length} records`);
    }
    
    // Refresh the materialized view
    const { error: refreshError } = await supabase.rpc('refresh_google_sheets_daily_totals');
    if (refreshError) {
      console.error('Failed to refresh materialized view:', refreshError);
    }
    
    return `Successfully upserted ${metrics.length} metrics records`;
  } catch (error) {
    console.error('upsertGoogleSheetsMetrics error:', error);
    throw error;
  }
}

export async function syncFromGoogleSheets(sheetData: any[]): Promise<string> {
  try {
    console.log('Syncing data from Google Sheets:', sheetData.length, 'rows');
    
    const metrics: GoogleSheetsMetric[] = [];
    
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
        client_id: mapping.client_id
      });
    }
    
    return await upsertGoogleSheetsMetrics(metrics);
  } catch (error) {
    console.error('syncFromGoogleSheets error:', error);
    throw error;
  }
}

export function getAccountMapping(): Record<string, { client_id: number; platform: 'instagram' | 'facebook' }> {
  return ACCOUNT_MAPPING;
}

