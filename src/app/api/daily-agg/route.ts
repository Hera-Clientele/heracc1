import { NextRequest } from 'next/server';
import { fetchDailyAgg } from '../../lib/fetchDailyAgg';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    
    console.log('daily-agg API called with clientId:', clientId);
    
    if (!clientId) {
      console.error('daily-agg API: Client ID is required');
      return Response.json({ error: 'Client ID is required' }, { status: 400 });
    }
    
    // If clientId is 'all', return empty data for now
    if (clientId === 'all') {
      console.log('daily-agg API: Returning empty data for clientId "all"');
      return Response.json({ data: [] });
    }
    
    console.log('daily-agg API: Calling fetchDailyAgg...');
    const data = await fetchDailyAgg(clientId);
    console.log('daily-agg API returning:', { count: data?.length || 0, sample: data?.[0] });
    return Response.json({ data });
  } catch (error: any) {
    console.error('daily-agg API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
} 