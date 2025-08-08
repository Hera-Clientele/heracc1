import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Refresh all materialized views including enhanced top posts
    const [instagramResult, tiktokResult, topPostsResult, enhancedTopPostsResult] = await Promise.all([
      supabase.rpc('manual_refresh_instagram_view'),
      supabase.rpc('manual_refresh_tiktok_view'),
      supabase.rpc('refresh_all_top_posts'),
      supabase.rpc('refresh_all_top_posts_enhanced')
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (instagramResult.error || tiktokResult.error || topPostsResult.error || enhancedTopPostsResult.error) {
      console.error('Materialized view refresh errors:', { 
        instagram: instagramResult.error, 
        tiktok: tiktokResult.error,
        topPosts: topPostsResult.error,
        enhancedTopPosts: enhancedTopPostsResult.error 
      });
      return Response.json({ 
        error: 'Failed to refresh materialized views',
        details: { instagram: instagramResult.error, tiktok: tiktokResult.error, topPosts: topPostsResult.error, enhancedTopPosts: enhancedTopPostsResult.error }
      }, { status: 500 });
    }
    
    console.log('All materialized views refreshed:', { 
      instagram: instagramResult.data, 
      tiktok: tiktokResult.data,
      topPosts: topPostsResult.data,
      enhancedTopPosts: enhancedTopPostsResult.data 
    });
    
    return Response.json({ 
      success: true, 
      message: 'All materialized views refreshed successfully',
      instagram: instagramResult.data,
      tiktok: tiktokResult.data,
      topPosts: topPostsResult.data,
      enhancedTopPosts: enhancedTopPostsResult.data,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint to check status of all views
export async function GET() {
  try {
    const [instagramCount, tiktokCount, tiktokTopPostsCount, instagramTopPostsCount, tiktokEnhancedCount, instagramEnhancedCount] = await Promise.all([
      supabase.from('mv_instagram_daily_totals').select('count(*)', { count: 'exact' }),
      supabase.from('mv_tiktok_daily_totals').select('count(*)', { count: 'exact' }),
      supabase.from('mv_tiktok_top_posts').select('count(*)', { count: 'exact' }),
      supabase.from('mv_instagram_top_posts').select('count(*)', { count: 'exact' }),
      supabase.from('mv_tiktok_top_posts_enhanced').select('count(*)', { count: 'exact' }),
      supabase.from('mv_instagram_top_posts_enhanced').select('count(*)', { count: 'exact' })
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
      tiktokTopPosts: {
        recordCount: tiktokTopPostsCount.count || 0,
        error: tiktokTopPostsCount.error
      },
      instagramTopPosts: {
        recordCount: instagramTopPostsCount.count || 0,
        error: instagramTopPostsCount.error
      },
      tiktokEnhancedTopPosts: {
        recordCount: tiktokEnhancedCount.count || 0,
        error: tiktokEnhancedCount.error
      },
      instagramEnhancedTopPosts: {
        recordCount: instagramEnhancedCount.count || 0,
        error: instagramEnhancedCount.error
      },
      lastChecked: new Date().toISOString()
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 