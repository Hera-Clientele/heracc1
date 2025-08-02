import { NextRequest } from 'next/server';
import { fetchInstagramDailyAgg } from '../../../lib/fetchInstagramDailyAgg';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    
    if (!clientId) {
      return Response.json({ error: 'Client ID is required' }, { status: 400 });
    }
    
    const data = await fetchInstagramDailyAgg(clientId);
    console.log('instagram daily-agg API returning:', { count: data?.length || 0, sample: data?.[0] });
    return Response.json({ data });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 