-- Optimized Instagram Daily Totals View
-- This version should be much faster and avoid timeouts

CREATE OR REPLACE VIEW public.v_instagram_totals_by_day AS
WITH daily_posts AS (
  SELECT
    instagram_raw.created_at::date AS day,
    instagram_raw.client_id,
    COUNT(DISTINCT instagram_raw.video_id) AS total_posts_posted
  FROM
    instagram_raw
  GROUP BY
    instagram_raw.created_at::date,
    instagram_raw.client_id
),
daily_totals AS (
  SELECT
    d.client_id,
    d.day,
    SUM(d.views_gained) AS total_views,
    SUM(d.likes_gained) AS total_likes,
    SUM(d.comments_gained) AS total_comments
  FROM
    v_daily_instagram_delta d
  GROUP BY
    d.client_id,
    d.day
)
SELECT
  dt.client_id,
  dt.day,
  dt.total_views,
  dt.total_likes,
  dt.total_comments,
  COALESCE(dp.total_posts_posted, 0::bigint) AS total_posts_posted
FROM
  daily_totals dt
  LEFT JOIN daily_posts dp ON dt.day = dp.day AND dt.client_id = dp.client_id
ORDER BY
  dt.day; 