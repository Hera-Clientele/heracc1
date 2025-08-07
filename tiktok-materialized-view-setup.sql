-- TikTok Materialized View Setup with Auto-Refresh
-- Run this in your Supabase SQL Editor

-- 1. Create the materialized view for TikTok
CREATE MATERIALIZED VIEW mv_tiktok_daily_totals AS
SELECT
  d.client_id,
  d.day,
  SUM(d.views_gained) AS total_views,
  SUM(d.likes_gained) AS total_likes,
  SUM(d.comments_gained) AS total_comments,
  SUM(d.shares_gained) AS total_shares,
  COUNT(DISTINCT CASE WHEN d.views_gained > 0 OR d.likes_gained > 0 OR d.comments_gained > 0 OR d.shares_gained > 0 THEN d.video_id END) AS total_posts_posted
FROM
  v_daily_video_delta d
GROUP BY
  d.client_id,
  d.day
ORDER BY
  d.day;

-- 2. Create indexes on the materialized view for fast queries
CREATE INDEX idx_mv_tiktok_daily_totals_client_day 
ON mv_tiktok_daily_totals(client_id, day);

CREATE INDEX idx_mv_tiktok_daily_totals_day 
ON mv_tiktok_daily_totals(day);

-- 3. Create a function to refresh the TikTok materialized view
CREATE OR REPLACE FUNCTION refresh_tiktok_materialized_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tiktok_daily_totals;
  RAISE NOTICE 'TikTok materialized view refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Create a cron job to refresh every hour
SELECT cron.schedule(
  'refresh-tiktok-daily-totals',
  '0 * * * *', -- Every hour at minute 0
  'SELECT refresh_tiktok_materialized_view();'
);

-- 5. Manual refresh function (for testing)
CREATE OR REPLACE FUNCTION manual_refresh_tiktok_view()
RETURNS text AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_tiktok_daily_totals;
  RETURN 'TikTok materialized view refreshed manually at ' || NOW();
END;
$$ LANGUAGE plpgsql; 