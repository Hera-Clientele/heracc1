import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getCachedData, setCachedData, cacheKeys, CACHE_TTL } from '../../../lib/redis';

dayjs.extend(utc);
dayjs.extend(timezone);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getDateRange(period: string) {
  const now = dayjs().tz('America/New_York');
  let from: string | null = null;
  let to: string | null = null;
  
  switch (period) {
    case 'today':
      from = now.format('YYYY-MM-DD');
      to = now.add(1, 'day').format('YYYY-MM-DD');
      break;
    case 'yesterday':
      from = now.subtract(1, 'day').format('YYYY-MM-DD');
      to = now.format('YYYY-MM-DD');
      break;
    case '3days':
      from = now.subtract(2, 'day').format('YYYY-MM-DD');
      to = now.add(1, 'day').format('YYYY-MM-DD');
      break;
    case '7days':
      from = now.subtract(6, 'day').format('YYYY-MM-DD');
      to = now.add(1, 'day').format('YYYY-MM-DD');
      break;
    case 'month':
      from = now.startOf('month').format('YYYY-MM-DD');
      to = now.endOf('month').add(1, 'day').format('YYYY-MM-DD');
      break;
    case 'all':
    default:
      from = null;
      to = null;
  }
  return { from, to };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'today';
  const clientId = searchParams.get('clientId');
  const { from, to } = getDateRange(period);

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
      const today = new Date();
      const todayEST = new Date(today.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const todayDate = todayEST.toISOString().split('T')[0];
      
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
        fallbackQuery = fallbackQuery.gte('created_at', `${from}T00:00:00`).lt('created_at', `${to}T00:00:00`);
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
          fallbackQuery = fallbackQuery.gte('created_at', `${from}T00:00:00`).lt('created_at', `${to}T00:00:00`);
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
          fallbackQuery = fallbackQuery.gte('created_at', `${from}T00:00:00`).lt('created_at', `${to}T00:00:00`);
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
        fallbackQuery = fallbackQuery.gte('created_at', `${from}T00:00:00`).lt('created_at', `${to}T00:00:00`);
      }

      const fallbackResult = await fallbackQuery;
      data = fallbackResult.data;
      error = fallbackResult.error;
    }
  }

  if (error) {
    console.error('Instagram top-posts API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('instagram top-posts API raw data:', data);
  console.log('instagram top-posts API returning:', { posts: data?.length || 0, sample: data?.[0] });
  
  // Ensure we return an array
  const postsArray = Array.isArray(data) ? data : [];
  
  // Cache the data
  await setCachedData(cacheKey, postsArray, CACHE_TTL.TOP_POSTS);
  
  return NextResponse.json({ posts: postsArray });
} 