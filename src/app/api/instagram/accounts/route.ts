import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('instagram_accounts')
      .select('*')
      .order('followers_count', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ accounts: data });
  } catch (error: any) {
    console.error('Error fetching Instagram accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Instagram accounts data' },
      { status: 500 }
    );
  }
} 