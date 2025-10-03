import { NextRequest } from 'next/server';
import { fetchMetaAnalyticsDailyAgg } from '../../../lib/metaAnalytics';
import { getCachedData, setCachedData, cacheKeys, CACHE_TTL } from '../../../lib/redis';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const platform = searchParams.get('platform') as 'instagram' | 'facebook' | undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const accountUsernames = searchParams.get('accountUsernames');
    
    if (!clientId) {
      return Response.json({ error: 'Client ID is required' }, { status: 400 });
    }
    
    // If clientId is 'all', return empty data for now
    if (clientId === 'all') {
      return Response.json({ data: [] });
    }
    
    // Create cache key that includes date range and account filtering
    const cacheKey = cacheKeys.dailyAgg(
      clientId, 
      platform || 'meta-analytics',
      startDate || undefined,
      endDate || undefined,
      accountUsernames || undefined
    );
    
    // Try to get from cache first (only if no date range specified to avoid stale data)
    if (!startDate && !endDate && !accountUsernames) {
      const cachedData = await getCachedData(cacheKey);
      if (cachedData) {
        console.log('meta-analytics daily-agg API: Returning cached data');
        return Response.json({ data: cachedData });
      }
    }
    
    // If not in cache, fetch from database
    console.log('meta-analytics daily-agg API: Fetching fresh data', { clientId, platform, startDate, endDate, accountUsernames });
    const data = await fetchMetaAnalyticsDailyAgg(
      clientId, 
      platform, 
      startDate || undefined, 
      endDate || undefined,
      accountUsernames ? JSON.parse(accountUsernames) : undefined
    );
    
    // Cache the data (only if no date range specified)
    if (!startDate && !endDate && !accountUsernames) {
      await setCachedData(cacheKey, data, CACHE_TTL.DAILY_AGG);
    }
    
    console.log('meta-analytics daily-agg API returning:', { 
      count: data?.length || 0, 
      sample: data?.[0],
      dataStructure: data?.length > 0 ? Object.keys(data[0]) : 'no data'
    });
    return Response.json({ data });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}









