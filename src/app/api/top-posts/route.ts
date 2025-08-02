import { NextRequest } from 'next/server';
import { fetchTopPosts } from '../../lib/fetchTopPosts';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') as 'today' | 'yesterday' | '3days' | '7days' | 'month' | 'all' || 'today';
  const clientId = searchParams.get('clientId');
  
  if (!clientId) {
    return Response.json({ error: 'Client ID is required' }, { status: 400 });
  }
  
  try {
    const posts = await fetchTopPosts(period, clientId);
    console.log('TopPosts API returning:', { posts: posts?.length || 0, sample: posts?.[0] });
    return Response.json({ posts });
  } catch (error: any) {
    console.error('TopPosts API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
} 