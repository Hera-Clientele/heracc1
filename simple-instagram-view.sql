-- Simple Instagram Daily Totals View
-- This version directly aggregates from v_daily_instagram_delta for better performance

CREATE OR REPLACE VIEW public.v_instagram_totals_by_day AS
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