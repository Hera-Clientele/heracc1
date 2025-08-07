import { NextRequest } from 'next/server';
import { invalidateCache } from '../../../lib/redis';

export async function POST(req: NextRequest) {
  try {
    const { pattern } = await req.json();
    
    if (!pattern) {
      return Response.json({ error: 'Cache pattern is required' }, { status: 400 });
    }
    
    await invalidateCache(pattern);
    
    return Response.json({ 
      success: true, 
      message: `Cache invalidated for pattern: ${pattern}` 
    });
  } catch (error: any) {
    console.error('Cache invalidation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint to list cache patterns that can be invalidated
export async function GET() {
  const cachePatterns = {
    'daily_agg:*': 'Invalidate all daily aggregation cache',
    'top_posts:*': 'Invalidate all top posts cache',
    'accounts:*': 'Invalidate all accounts cache',
    'today_posts:*': 'Invalidate today\'s posts cache',
    'weekly_stats:*': 'Invalidate weekly stats cache',
    'daily_agg:1:*': 'Invalidate daily aggregation for client 1',
    'top_posts:1:*': 'Invalidate top posts for client 1',
  };
  
  return Response.json({ 
    patterns: cachePatterns,
    message: 'Use POST with pattern to invalidate cache'
  });
} 