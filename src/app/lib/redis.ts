import Redis from 'ioredis';

// Redis connection with error handling
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Test Redis connection
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

redis.on('ready', () => {
  console.log('✅ Redis is ready');
});

redis.on('close', () => {
  console.log('⚠️ Redis connection closed');
});

// Cache configuration
const CACHE_TTL = {
  DAILY_AGG: 3600, // 1 hour for daily aggregation data
  TOP_POSTS: 1800, // 30 minutes for top posts
  ACCOUNTS: 7200,   // 2 hours for account data
  TODAY_POSTS: 900, // 15 minutes for today's posts
  WEEKLY_STATS: 3600, // 1 hour for weekly stats
};

// Helper function to generate cache keys
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join(':');
  return `${prefix}:${sortedParams}`;
}

// Helper function to get cached data
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    // Check if Redis is connected
    if (!redis.status || redis.status !== 'ready') {
      console.log('⚠️ Redis not ready, skipping cache');
      return null;
    }
    
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

// Helper function to set cached data
export async function setCachedData(key: string, data: any, ttl: number): Promise<void> {
  try {
    // Check if Redis is connected
    if (!redis.status || redis.status !== 'ready') {
      console.log('⚠️ Redis not ready, skipping cache set');
      return;
    }
    
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

// Helper function to invalidate cache by pattern
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error('Redis invalidate error:', error);
  }
}

// Cache key generators for specific data types
export const cacheKeys = {
  dailyAgg: (clientId: string, platform: string, startDate?: string, endDate?: string, accountUsernames?: string) => 
    generateCacheKey('daily_agg', { clientId, platform, startDate, endDate, accountUsernames }),
  
  topPosts: (clientId: string, platform: string, period: string) => 
    generateCacheKey('top_posts', { clientId, platform, period }),
  
  accounts: (clientId: string, platform: string) => 
    generateCacheKey('accounts', { clientId, platform }),
  
  todayPosts: (clientId: string) => 
    generateCacheKey('today_posts', { clientId }),
  
  weeklyStats: (clientId: string, platform: string) => 
    generateCacheKey('weekly_stats', { clientId, platform }),
};

export { redis, CACHE_TTL }; 