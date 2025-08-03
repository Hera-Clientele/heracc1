import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ContentQueueItem {
  content_id: string;
  airtable_id?: string;
  video_url: string;
  caption: string;
  schedule_time: string;
  status: 'queued' | 'scheduled' | 'pending' | 'success' | 'ERR_BAD_REQUEST' | 'too_short';
  retry_count: number;
  account_id: string;
  created_at: string;
  updated_at: string;
  ayrshare_post_id?: string;
  ayrshare_ref_id?: string;
  post_date?: string;
  posted_link?: string;
        // Account information from join
      account_username?: string;
      account_platform?: string;
      account_display_name?: string;
      account_profile_url?: string;
      account_pfp_url?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform') as 'tiktok' | 'instagram' | undefined;
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const excludeStatus = searchParams.get('excludeStatus');
    
    if (!clientId) {
      return Response.json({ error: 'Client ID is required' }, { status: 400 });
    }
    
    // Build the query with join to accounts table
    let query = supabase
      .from('content_queue')
      .select(`
        *,
        accounts!inner(
          username,
          platform,
          display_name,
          profile_url,
          pfp_url,
          client_id
        )
      `)
      .eq('accounts.client_id', clientId)
      .order('schedule_time', { ascending: true });

    // Filter by platform if specified
    if (platform) {
      query = query.eq('accounts.platform', platform);
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status);
    }

    // Exclude status if specified
    if (excludeStatus) {
      query = query.neq('status', excludeStatus);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: 'Failed to fetch content queue data' }, { status: 500 });
    }
    
    // Transform the data to flatten the join
    const transformedData: ContentQueueItem[] = (data || []).map(item => ({
      content_id: item.content_id,
      airtable_id: item.airtable_id,
      video_url: item.video_url,
      caption: item.caption,
      schedule_time: item.schedule_time,
      status: item.status,
      retry_count: item.retry_count,
      account_id: item.account_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      ayrshare_post_id: item.ayrshare_post_id,
      ayrshare_ref_id: item.ayrshare_ref_id,
      post_date: item.post_date,
      posted_link: item.posted_link,
      account_username: item.accounts?.username,
      account_platform: item.accounts?.platform,
      account_display_name: item.accounts?.display_name,
      account_profile_url: item.accounts?.profile_url,
      account_pfp_url: item.accounts?.pfp_url,
    }));

    return Response.json({ 
      data: transformedData,
      total: transformedData.length,
      byStatus: transformedData.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error: any) {
    console.error('API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
} 