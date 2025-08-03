import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getDateRange(period: string) {
  const now = new Date();
  let from: Date | null = null;
  let to: Date | null = null;
  switch (period) {
    case 'today':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case 'yesterday':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '3days':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case '7days':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case 'all':
    default:
      from = null;
      to = null;
  }
  return { from, to };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'today';
  const clientId = searchParams.get('clientId');
  const { from, to } = getDateRange(period);

  if (!clientId) {
    return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
  }

  // If clientId is 'all', return empty data for now
  if (clientId === 'all') {
    return NextResponse.json({ posts: [] });
  }

  let query = supabase
    .from('v_latest_instagram')
    .select('video_id,username,url,created_at,views,post_caption')
    .eq('client_id', parseInt(clientId, 10))
    .order('views', { ascending: false })
    .limit(10);

  if (from && to) {
    query = query.gte('created_at', from.toISOString()).lt('created_at', to.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('instagram top-posts API returning:', { posts: data?.length || 0, sample: data?.[0] });
  return NextResponse.json({ posts: data });
} 