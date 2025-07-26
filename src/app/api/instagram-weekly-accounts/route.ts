import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Query the Instagram weekly unique accounts view
    const { data, error } = await supabase
      .from('v_instagram_weekly_unique_accounts')
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      uniqueAccounts: data.unique_accounts_this_week || 0,
      weekStart: data.week_start,
      weekEnd: data.week_end
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch Instagram weekly accounts data' },
      { status: 500 }
    );
  }
} 