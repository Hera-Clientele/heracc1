import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // First, let's test if the view exists and has data
    const { data, error } = await supabase
      .from('v_peak_video_performance')
      .select('*')
      .order('peak_views', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Supabase error:', error);
      
      // If the view doesn't exist or has issues, fall back to a direct query
      console.log('Falling back to direct query...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('tiktok_raw')
        .select('video_id, username, url, followers, post_caption, is_slideshow, created_at, snapshot_date, views, likes, comments, shares')
        .order('views', { ascending: false })
        .limit(100);

      if (fallbackError) {
        console.error('Fallback error:', fallbackError);
        return NextResponse.json({ error: 'Failed to fetch data from both view and fallback' }, { status: 500 });
      }

      // Aggregate the fallback data manually
      const accountMap: Record<string, any> = {};
      for (const row of fallbackData || []) {
        if (!row.username || !row.video_id) continue;
        
        const key = row.username + '|' + row.video_id;
        if (!accountMap[key]) {
          accountMap[key] = {
            video_id: row.video_id,
            username: row.username,
            profile_url: 'https://www.tiktok.com/@' + row.username,
            followers: row.followers,
            peak_views: 0,
            peak_likes: 0,
            peak_comments: 0,
            peak_shares: 0,
            post_caption: row.post_caption,
            is_slideshow: row.is_slideshow,
            created_at: row.created_at,
            latest_snapshot_date: row.snapshot_date
          };
        }
        
        if (row.views && row.views > accountMap[key].peak_views) {
          accountMap[key].peak_views = row.views;
        }
        if (row.likes && row.likes > accountMap[key].peak_likes) {
          accountMap[key].peak_likes = row.likes;
        }
        if (row.comments && row.comments > accountMap[key].peak_comments) {
          accountMap[key].peak_comments = row.comments;
        }
        if (row.shares && row.shares > accountMap[key].peak_shares) {
          accountMap[key].peak_shares = row.shares;
        }
        if (row.snapshot_date > accountMap[key].latest_snapshot_date) {
          accountMap[key].latest_snapshot_date = row.snapshot_date;
        }
      }

      return NextResponse.json({
        success: true,
        data: Object.values(accountMap),
        source: 'fallback'
      });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      source: 'view'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 