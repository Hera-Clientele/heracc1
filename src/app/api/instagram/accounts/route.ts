import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('platform', 'instagram')
      .eq('client_id', parseInt(clientId, 10))
      .order('views_count_total', { ascending: false });

    if (error) throw error;

    const accounts = (data || []).map(account => ({
      username: account.username,
      profile_url: account.profile_url || '',
      highest_view_post: account.views_count_total || 0,
      posts: account.media_count || 0,
      avg_views: account.media_count && account.views_count_total 
        ? Math.round(account.views_count_total / account.media_count)
        : 0,
      views: account.views_count_total || 0,
      likes: account.likes_count_total || 0,
      comments: account.comments_count_total || 0,
      followers: account.followers_count || 0,
      display_name: account.display_name,
      bio: account.bio,
      account_niche: account.account_niche,
      pfp_url: account.pfp_url,
      account_status: account.account_status,
      last_updated: account.last_updated,
    }));

    return NextResponse.json({ accounts, totalAccounts: accounts.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch Instagram accounts data' },
      { status: 500 }
    );
  }
} 