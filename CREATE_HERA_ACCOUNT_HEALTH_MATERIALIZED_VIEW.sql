-- Create a MATERIALIZED VIEW for much faster performance
-- This pre-calculates all the data and stores it, so queries are instant

CREATE MATERIALIZED VIEW public.hera_account_health AS 
WITH view_trend AS (
  SELECT 
    d.account_id, 
    d.platform, 
    d.username, 
    d.snapshot_date::date AS snapshot_day, 
    d.views_delta 
  FROM hera_daily_post_delta d
), 
daily_avg AS (
  SELECT 
    t.account_id, 
    t.platform, 
    AVG(t.daily_views) AS views_7d_avg 
  FROM (
    SELECT 
      view_trend.account_id, 
      view_trend.platform, 
      view_trend.snapshot_day, 
      SUM(view_trend.views_delta) AS daily_views 
    FROM view_trend 
    WHERE view_trend.snapshot_day >= (CURRENT_DATE - '7 days'::interval) 
    GROUP BY view_trend.account_id, view_trend.platform, view_trend.snapshot_day
  ) t 
  GROUP BY t.account_id, t.platform
), 
yesterday_views AS (
  SELECT 
    view_trend.account_id, 
    view_trend.platform, 
    SUM(view_trend.views_delta) AS views_yesterday 
  FROM view_trend 
  WHERE view_trend.snapshot_day = (CURRENT_DATE - '1 day'::interval) 
  GROUP BY view_trend.account_id, view_trend.platform
), 
tiktok_last_posts AS (
  SELECT 
    a_1.account_id, 
    a_1.platform, 
    MAX(ls.created_at::date) AS last_post_date 
  FROM accounts a_1 
  JOIN latest_snapshots ls ON a_1.username = ls.username 
  WHERE a_1.platform = 'tiktok'::text 
  GROUP BY a_1.account_id, a_1.platform
), 
instagram_last_posts AS (
  SELECT 
    a_1.account_id, 
    a_1.platform, 
    MAX(vli.created_at::date) AS last_post_date 
  FROM accounts a_1 
  JOIN v_latest_instagram vli ON a_1.username = vli.username 
  WHERE a_1.platform = 'instagram'::text 
  GROUP BY a_1.account_id, a_1.platform
), 
combined_last_posts AS (
  SELECT 
    tiktok_last_posts.account_id, 
    tiktok_last_posts.platform, 
    tiktok_last_posts.last_post_date 
  FROM tiktok_last_posts 
  UNION ALL 
  SELECT 
    instagram_last_posts.account_id, 
    instagram_last_posts.platform, 
    instagram_last_posts.last_post_date 
  FROM instagram_last_posts
), 
failed_post_counts AS (
  SELECT 
    post_logs.account_id, 
    post_logs.platform, 
    COUNT(*) FILTER (WHERE post_logs.status ~~ 'ERR%'::text OR post_logs.status = 'failed'::text) AS failed_post_streak 
  FROM post_logs 
  GROUP BY post_logs.account_id, post_logs.platform
), 
follower_growth AS (
  SELECT 
    accounts_analytics.account_id, 
    MAX(accounts_analytics.followers_count) - MIN(accounts_analytics.followers_count) AS follower_growth_7d 
  FROM accounts_analytics 
  WHERE accounts_analytics.snapshot_timestamp >= (CURRENT_DATE - '7 days'::interval) 
  GROUP BY accounts_analytics.account_id
) 
SELECT 
  a.account_id, 
  a.platform, 
  a.username, 
  a.client_id, 
  COALESCE(da.views_7d_avg, 0::numeric) AS views_7d_avg, 
  COALESCE(yv.views_yesterday, 0::numeric) AS views_yesterday, 
  ROUND((
    COALESCE(ac.likes_count_total, 0::bigint)::double precision / 
    NULLIF(ac.views_count_total, 0)::double precision
  )::numeric, 4) AS engagement_rate, 
  ac.followers_count AS total_followers, 
  COALESCE(fg.follower_growth_7d, 0) AS follower_growth_7d, 
  COALESCE(yv.views_yesterday, 0::numeric) < (0.3 * COALESCE(da.views_7d_avg, 1::numeric)) AS shadowban_flag, 
  COALESCE(fp.failed_post_streak, 0::bigint) AS failed_post_streak, 
  clp.last_post_date AS last_successful_post 
FROM accounts a 
LEFT JOIN (
  SELECT DISTINCT ON (accounts_analytics.account_id) 
    accounts_analytics.id, 
    accounts_analytics.account_id, 
    accounts_analytics.client_id, 
    accounts_analytics.profile_key, 
    accounts_analytics.platform, 
    accounts_analytics.snapshot_timestamp, 
    accounts_analytics.views_count_total, 
    accounts_analytics.followers_count, 
    accounts_analytics.likes_count_total, 
    accounts_analytics.comments_count_total, 
    accounts_analytics.shares_count_total, 
    accounts_analytics.created_at, 
    accounts_analytics.username 
  FROM accounts_analytics 
  ORDER BY accounts_analytics.account_id, accounts_analytics.snapshot_timestamp DESC
) ac ON ac.account_id = a.account_id 
LEFT JOIN daily_avg da ON da.account_id = a.account_id AND da.platform = a.platform 
LEFT JOIN yesterday_views yv ON yv.account_id = a.account_id AND yv.platform = a.platform 
LEFT JOIN failed_post_counts fp ON fp.account_id = a.account_id AND fp.platform = a.platform 
LEFT JOIN combined_last_posts clp ON clp.account_id = a.account_id AND clp.platform = a.platform 
LEFT JOIN follower_growth fg ON fg.account_id = a.account_id;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_hera_account_health_platform_client ON public.hera_account_health(platform, client_id);
CREATE INDEX IF NOT EXISTS idx_hera_account_health_username ON public.hera_account_health(username);

-- Grant permissions
GRANT SELECT ON public.hera_account_health TO authenticated;
GRANT SELECT ON public.hera_account_health TO anon;

-- Refresh the materialized view (this will populate it with data)
REFRESH MATERIALIZED VIEW public.hera_account_health; 