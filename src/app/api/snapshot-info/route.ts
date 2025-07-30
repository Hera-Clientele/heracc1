import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get overall stats about latest_snapshots table
    const { data: totalCount, error: countError } = await supabase
      .from('latest_snapshots')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Count error:', countError);
    }

    // Get date range information
    const { data: dateRange, error: dateError } = await supabase
      .from('latest_snapshots')
      .select('created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (dateError) {
      console.error('Date range error:', dateError);
    }

    // Get unique usernames count
    const { data: uniqueUsers, error: usersError } = await supabase
      .from('latest_snapshots')
      .select('username', { count: 'exact', head: true });

    if (usersError) {
      console.error('Unique users error:', usersError);
    }

    // Get the most recent snapshot for softgirlkatiele specifically
    const { data: softgirlData, error: softgirlError } = await supabase
      .from('latest_snapshots')
      .select('*')
      .eq('username', 'softgirlkatiele')
      .order('views', { ascending: false })
      .limit(5);

    if (softgirlError) {
      console.error('Softgirlkatiele data error:', softgirlError);
    }

    // Check if there's any data in tiktok_raw for softgirlkatiele with 90k+ views
    const { data: rawSoftgirlData, error: rawSoftgirlError } = await supabase
      .from('tiktok_raw')
      .select('*')
      .eq('username', 'softgirlkatiele')
      .gte('views', 90000)
      .order('views', { ascending: false });

    if (rawSoftgirlError) {
      console.error('Raw softgirlkatiele data error:', rawSoftgirlError);
    }

    return NextResponse.json({
      success: true,
      tableInfo: {
        totalRecords: totalCount,
        latestRecordDate: dateRange?.[0]?.created_at,
        latestUpdateDate: dateRange?.[0]?.updated_at,
        uniqueUsernames: uniqueUsers
      },
      softgirlkatiele: {
        latestSnapshotData: softgirlData || [],
        rawDataWith90kPlus: rawSoftgirlData || [],
        highestViewInSnapshot: softgirlData && softgirlData.length > 0 
          ? Math.max(...softgirlData.map(post => post.views || 0))
          : 0,
        highestViewInRaw: rawSoftgirlData && rawSoftgirlData.length > 0
          ? Math.max(...rawSoftgirlData.map(post => post.views || 0))
          : 0
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 