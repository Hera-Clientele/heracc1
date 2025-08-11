import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDateRangeForPeriod } from '../lib/timezone';
import { getCachedData, setCachedData, cacheKeys, CACHE_TTL } from '../lib/redis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface TodayPost {
  video_id: string;
  username: string;
  url: string;
  profile_url: string;
  followers?: number;
  post_caption: string;
  is_slideshow: boolean;
  created_at: string;
  // snapshot_date removed - using created_at instead
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  client_id: string;
  platform: 'tiktok' | 'instagram';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const platform = searchParams.get('platform') as 'tiktok' | 'instagram' | undefined;
    
    if (!clientId) {
      return Response.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Try to get from cache first
    const cacheKey = cacheKeys.todayPosts(clientId);
    const cachedData = await getCachedData(cacheKey);
    
    if (cachedData) {
      console.log('Today posts API: Returning cached data');
      return Response.json(cachedData);
    }

    // If not in cache, fetch from database
    console.log('Today posts API: Fetching fresh data');
    
    // Get today's date range in app timezone using the centralized function
    const { from, to } = getDateRangeForPeriod('today');
    
    let tiktokPosts: TodayPost[] = [];
    let instagramPosts: TodayPost[] = [];

    // Fetch TikTok posts from latest_snapshots
    if (!platform || platform === 'tiktok') {
      const { data: tiktokData, error: tiktokError } = await supabase
        .from('latest_snapshots')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', from!)
        .lt('created_at', to!)
        .order('created_at', { ascending: false });

      if (tiktokError) {
        console.error('TikTok fetch error:', tiktokError);
      } else {
        tiktokPosts = (tiktokData || []).map(post => ({
          ...post,
          platform: 'tiktok' as const
        }));
      }
    }

    // Fetch Instagram posts from v_latest_instagram
    if (!platform || platform === 'instagram') {
      const { data: instagramData, error: instagramError } = await supabase
        .from('v_latest_instagram')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', from!)
        .lt('created_at', to!)
        .order('created_at', { ascending: false });

      if (instagramError) {
        console.error('Instagram fetch error:', instagramError);
      } else {
        instagramPosts = (instagramData || []).map(post => ({
          ...post,
          platform: 'instagram' as const
        }));
      }
    }

    // Combine and sort all posts by creation time
    const allPosts = [...tiktokPosts, ...instagramPosts].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const responseData = { 
      data: allPosts,
      tiktokCount: tiktokPosts.length,
      instagramCount: instagramPosts.length,
      totalCount: allPosts.length
    };

    // Cache the data
    await setCachedData(cacheKey, responseData, CACHE_TTL.TODAY_POSTS);

    return Response.json(responseData);
  } catch (error: any) {
    console.error('API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
} 