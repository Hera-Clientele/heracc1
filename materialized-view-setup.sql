-- Instagram Materialized View Setup with Auto-Refresh
-- Run this in your Supabase SQL Editor

-- 1. Create the materialized view
CREATE MATERIALIZED VIEW mv_instagram_daily_totals AS
SELECT
  d.client_id,
  d.day,
  SUM(d.views_gained) AS total_views,
  SUM(d.likes_gained) AS total_likes,
  SUM(d.comments_gained) AS total_comments,
  COUNT(DISTINCT CASE WHEN d.views_gained > 0 OR d.likes_gained > 0 OR d.comments_gained > 0 THEN d.video_id END) AS total_posts_posted
FROM
  v_daily_instagram_delta d
GROUP BY
  d.client_id,
  d.day
ORDER BY
  d.day;

-- 2. Create indexes on the materialized view for fast queries
CREATE INDEX idx_mv_instagram_daily_totals_client_day 
ON mv_instagram_daily_totals(client_id, day);

CREATE INDEX idx_mv_instagram_daily_totals_day 
ON mv_instagram_daily_totals(day);

-- 3. Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_instagram_materialized_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_instagram_daily_totals;
  RAISE NOTICE 'Instagram materialized view refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Create a cron job to refresh every hour
-- Note: This requires pg_cron extension to be enabled in Supabase
SELECT cron.schedule(
  'refresh-instagram-daily-totals',
  '0 * * * *', -- Every hour at minute 0
  'SELECT refresh_instagram_materialized_view();'
);

-- 5. Manual refresh function (for testing)
CREATE OR REPLACE FUNCTION manual_refresh_instagram_view()
RETURNS text AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_instagram_daily_totals;
  RETURN 'Instagram materialized view refreshed manually at ' || NOW();
END;
$$ LANGUAGE plpgsql; 