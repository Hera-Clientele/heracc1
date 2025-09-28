import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return Response.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    // Fetch aggregated data from all clients across all platforms
    const [tiktokResult, instagramResult, facebookResult, accountsResult] = await Promise.all([
      // TikTok data
      supabase
        .from('daily_agg')
        .select('views, posts, likes, comments, shares')
        .eq('platform', 'tiktok')
        .gte('day', startDate)
        .lte('day', endDate),
      
      // Instagram data
      supabase
        .from('instagram_daily_agg')
        .select('views, posts, likes, comments, shares')
        .gte('day', startDate)
        .lte('day', endDate),
      
      // Facebook data
      supabase
        .from('facebook_daily_agg')
        .select('video_views, reach_count')
        .gte('day', startDate)
        .lte('day', endDate),
      
      // Accounts data
      supabase
        .from('accounts')
        .select('platform, views_count_total, client_id')
    ]);

    // Check for errors
    if (tiktokResult.error) throw tiktokResult.error;
    if (instagramResult.error) throw instagramResult.error;
    if (facebookResult.error) throw facebookResult.error;
    if (accountsResult.error) throw accountsResult.error;

    // Aggregate TikTok data
    const tiktokStats = tiktokResult.data.reduce((acc, row) => ({
      views: acc.views + (Number(row.views) || 0),
      posts: acc.posts + (Number(row.posts) || 0),
      likes: acc.likes + (Number(row.likes) || 0),
      comments: acc.comments + (Number(row.comments) || 0),
      shares: acc.shares + (Number(row.shares) || 0)
    }), { views: 0, posts: 0, likes: 0, comments: 0, shares: 0 });

    // Aggregate Instagram data
    const instagramStats = instagramResult.data.reduce((acc, row) => ({
      views: acc.views + (Number(row.views) || 0),
      posts: acc.posts + (Number(row.posts) || 0),
      likes: acc.likes + (Number(row.likes) || 0),
      comments: acc.comments + (Number(row.comments) || 0),
      shares: acc.shares + (Number(row.shares) || 0)
    }), { views: 0, posts: 0, likes: 0, comments: 0, shares: 0 });

    // Aggregate Facebook data
    const facebookStats = facebookResult.data.reduce((acc, row) => ({
      views: acc.views + (Number(row.video_views) || 0),
      reach: acc.reach + (Number(row.reach_count) || 0)
    }), { views: 0, reach: 0 });

    // Count accounts by platform
    const accountCounts = accountsResult.data.reduce((acc, row) => {
      acc[row.platform] = (acc[row.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count unique clients
    const uniqueClients = new Set(accountsResult.data.map(row => row.client_id)).size;

    // Calculate totals
    const totalViews = tiktokStats.views + instagramStats.views + facebookStats.views;
    const totalPosts = tiktokStats.posts + instagramStats.posts;
    const totalLikes = tiktokStats.likes + instagramStats.likes;
    const totalComments = tiktokStats.comments + instagramStats.comments;
    const totalShares = tiktokStats.shares + instagramStats.shares;

    return Response.json({
      success: true,
      data: {
        period: { startDate, endDate },
        totals: {
          views: totalViews,
          posts: totalPosts,
          likes: totalLikes,
          comments: totalComments,
          shares: totalShares,
          accounts: accountsResult.data.length,
          clients: uniqueClients
        },
        platforms: {
          tiktok: {
            ...tiktokStats,
            accounts: accountCounts.tiktok || 0
          },
          instagram: {
            ...instagramStats,
            accounts: accountCounts.instagram || 0
          },
          facebook: {
            ...facebookStats,
            accounts: accountCounts.facebook || 0
          }
        }
      }
    });

  } catch (error: any) {
    console.error('Admin aggregated stats error:', error);
    return Response.json({ error: 'Failed to fetch aggregated statistics' }, { status: 500 });
  }
}



