import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
      .select('username')
      .eq('platform', 'instagram')
      .eq('client_id', parseInt(clientId, 10))
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .not('username', 'is', null);

    if (error) throw error;

    const uniqueUsernames = [...new Set(data.map(row => row.username))];
    return NextResponse.json({ count: uniqueUsernames.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 