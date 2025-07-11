import { NextRequest } from 'next/server';
import { fetchTopPosts } from '../../lib/fetchTopPosts';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url, process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
  const period = searchParams.get('period') as 'today' | '3days' | '7days' | 'month' | 'all' || 'today';
  try {
    const posts = await fetchTopPosts(period);
    return Response.json({ posts });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 