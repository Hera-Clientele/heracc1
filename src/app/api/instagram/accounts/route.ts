import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('v_latest_instagram')
      .select('username,profile_url,views');

    if (error) throw error;

    // Group by username and calculate aggregates
    const grouped: Record<string, { username: string, profile_url: string, views: number[] }> = {};
    for (const row of data || []) {
      if (!grouped[row.username]) {
        grouped[row.username] = {
          username: row.username,
          profile_url: row.profile_url,
          views: [],
        };
      }
      grouped[row.username].views.push(row.views);
    }

    const accounts = Object.values(grouped).map(acc => ({
      username: acc.username,
      profile_url: acc.profile_url,
      highest_view_post: Math.max(...acc.views),
      posts: acc.views.length,
      avg_views: Math.round(acc.views.reduce((a, b) => a + b, 0) / acc.views.length),
    }));

    // Sort by highest_view_post descending
    accounts.sort((a, b) => b.highest_view_post - a.highest_view_post);

    return NextResponse.json({ accounts, totalAccounts: accounts.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch Instagram accounts data' },
      { status: 500 }
    );
  }
} 