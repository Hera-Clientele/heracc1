# Redis Caching Setup

This dashboard now includes Redis caching to improve performance and reduce database load.

## Setup Options

### Option 1: Redis Cloud (Recommended for Production)
1. Sign up at [Redis Cloud](https://redis.com/try-free/)
2. Create a free database
3. Copy the connection string
4. Add to your environment variables:
   ```
   REDIS_URL=redis://username:password@host:port
   ```

### Option 2: Upstash Redis (Serverless)
1. Sign up at [Upstash](https://upstash.com/)
2. Create a Redis database
3. Copy the connection string
4. Add to your environment variables:
   ```
   REDIS_URL=redis://username:password@host:port
   ```

### Option 3: Local Redis (Development)
1. Install Redis locally:
   ```bash
   # macOS
   brew install redis
   
   # Ubuntu
   sudo apt-get install redis-server
   ```
2. Start Redis:
   ```bash
   redis-server
   ```
3. Use default connection:
   ```
   REDIS_URL=redis://localhost:6379
   ```

## Environment Variables

Add this to your `.env.local` file:
```
REDIS_URL=your_redis_connection_string_here
```

## Cache Configuration

The caching system uses different TTL (Time To Live) values:

- **Daily Aggregation**: 1 hour
- **Top Posts**: 30 minutes  
- **Today's Posts**: 15 minutes
- **Accounts**: 2 hours
- **Weekly Stats**: 1 hour

## Cache Management

In development mode, you'll see a "Cache Management" section at the bottom of the dashboard where you can:

- View cache patterns
- Manually invalidate specific cache types
- Clear cache for specific clients

## Cache Invalidation

Cache is automatically invalidated when:
- Data expires (TTL)
- Manual invalidation via the dashboard
- API calls to `/api/cache/invalidate`

## Performance Benefits

- **Faster page loads**: Cached data loads instantly
- **Reduced database load**: Fewer queries to Supabase
- **Better user experience**: No waiting for data to load
- **Cost savings**: Fewer database operations

## Monitoring

Check the browser console for cache hit/miss logs:
- "Returning cached data" = Cache hit
- "Fetching fresh data" = Cache miss 