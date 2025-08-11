import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getWeekStartInAppTimezone } from '../../lib/timezone';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Get the start of the current week in app timezone
    const weekStart = getWeekStartInAppTimezone();
    
    const { data, error } = await supabase
      .from('accounts')
      .select('username')
      .eq('platform', 'tiktok')
      .gte('created_at', `${weekStart}T00:00:00`)
      .not('username', 'is', null);

    if (error) throw error;

    const uniqueUsernames = [...new Set(data.map(row => row.username))];
    return NextResponse.json({ count: uniqueUsernames.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 