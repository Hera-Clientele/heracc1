import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Test the peak performance view
    const { data: peakData, error: peakError } = await supabase
      .from('v_peak_video_performance')
      .select('*')
      .ilike('username', '%softgirlkatiele%')
      .order('peak_views', { ascending: false });

    if (peakError) {
      console.error('Peak performance view error:', peakError);
    }

    // Also test direct query to tiktok_raw for comparison
    const { data: rawData, error: rawError } = await supabase
      .from('tiktok_raw')
      .select('video_id, username, views, snapshot_date')
      .ilike('username', '%softgirlkatiele%')
      .order('views', { ascending: false })
      .limit(10);

    if (rawError) {
      console.error('Raw data error:', rawError);
    }

    // Test latest_snapshots for comparison
    const { data: latestData, error: latestError } = await supabase
      .from('latest_snapshots')
      .select('video_id, username, views, snapshot_date')
      .ilike('username', '%softgirlkatiele%')
      .order('views', { ascending: false })
      .limit(10);

    if (latestError) {
      console.error('Latest snapshots error:', latestError);
    }

    return NextResponse.json({
      success: true,
      peakPerformanceView: {
        data: peakData || [],
        error: peakError?.message || null
      },
      rawData: {
        data: rawData || [],
        error: rawError?.message || null
      },
      latestSnapshots: {
        data: latestData || [],
        error: latestError?.message || null
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 