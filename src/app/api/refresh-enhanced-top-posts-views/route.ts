import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Refresh both enhanced top posts materialized views
    const [tiktokResult, instagramResult] = await Promise.all([
      supabase.rpc('refresh_tiktok_top_posts_enhanced'),
      supabase.rpc('refresh_instagram_top_posts_enhanced')
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (tiktokResult.error || instagramResult.error) {
      console.error('Enhanced top posts materialized view refresh errors:', { 
        tiktok: tiktokResult.error, 
        instagram: instagramResult.error 
      });
      return Response.json({ 
        error: 'Failed to refresh enhanced top posts materialized views',
        details: { tiktok: tiktokResult.error, instagram: instagramResult.error }
      }, { status: 500 });
    }
    
    console.log('Enhanced top posts materialized views refreshed:', { 
      tiktok: tiktokResult.data, 
      instagram: instagramResult.data 
    });
    
    return Response.json({ 
      success: true, 
      message: 'Enhanced top posts materialized views refreshed successfully',
      tiktok: tiktokResult.data,
      instagram: instagramResult.data,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint to check status of enhanced top posts views
export async function GET() {
  try {
    const [tiktokCount, instagramCount] = await Promise.all([
      supabase.from('mv_tiktok_top_posts_enhanced').select('count(*)', { count: 'exact' }),
      supabase.from('mv_instagram_top_posts_enhanced').select('count(*)', { count: 'exact' })
    ]);
    
    // Get period breakdown
    const [tiktokPeriods, instagramPeriods] = await Promise.all([
      supabase.from('mv_tiktok_top_posts_enhanced').select('period').limit(100),
      supabase.from('mv_instagram_top_posts_enhanced').select('period').limit(100)
    ]);
    
    const tiktokPeriodBreakdown = tiktokPeriods.data?.reduce((acc, item) => {
      acc[item.period] = (acc[item.period] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    const instagramPeriodBreakdown = instagramPeriods.data?.reduce((acc, item) => {
      acc[item.period] = (acc[item.period] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    return Response.json({ 
      status: 'active',
      tiktok: {
        recordCount: tiktokCount.count || 0,
        error: tiktokCount.error,
        periodBreakdown: tiktokPeriodBreakdown
      },
      instagram: {
        recordCount: instagramCount.count || 0,
        error: instagramCount.error,
        periodBreakdown: instagramPeriodBreakdown
      },
      lastChecked: new Date().toISOString()
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 