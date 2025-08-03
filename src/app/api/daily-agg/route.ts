import { NextRequest } from 'next/server';
import { fetchDailyAgg } from '../../lib/fetchDailyAgg';

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
    
    const data = await fetchDailyAgg(clientId);
    console.log('daily-agg API returning:', { count: data?.length || 0, sample: data?.[0] });
    return Response.json({ data });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 