import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Refresh both materialized views
    const [instagramResult, tiktokResult] = await Promise.all([
      supabase.rpc('manual_refresh_instagram_view'),
      supabase.rpc('manual_refresh_tiktok_view')
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (instagramResult.error || tiktokResult.error) {
      console.error('Materialized view refresh errors:', { instagram: instagramResult.error, tiktok: tiktokResult.error });
      return Response.json({ 
        error: 'Failed to refresh materialized views',
        details: { instagram: instagramResult.error, tiktok: tiktokResult.error }
      }, { status: 500 });
    }
    
    console.log('All materialized views refreshed:', { instagram: instagramResult.data, tiktok: tiktokResult.data });
    
    return Response.json({ 
      success: true, 
      message: 'All materialized views refreshed successfully',
      instagram: instagramResult.data,
      tiktok: tiktokResult.data,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint to check status of both views
export async function GET() {
  try {
    const [instagramCount, tiktokCount] = await Promise.all([
      supabase.from('mv_instagram_daily_totals').select('count(*)', { count: 'exact' }),
      supabase.from('mv_tiktok_daily_totals').select('count(*)', { count: 'exact' })
    ]);
    
    return Response.json({ 
      status: 'active',
      instagram: {
        recordCount: instagramCount.count || 0,
        error: instagramCount.error
      },
      tiktok: {
        recordCount: tiktokCount.count || 0,
        error: tiktokCount.error
      },
      lastChecked: new Date().toISOString()
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 