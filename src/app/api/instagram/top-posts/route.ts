import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentTimeInAppTimezone, getDateRangeForPeriod } from '../../../lib/timezone';
import { getCachedData, setCachedData, cacheKeys, CACHE_TTL } from '../../../lib/redis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getDateRange(period: string) {
  return getDateRangeForPeriod(period as 'today' | 'yesterday' | '3days' | '7days' | 'month' | 'all');
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'all';
    const clientId = searchParams.get('clientId') || '1';
    
    // Get date range for the period
    const { from, to } = getDateRange(period);

    console.log('Instagram top-posts API: Fetching fresh data');
    console.log('Instagram top-posts API: period:', period, 'clientId:', clientId, 'from:', from, 'to:', to);

    // Declare data and error variables at the top
    let data: any[] | null = null;
    let error: any = null;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // If clientId is 'all', return empty data for now
    if (clientId === 'all') {
      return NextResponse.json({ posts: [] });
    }

    // Try to get from cache first
    const cacheKey = cacheKeys.topPosts(clientId, 'instagram', period);
    const cachedData = await getCachedData(cacheKey);
    
    if (cachedData) {
      console.log('Instagram top-posts API: Returning cached data');
      return NextResponse.json({ posts: cachedData });
    }

    // If not in cache, fetch from database
    console.log('Instagram top-posts API: Fetching fresh data');
    
    // For "today" period, check if materialized view has current day data
    if (period === 'today') {
      try {
        // Check if materialized view has data for today
        const todayDate = getCurrentTimeInAppTimezone().format('YYYY-MM-DD');
        
        const { data: todayCheck, error: todayError } = await supabase
          .from('mv_instagram_top_posts_enhanced')
          .select('created_at')
          .eq('client_id', parseInt(clientId, 10))
          .eq('period', 'today')
          .gte('created_at', `${todayDate}T00:00:00`)
          .lt('created_at', `${todayDate}T23:59:59`)
          .limit(1);

        // If no data for today in materialized view, use fallback
        if (todayError || !todayCheck || todayCheck.length === 0) {
          console.log('No today data in materialized view, using fallback for today...');
          let fallbackQuery = supabase
            .from('v_latest_instagram')
            .select('video_id,username,url,created_at,views,post_caption')
            .eq('client_id', parseInt(clientId, 10))
            .order('views', { ascending: false })
            .limit(10);

          if (from && to) {
            fallbackQuery = fallbackQuery.gte('created_at', `${from}T00:00:00`).lt('created_at', `${to}T00:00:00`);
          }

          const fallbackResult = await fallbackQuery;
          data = fallbackResult.data;
          error = fallbackResult.error;
        } else {
          // Use enhanced materialized view for today
          let query = supabase
            .from('mv_instagram_top_posts_enhanced')
            .select('video_id,username,url,created_at,views,post_caption,client_id,rank,period')
            .eq('client_id', parseInt(clientId, 10))
            .eq('period', period)
            .order('rank', { ascending: true })
            .limit(10);

          const mvResult = await query;
          data = mvResult.data;
          error = mvResult.error;
        }
      } catch (error) {
        console.log('Error checking today data, using fallback...', error);
        // Use fallback
        let fallbackQuery = supabase
          .from('v_latest_instagram')
          .select('video_id,username,url,created_at,views,post_caption')
          .eq('client_id', parseInt(clientId, 10))
          .order('views', { ascending: false })
          .limit(10);

        if (from && to) {
          // Use the ISO string dates directly since they're already in the correct timezone
          fallbackQuery = fallbackQuery.gte('created_at', from).lt('created_at', to);
        }

        const fallbackResult = await fallbackQuery;
        data = fallbackResult.data;
        error = fallbackResult.error;
      }
    } else {
      // Check if enhanced materialized view exists and has data for this period
      try {
        const { data: testData, error: testError } = await supabase
          .from('mv_instagram_top_posts_enhanced')
          .select('video_id, client_id, period')
          .eq('client_id', parseInt(clientId, 10))
          .eq('period', period)
          .limit(1);

        if (testError) {
          console.log('Enhanced materialized view not available, using fallback...', testError);
          // Use fallback
          let fallbackQuery = supabase
            .from('v_latest_instagram')
            .select('video_id,username,url,created_at,views,post_caption')
            .eq('client_id', parseInt(clientId, 10))
            .order('views', { ascending: false })
            .limit(10);

          if (from && to) {
            // Use the ISO string dates directly since they're already in the correct timezone
            fallbackQuery = fallbackQuery.gte('created_at', from).lt('created_at', to);
          }

          const fallbackResult = await fallbackQuery;
          data = fallbackResult.data;
          error = fallbackResult.error;
        } else if (!testData || testData.length === 0) {
          console.log('Enhanced materialized view has no data for this period, using fallback...');
          // Use fallback
          let fallbackQuery = supabase
            .from('v_latest_instagram')
            .select('video_id,username,url,created_at,views,post_caption')
            .eq('client_id', parseInt(clientId, 10))
            .order('views', { ascending: false })
            .limit(10);

          if (from && to) {
            // Use the ISO string dates directly since they're already in the correct timezone
            fallbackQuery = fallbackQuery.gte('created_at', from).lt('created_at', to);
          }

          const fallbackResult = await fallbackQuery;
          data = fallbackResult.data;
          error = fallbackResult.error;
        } else {
          console.log('Enhanced materialized view is available and has data for period:', period);
          // Use enhanced materialized view
          let query = supabase
            .from('mv_instagram_top_posts_enhanced')
            .select('video_id,username,url,created_at,views,post_caption,client_id,rank,period')
            .eq('client_id', parseInt(clientId, 10))
            .eq('period', period)
            .order('rank', { ascending: true })
            .limit(10);

          const mvResult = await query;
          data = mvResult.data;
          error = mvResult.error;
        }
      } catch (error) {
        console.log('Error checking enhanced materialized view, using fallback...', error);
        // Use fallback
        let fallbackQuery = supabase
          .from('v_latest_instagram')
          .select('video_id,username,url,created_at,views,post_caption')
          .eq('client_id', parseInt(clientId, 10))
          .order('views', { ascending: false })
          .limit(10);

        if (from && to) {
          // Use the ISO string dates directly since they're already in the correct timezone
          fallbackQuery = fallbackQuery.gte('created_at', from).lt('created_at', to);
        }

        const fallbackResult = await fallbackQuery;
        data = fallbackResult.data;
        error = fallbackResult.error;
      }
    }

    if (error) {
      console.error('Instagram top-posts API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    console.log('instagram top-posts API raw data:', data);
    console.log('instagram top-posts API returning:', { posts: data?.length || 0, sample: data?.[0] });
    
    // Ensure we return an array
    const postsArray = Array.isArray(data) ? data : [];
    
    // Cache the data
    await setCachedData(cacheKey, postsArray, CACHE_TTL.TOP_POSTS);
    
    return NextResponse.json({ posts: postsArray });
  } catch (error) {
    console.error('Instagram top-posts API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 