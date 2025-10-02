import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const period = searchParams.get('period') || '7days';

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case '3days':
        startDate.setDate(startDate.getDate() - 3);
        break;
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch top performing posts across all platforms and clients
    const [tiktokPosts, instagramPosts] = await Promise.all([
      // TikTok top posts
      supabase
        .from('top_posts')
        .select(`
          post_id,
          caption,
          views,
          likes,
          comments,
          shares,
          created_at,
          client_id,
          account_username
        `)
        .eq('platform', 'tiktok')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)
        .order('views', { ascending: false })
        .limit(limit),
      
      // Instagram top posts
      supabase
        .from('top_posts')
        .select(`
          post_id,
          caption,
          views,
          likes,
          comments,
          shares,
          created_at,
          client_id,
          account_username
        `)
        .eq('platform', 'instagram')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)
        .order('views', { ascending: false })
        .limit(limit)
    ]);

    if (tiktokPosts.error) throw tiktokPosts.error;
    if (instagramPosts.error) throw instagramPosts.error;

    // Combine and sort all posts
    const allPosts = [
      ...tiktokPosts.data.map(post => ({ ...post, platform: 'tiktok' })),
      ...instagramPosts.data.map(post => ({ ...post, platform: 'instagram' }))
    ].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));

    // Get top accounts by total views
    const topAccountsResult = await supabase
      .from('accounts')
      .select('account_username, platform, views_count_total, client_id')
      .order('views_count_total', { ascending: false })
      .limit(limit);

    if (topAccountsResult.error) throw topAccountsResult.error;

    // Get top clients by total views
    const topClientsResult = await supabase
      .from('accounts')
      .select('client_id, views_count_total')
      .order('views_count_total', { ascending: false });

    if (topClientsResult.error) throw topClientsResult.error;

    // Aggregate client stats
    const clientStats = topClientsResult.data.reduce((acc, account) => {
      const clientId = account.client_id;
      if (!acc[clientId]) {
        acc[clientId] = {
          client_id: clientId,
          total_views: 0,
          account_count: 0
        };
      }
      acc[clientId].total_views += Number(account.views_count_total) || 0;
      acc[clientId].account_count += 1;
      return acc;
    }, {} as Record<string, any>);

    const topClients = Object.values(clientStats)
      .sort((a: any, b: any) => b.total_views - a.total_views)
      .slice(0, limit);

    return Response.json({
      success: true,
      data: {
        period: { startDate: startDateStr, endDate: endDateStr },
        topPosts: allPosts.slice(0, limit),
        topAccounts: topAccountsResult.data,
        topClients
      }
    });

  } catch (error: any) {
    console.error('Admin top performers error:', error);
    return Response.json({ error: 'Failed to fetch top performers' }, { status: 500 });
  }
}





