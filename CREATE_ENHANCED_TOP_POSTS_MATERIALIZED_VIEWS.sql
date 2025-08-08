-- Enhanced Materialized Views for Top Performing Posts
-- Pre-computes top posts for multiple time periods for optimal performance

-- 1. Create Enhanced TikTok Top Posts Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_tiktok_top_posts_enhanced AS
WITH time_periods AS (
  -- Today (current date in EST)
  SELECT 
    video_id,
    username,
    url,
    views,
    post_caption,
    created_at,
    client_id,
    snapshot_date,
    'today' as period,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY views DESC, created_at DESC
    ) as rank
  FROM latest_snapshots
  WHERE views > 0 
    AND created_at >= CURRENT_DATE AT TIME ZONE 'America/New_York'
    AND created_at < (CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE 'America/New_York'
  
  UNION ALL
  
  -- Yesterday
  SELECT 
    video_id,
    username,
    url,
    views,
    post_caption,
    created_at,
    client_id,
    snapshot_date,
    'yesterday' as period,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY views DESC, created_at DESC
    ) as rank
  FROM latest_snapshots
  WHERE views > 0 
    AND created_at >= (CURRENT_DATE - INTERVAL '1 day') AT TIME ZONE 'America/New_York'
    AND created_at < CURRENT_DATE AT TIME ZONE 'America/New_York'
  
  UNION ALL
  
  -- Last 7 days
  SELECT 
    video_id,
    username,
    url,
    views,
    post_caption,
    created_at,
    client_id,
    snapshot_date,
    '7days' as period,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY views DESC, created_at DESC
    ) as rank
  FROM latest_snapshots
  WHERE views > 0 
    AND created_at >= (CURRENT_DATE - INTERVAL '6 days') AT TIME ZONE 'America/New_York'
    AND created_at < (CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE 'America/New_York'
  
  UNION ALL
  
  -- Last 3 days
  SELECT 
    video_id,
    username,
    url,
    views,
    post_caption,
    created_at,
    client_id,
    snapshot_date,
    '3days' as period,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY views DESC, created_at DESC
    ) as rank
  FROM latest_snapshots
  WHERE views > 0 
    AND created_at >= (CURRENT_DATE - INTERVAL '2 days') AT TIME ZONE 'America/New_York'
    AND created_at < (CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE 'America/New_York'
  
  UNION ALL
  
  -- Current month
  SELECT 
    video_id,
    username,
    url,
    views,
    post_caption,
    created_at,
    client_id,
    snapshot_date,
    'month' as period,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY views DESC, created_at DESC
    ) as rank
  FROM latest_snapshots
  WHERE views > 0 
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'America/New_York')
    AND created_at < (DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'America/New_York') + INTERVAL '1 month')
  
  UNION ALL
  
  -- All time
  SELECT 
    video_id,
    username,
    url,
    views,
    post_caption,
    created_at,
    client_id,
    snapshot_date,
    'all' as period,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY views DESC, created_at DESC
    ) as rank
  FROM latest_snapshots
  WHERE views > 0
)
SELECT 
  video_id,
  username,
  url,
  views,
  post_caption,
  created_at,
  client_id,
  snapshot_date,
  period,
  rank
FROM time_periods
WHERE rank <= 20  -- Store top 20 per client per period
ORDER BY client_id, period, rank;

