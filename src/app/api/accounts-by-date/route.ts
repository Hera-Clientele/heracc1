import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const platform = searchParams.get('platform') || 'tiktok';

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    // Query the accounts table for accounts created within the date range
    const { data, error } = await supabase
      .from('accounts')
      .select('username')
      .eq('platform', platform)
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .not('username', 'is', null);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    // Get unique usernames
    const uniqueUsernames = [...new Set(data.map(row => row.username))];
    const uniqueCount = uniqueUsernames.length;

    return NextResponse.json({
      success: true,
      uniqueAccounts: uniqueCount,
      accounts: uniqueUsernames
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 