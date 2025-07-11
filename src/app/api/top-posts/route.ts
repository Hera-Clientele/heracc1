import { NextRequest } from 'next/server';
import { fetchTopPosts } from '../../lib/fetchTopPosts';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') as 'today' | '3days' | '7days' | 'month' | 'all' || 'today';
  try {
    const posts = await fetchTopPosts(period);
    return Response.json({ posts });
  } catch (error: any) {
    console.error('TopPosts API error:', error); // Log the error for debugging
    return Response.json({ error: error.message }, { status: 500 });
  }
} 