-- 2. Create Enhanced Instagram Top Posts Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_instagram_top_posts_enhanced AS
WITH time_periods AS (
  -- Today (current date in EST)
  SELECT 
    video_id,
    username,
    url,
    views,
    post_caption,
    created_at,
    client_id,
    'today' as period,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY views DESC, created_at DESC
    ) as rank
  FROM v_latest_instagram
  WHERE views > 0 
    AND created_at >= CURRENT_DATE AT TIME ZONE 'America/New_York'
    AND created_at < (CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE 'America/New_York'
  
  UNION ALL
  
  -- Yesterday
  SELECT 
    video_id,
    username,
    url,
    views,
    post_caption,
    created_at,
    client_id,
    'yesterday' as period,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY views DESC, created_at DESC
    ) as rank
  FROM v_latest_instagram
  WHERE views > 0 
    AND created_at >= (CURRENT_DATE - INTERVAL '1 day') AT TIME ZONE 'America/New_York'
    AND created_at < CURRENT_DATE AT TIME ZONE 'America/New_York'
  
  UNION ALL
  
  -- Last 7 days
  SELECT 
    video_id,
    username,
    url,
    views,
    post_caption,
    created_at,
    client_id,
    '7days' as period,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY views DESC, created_at DESC
    ) as rank
  FROM v_latest_instagram
  WHERE views > 0 
    AND created_at >= (CURRENT_DATE - INTERVAL '6 days') AT TIME ZONE 'America/New_York'
    AND created_at < (CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE 'America/New_York'
  
  UNION ALL
  
  -- Last 3 days
  SELECT 
    video_id,
    username,
    url,
    views,
    post_caption,
    created_at,
    client_id,
    '3days' as period,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY views DESC, created_at DESC
    ) as rank
  FROM v_latest_instagram
  WHERE views > 0 
    AND created_at >= (CURRENT_DATE - INTERVAL '2 days') AT TIME ZONE 'America/New_York'
    AND created_at < (CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE 'America/New_York'
  
  UNION ALL
  
  -- Current month
  SELECT 
    video_id,
    username,
    url,
    views,
    post_caption,
    created_at,
    client_id,
    'month' as period,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY views DESC, created_at DESC
    ) as rank
  FROM v_latest_instagram
  WHERE views > 0 
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'America/New_York')
    AND created_at < (DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'America/New_York') + INTERVAL '1 month')
  
  UNION ALL
  
  -- All time
  SELECT 
    video_id,
    username,
    url,
    views,
    post_caption,
    created_at,
    client_id,
    'all' as period,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY views DESC, created_at DESC
    ) as rank
  FROM v_latest_instagram
  WHERE views > 0
)
SELECT 
  video_id,
  username,
  url,
  views,
  post_caption,
  created_at,
  client_id,
  period,
  rank
FROM time_periods
WHERE rank <= 20  -- Store top 20 per client per period
ORDER BY client_id, period, rank;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mv_tiktok_top_posts_enhanced_client_period_rank 
ON mv_tiktok_top_posts_enhanced(client_id, period, rank);

CREATE INDEX IF NOT EXISTS idx_mv_tiktok_top_posts_enhanced_created_at 
ON mv_tiktok_top_posts_enhanced(created_at);

CREATE INDEX IF NOT EXISTS idx_mv_instagram_top_posts_enhanced_client_period_rank 
ON mv_instagram_top_posts_enhanced(client_id, period, rank);

CREATE INDEX IF NOT EXISTS idx_mv_instagram_top_posts_enhanced_created_at 
ON mv_instagram_top_posts_enhanced(created_at);

-- 4. Create unique indexes required for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_tiktok_top_posts_enhanced_unique 
ON mv_tiktok_top_posts_enhanced(client_id, period, rank, video_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_instagram_top_posts_enhanced_unique 
ON mv_instagram_top_posts_enhanced(client_id, period, rank, video_id);

-- 5. Create refresh functions
CREATE OR REPLACE FUNCTION refresh_tiktok_top_posts_enhanced()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tiktok_top_posts_enhanced;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_instagram_top_posts_enhanced()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_instagram_top_posts_enhanced;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_all_top_posts_enhanced()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tiktok_top_posts_enhanced;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_instagram_top_posts_enhanced;
END;
$$ LANGUAGE plpgsql;

-- 6. Initial refresh
SELECT refresh_all_top_posts_enhanced();

-- 7. Example queries for the API endpoints
-- For TikTok top posts with period filtering:
/*
SELECT 
  video_id,
  username,
  url,
  views,
  post_caption,
  created_at,
  client_id,
  snapshot_date,
  period,
  rank
FROM mv_tiktok_top_posts_enhanced
WHERE client_id = $1
  AND period = $2
ORDER BY rank
LIMIT 10;
*/

-- For Instagram top posts with period filtering:
/*
SELECT 
  video_id,
  username,
  url,
  views,
  post_caption,
  created_at,
  client_id,
  period,
  rank
FROM mv_instagram_top_posts_enhanced
WHERE client_id = $1
  AND period = $2
ORDER BY rank
LIMIT 10;
*/ 