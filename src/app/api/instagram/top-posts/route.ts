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
  let query = supabase
    .from('v_latest_instagram')
    .select('video_id,username,url,created_at,views,post_caption')
    .eq('client_id', parseInt(clientId, 10))
    .order('views', { ascending: false })
    .limit(10);

  if (from && to) {
    query = query.gte('created_at', `${from}T00:00:00`).lt('created_at', `${to}T00:00:00`);
  }

  const { data, error } = await query;

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