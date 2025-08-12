import { NextRequest } from 'next/server';
import { fetchFacebookDailyAgg } from '../../../lib/fetchFacebookDailyAgg';
import { getCachedData, setCachedData, cacheKeys, CACHE_TTL } from '../../../lib/redis';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    
    if (!clientId) {
      return Response.json({ error: 'Client ID is required' }, { status: 400 });
    }
    
    // If clientId is 'all', return empty data for now
    if (clientId === 'all') {
      return Response.json({ data: [] });
    }
    
    // Try to get from cache first
    const cacheKey = cacheKeys.dailyAgg(clientId, 'facebook');
    const cachedData = await getCachedData(cacheKey);
    
    if (cachedData) {
      console.log('facebook daily-agg API: Returning cached data');
      return Response.json({ data: cachedData });
    }
    
    // If not in cache, fetch from database
    console.log('facebook daily-agg API: Fetching fresh data');
    const data = await fetchFacebookDailyAgg(clientId);
    
    // Cache the data
    await setCachedData(cacheKey, data, CACHE_TTL.DAILY_AGG);
    
    console.log('facebook daily-agg API returning:', { count: data?.length || 0, sample: data?.[0] });
    return Response.json({ data });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
