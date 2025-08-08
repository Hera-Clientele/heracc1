import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId') || '1';

    // Check if materialized views exist and have data
    const [tiktokViewCheck, instagramViewCheck, latestSnapshotsCheck] = await Promise.all([
      supabase.from('mv_tiktok_top_posts').select('count(*)', { count: 'exact' }),
      supabase.from('mv_instagram_top_posts').select('count(*)', { count: 'exact' }),
      supabase.from('latest_snapshots').select('count(*)', { count: 'exact' })
    ]);

    // Get sample data from each
    const [tiktokSample, instagramSample, latestSnapshotsSample] = await Promise.all([
      supabase.from('mv_tiktok_top_posts').select('*').limit(3),
      supabase.from('mv_instagram_top_posts').select('*').limit(3),
      supabase.from('latest_snapshots').select('*').eq('client_id', parseInt(clientId, 10)).limit(3)
    ]);

    // Check for data in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [recentTiktok, recentSnapshots] = await Promise.all([
      supabase.from('mv_tiktok_top_posts')
        .select('*')
        .eq('client_id', parseInt(clientId, 10))
        .gte('created_at', sevenDaysAgo.toISOString())
        .limit(5),
      supabase.from('latest_snapshots')
        .select('*')
        .eq('client_id', parseInt(clientId, 10))
        .gte('created_at', sevenDaysAgo.toISOString())
        .limit(5)
    ]);

    return Response.json({
      status: 'debug_info',
      materializedViews: {
        tiktok: {
          exists: !tiktokViewCheck.error,
          count: tiktokViewCheck.count || 0,
          error: tiktokViewCheck.error,
          sample: tiktokSample.data || [],
          recentData: recentTiktok.data || []
        },
        instagram: {
          exists: !instagramViewCheck.error,
          count: instagramViewCheck.count || 0,
          error: instagramViewCheck.error,
          sample: instagramSample.data || []
        }
      },
      sourceTables: {
        latestSnapshots: {
          count: latestSnapshotsCheck.count || 0,
          error: latestSnapshotsCheck.error,
          sample: latestSnapshotsSample.data || [],
          recentData: recentSnapshots.data || []
        }
      },
      clientId: parseInt(clientId, 10),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Debug API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
} 