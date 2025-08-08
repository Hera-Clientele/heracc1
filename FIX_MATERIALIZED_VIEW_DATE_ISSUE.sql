-- Fix Materialized View Date Issue
-- The issue is that CURRENT_DATE is calculated when the view is refreshed, not when queried
-- This causes "today" to show yesterday's data if the view was refreshed yesterday

-- 1. Drop the existing enhanced materialized views
DROP MATERIALIZED VIEW IF EXISTS mv_tiktok_top_posts_enhanced CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_instagram_top_posts_enhanced CASCADE;

-- 2. Drop the associated indexes
DROP INDEX IF EXISTS idx_mv_tiktok_top_posts_enhanced_client_period_rank;
DROP INDEX IF EXISTS idx_mv_tiktok_top_posts_enhanced_created_at;
DROP INDEX IF EXISTS idx_mv_instagram_top_posts_enhanced_client_period_rank;
DROP INDEX IF EXISTS idx_mv_instagram_top_posts_enhanced_created_at;
DROP INDEX IF EXISTS idx_mv_tiktok_top_posts_enhanced_unique;
DROP INDEX IF EXISTS idx_mv_instagram_top_posts_enhanced_unique;

-- 3. Create a function to get dynamic date ranges
CREATE OR REPLACE FUNCTION get_today_date_est()
RETURNS date AS $$
BEGIN
  RETURN CURRENT_DATE AT TIME ZONE 'America/New_York';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_yesterday_date_est()
RETURNS date AS $$
BEGIN
  RETURN (CURRENT_DATE - INTERVAL '1 day') AT TIME ZONE 'America/New_York';
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate Enhanced TikTok Top Posts Materialized View with dynamic dates
CREATE MATERIALIZED VIEW mv_tiktok_top_posts_enhanced AS
WITH time_periods AS (
  -- Today (current date in EST) - using function for dynamic calculation
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
    AND created_at >= get_today_date_est()
    AND created_at < (get_today_date_est() + INTERVAL '1 day')
  
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
    AND created_at >= get_yesterday_date_est()
    AND created_at < get_today_date_est()
  
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
    AND created_at >= (get_today_date_est() - INTERVAL '6 days')
    AND created_at < (get_today_date_est() + INTERVAL '1 day')
  
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
    AND created_at >= (get_today_date_est() - INTERVAL '2 days')
    AND created_at < (get_today_date_est() + INTERVAL '1 day')
  
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
    AND created_at >= DATE_TRUNC('month', get_today_date_est())
    AND created_at < (DATE_TRUNC('month', get_today_date_est()) + INTERVAL '1 month')
  
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

-- 5. Recreate Enhanced Instagram Top Posts Materialized View with dynamic dates
CREATE MATERIALIZED VIEW mv_instagram_top_posts_enhanced AS
WITH time_periods AS (
  -- Today (current date in EST) - using function for dynamic calculation
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
    AND created_at >= get_today_date_est()
    AND created_at < (get_today_date_est() + INTERVAL '1 day')
  
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
    AND created_at >= get_yesterday_date_est()
    AND created_at < get_today_date_est()
  
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
    AND created_at >= (get_today_date_est() - INTERVAL '6 days')
    AND created_at < (get_today_date_est() + INTERVAL '1 day')
  
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
    AND created_at >= (get_today_date_est() - INTERVAL '2 days')
    AND created_at < (get_today_date_est() + INTERVAL '1 day')
  
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
    AND created_at >= DATE_TRUNC('month', get_today_date_est())
    AND created_at < (DATE_TRUNC('month', get_today_date_est()) + INTERVAL '1 month')
  
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

-- 6. Recreate indexes
CREATE INDEX idx_mv_tiktok_top_posts_enhanced_client_period_rank 
ON mv_tiktok_top_posts_enhanced(client_id, period, rank);

CREATE INDEX idx_mv_tiktok_top_posts_enhanced_created_at 
ON mv_tiktok_top_posts_enhanced(created_at);

CREATE INDEX idx_mv_instagram_top_posts_enhanced_client_period_rank 
ON mv_instagram_top_posts_enhanced(client_id, period, rank);

CREATE INDEX idx_mv_instagram_top_posts_enhanced_created_at 
ON mv_instagram_top_posts_enhanced(created_at);

-- 7. Recreate unique indexes
CREATE UNIQUE INDEX idx_mv_tiktok_top_posts_enhanced_unique 
ON mv_tiktok_top_posts_enhanced(client_id, period, rank, video_id);

CREATE UNIQUE INDEX idx_mv_instagram_top_posts_enhanced_unique 
ON mv_instagram_top_posts_enhanced(client_id, period, rank, video_id);

-- 8. Test the date functions
SELECT 
  'Today EST' as label,
  get_today_date_est() as date_value,
  CURRENT_DATE AT TIME ZONE 'America/New_York' as comparison
UNION ALL
SELECT 
  'Yesterday EST' as label,
  get_yesterday_date_est() as date_value,
  (CURRENT_DATE - INTERVAL '1 day') AT TIME ZONE 'America/New_York' as comparison;

-- 9. Initial refresh
SELECT refresh_all_top_posts_enhanced(); 