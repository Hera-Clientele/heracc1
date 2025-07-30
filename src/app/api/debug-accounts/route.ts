import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { fetchAccountsWithViews } from '../../lib/fetchAccountsWithViews';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get the processed accounts data
    const accounts = await fetchAccountsWithViews();
    
    // Find softgirlkatiele specifically
    const softgirlAccount = accounts.find(acc => acc.username === 'softgirlkatiele');
    
    // Get raw data for softgirlkatiele
    const { data: rawData, error: rawError } = await supabase
      .from('latest_snapshots')
      .select('*')
      .eq('username', 'softgirlkatiele')
      .order('views', { ascending: false });

    if (rawError) {
      console.error('Raw data error:', rawError);
    }

    return NextResponse.json({
      success: true,
      processedAccount: softgirlAccount,
      rawData: rawData || [],
      allAccountsCount: accounts.length,
      top5Accounts: accounts.slice(0, 5).map(acc => ({
        username: acc.username,
        highest_view_post: acc.highest_view_post,
        post_count: acc.post_count,
        average_views: acc.average_views,
        followers: acc.followers
      }))
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 