import { NextRequest } from 'next/server';
import { fetchInstagramDailyAgg } from '../../../lib/fetchInstagramDailyAgg';

export async function GET(req: NextRequest) {
  try {
    const data = await fetchInstagramDailyAgg();
    return Response.json({ data });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 