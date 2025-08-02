import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('username')
      .eq('platform', 'tiktok')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .not('username', 'is', null);

    if (error) throw error;

    const uniqueUsernames = [...new Set(data.map(row => row.username))];
    return NextResponse.json({ count: uniqueUsernames.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 