import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Get all posts for this username from latest_snapshots
    const { data: latestData, error: latestError } = await supabase
      .from('latest_snapshots')
      .select('*')
      .eq('username', username)
      .order('views', { ascending: false });

    if (latestError) {
      console.error('Latest snapshots error:', latestError);
      return NextResponse.json({ error: 'Failed to fetch latest data' }, { status: 500 });
    }

    // Also check the raw TikTok data table for comparison
    const { data: rawData, error: rawError } = await supabase
      .from('tiktok_raw')
      .select('*')
      .eq('username', username)
      .order('views', { ascending: false })
      .limit(10);

    if (rawError) {
      console.error('Raw data error:', rawError);
    }

    // Get the highest view post from latest_snapshots
    const highestFromLatest = latestData && latestData.length > 0 
      ? Math.max(...latestData.map(post => post.views || 0))
      : 0;

    // Get the highest view post from raw data
    const highestFromRaw = rawData && rawData.length > 0
      ? Math.max(...rawData.map(post => post.views || 0))
      : 0;

    return NextResponse.json({
      success: true,
      username,
      latestSnapshotData: latestData || [],
      rawData: rawData || [],
      highestViewFromLatest: highestFromLatest,
      highestViewFromRaw: highestFromRaw,
      discrepancy: highestFromRaw - highestFromLatest,
      latestSnapshotCount: latestData?.length || 0,
      rawDataCount: rawData?.length || 0
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 