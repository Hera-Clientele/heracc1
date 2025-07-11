import { NextRequest } from 'next/server';
import { fetchDailyAgg } from '../../lib/fetchDailyAgg';

export async function GET(req: NextRequest) {
  try {
    const data = await fetchDailyAgg();
    return Response.json({ data });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 