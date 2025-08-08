import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'all';
    const clientId = searchParams.get('clientId') || '1';

    // Test materialized view
    const { data: mvData, error: mvError } = await supabase
      .from('mv_tiktok_top_posts')
      .select('*')
      .eq('client_id', parseInt(clientId, 10))
      .order('rank', { ascending: true })
      .limit(5);

    // Test original table
    const { data: originalData, error: originalError } = await supabase
      .from('latest_snapshots')
      .select('*')
      .eq('client_id', parseInt(clientId, 10))
      .order('views', { ascending: false })
      .limit(5);

    return Response.json({
      period,
      clientId: parseInt(clientId, 10),
      materializedView: {
        data: mvData || [],
        error: mvError,
        count: mvData?.length || 0
      },
      originalTable: {
        data: originalData || [],
        error: originalError,
        count: originalData?.length || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Test API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
} 