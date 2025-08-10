import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const platform = searchParams.get('platform') || 'tiktok';
    const clientId = searchParams.get('clientId');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    let uniqueUsernames: string[] = [];

    if (platform === 'tiktok') {
      // Use the enhanced materialized view for TikTok instead of latest_snapshots
      const { data, error } = await supabase
        .from('mv_tiktok_top_posts_enhanced')
        .select('username')
        .eq('client_id', clientId)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .not('username', 'is', null);

      if (error) {
        console.error('Supabase error with materialized view:', error);
        // Fallback to latest_snapshots if materialized view fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('latest_snapshots')
          .select('username')
          .eq('client_id', clientId)
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`)
          .not('username', 'is', null);

        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          return NextResponse.json({ error: 'Failed to fetch TikTok accounts' }, { status: 500 });
        }
        uniqueUsernames = [...new Set(fallbackData.map(row => row.username))];
      } else {
        uniqueUsernames = [...new Set(data.map(row => row.username))];
      }
    } else if (platform === 'instagram') {
      // Use the enhanced materialized view for Instagram instead of v_latest_instagram
      const { data, error } = await supabase
        .from('mv_instagram_top_posts_enhanced')
        .select('username')
        .eq('client_id', clientId)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .not('username', 'is', null);

      if (error) {
        console.error('Supabase error with materialized view:', error);
        // Fallback to v_latest_instagram if materialized view fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('v_latest_instagram')
          .select('username')
          .eq('client_id', clientId)
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`)
          .not('username', 'is', null);

        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          return NextResponse.json({ error: 'Failed to fetch Instagram accounts' }, { status: 500 });
        }
        uniqueUsernames = [...new Set(fallbackData.map(row => row.username))];
      } else {
        uniqueUsernames = [...new Set(data.map(row => row.username))];
      }
    }

    const uniqueCount = uniqueUsernames.length;

    return NextResponse.json({
      success: true,
      uniqueAccounts: uniqueCount,
      accounts: uniqueUsernames
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 