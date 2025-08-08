# Top Posts Materialized Views Implementation

## Overview

This implementation uses materialized views to optimize the performance of top 10 performing posts queries, especially as the dataset grows with daily new posts.

## Benefits

1. **Performance**: Pre-computed results make queries much faster
2. **Scalability**: Performance remains consistent as data grows
3. **Reduced Database Load**: Less CPU and I/O usage on main tables
4. **Consistency**: All users see the same data until refresh

## Materialized Views

### 1. `mv_tiktok_top_posts`
- **Source**: `latest_snapshots` table
- **Purpose**: Pre-computed top 20 posts per client (ranked by views)
- **Refresh**: Can be refreshed independently or with all views

### 2. `mv_instagram_top_posts`
- **Source**: `v_latest_instagram` view
- **Purpose**: Pre-computed top 20 posts per client (ranked by views)
- **Refresh**: Can be refreshed independently or with all views

## Implementation Details

### Database Schema
```sql
-- TikTok Top Posts Materialized View
CREATE MATERIALIZED VIEW mv_tiktok_top_posts AS
WITH ranked_posts AS (
  SELECT 
    video_id, username, url, views, post_caption, 
    created_at, client_id, snapshot_date,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY views DESC, created_at DESC
    ) as rank
  FROM latest_snapshots
  WHERE views > 0
)
SELECT * FROM ranked_posts WHERE rank <= 20;

-- Required unique indexes for concurrent refresh
CREATE UNIQUE INDEX idx_mv_tiktok_top_posts_unique 
ON mv_tiktok_top_posts(client_id, rank, video_id);
```

### API Changes
- **TikTok**: Updated `fetchTopPosts()` to use `mv_tiktok_top_posts`
- **Instagram**: Updated `/api/instagram/top-posts` to use `mv_instagram_top_posts`
- **Fallback**: Both implementations include fallback to original queries

### Refresh Functions
- `refresh_tiktok_top_posts()` - Refresh TikTok top posts view
- `refresh_instagram_top_posts()` - Refresh Instagram top posts view
- `refresh_all_top_posts()` - Refresh both views

## API Endpoints

### Refresh Top Posts Views
- **POST** `/api/refresh-top-posts-views` - Refresh both top posts materialized views
- **GET** `/api/refresh-top-posts-views` - Check status of top posts views

### Updated Endpoints
- **POST** `/api/refresh-all-materialized-views` - Now includes top posts views
- **GET** `/api/refresh-all-materialized-views` - Now includes top posts view status

## Usage

### Setting Up Materialized Views
1. Run the SQL commands in `CREATE_TOP_POSTS_MATERIALIZED_VIEWS.sql`
2. The views will be created and initially populated

### Refreshing Views
```bash
# Refresh all materialized views (including top posts)
curl -X POST http://localhost:3000/api/refresh-all-materialized-views

# Refresh only top posts views
curl -X POST http://localhost:3000/api/refresh-top-posts-views
```

### Checking Status
```bash
# Check all materialized views status
curl http://localhost:3000/api/refresh-all-materialized-views

# Check top posts views status
curl http://localhost:3000/api/refresh-top-posts-views
```

## Performance Considerations

### Refresh Strategy
- **Frequency**: Refresh after new data ingestion (daily/weekly)
- **Timing**: Schedule during low-traffic periods
- **Concurrent**: Uses `REFRESH MATERIALIZED VIEW CONCURRENTLY` for zero downtime

### Storage
- **Size**: Stores top 20 posts per client (configurable)
- **Indexes**: Optimized indexes on `client_id` and `rank`
- **Unique Indexes**: Required for concurrent refresh (`client_id`, `rank`, `video_id`)
- **Cleanup**: Old posts automatically removed as new ones rank higher

### Fallback Strategy
- If materialized view fails, automatically falls back to original query
- Ensures service availability even if views are being refreshed

## Monitoring

### Key Metrics
- Materialized view record counts
- Refresh duration
- Query performance improvements
- Fallback usage frequency

### Logging
- Refresh operations are logged with timestamps
- Error conditions trigger fallback with logging
- Performance metrics tracked for optimization

## Future Enhancements

1. **Time-based Views**: Create separate views for different time periods
2. **Auto-refresh**: Implement automatic refresh based on data changes
3. **Caching**: Add Redis caching layer for frequently accessed data
4. **Analytics**: Track view usage and performance metrics

## Troubleshooting

### Common Issues
1. **View not found**: Ensure SQL script was executed successfully
2. **Stale data**: Check last refresh timestamp and refresh if needed
3. **Performance issues**: Verify indexes are created and optimized
4. **Fallback usage**: Check logs for materialized view errors
5. **Concurrent refresh error**: Ensure unique indexes are created for concurrent refresh

### Debug Commands
```sql
-- Check view status
SELECT COUNT(*) FROM mv_tiktok_top_posts;
SELECT COUNT(*) FROM mv_instagram_top_posts;

-- Check refresh functions
SELECT * FROM pg_proc WHERE proname LIKE 'refresh_%_top_posts';

-- Check indexes
SELECT indexname, tablename FROM pg_indexes WHERE tablename LIKE 'mv_%_top_posts';

-- Check unique indexes for concurrent refresh
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('mv_tiktok_top_posts', 'mv_instagram_top_posts')
  AND indexname LIKE '%unique%'
ORDER BY tablename, indexname;
``` 