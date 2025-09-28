-- Drop the existing materialized view
DROP MATERIALIZED VIEW IF EXISTS public.mv_meta_analytics_daily_totals;

-- Create the updated materialized view with all TikTok and YouTube fields
CREATE MATERIALIZED VIEW public.mv_meta_analytics_daily_totals AS
SELECT
  ma.date,
  ma.platform,
  ma.client_id,
  -- Core metrics (Instagram/Facebook)
  SUM(ma.views) as total_views,
  SUM(ma.reach) as total_reach,
  SUM(ma.profile_visits) as total_profile_visits,
  SUM(ma.num_posts) as total_posts,
  
  -- TikTok-specific metrics
  SUM(ma.tt_profile_views) as total_tt_profile_views,
  SUM(ma.likes) as total_likes,
  SUM(ma.shares) as total_shares,
  SUM(ma.comments) as total_comments,
  SUM(ma.tt_followers) as total_tt_followers,
  
  -- YouTube-specific metrics
  SUM(ma.yt_subs_gained) as total_yt_subs_gained,
  SUM(ma.yt_subs_lost) as total_yt_subs_lost,
  
  -- Account counts
  COUNT(DISTINCT ma.account_id) as total_accounts,
  COUNT(
    DISTINCT CASE
      WHEN ma.views > 0 OR ma.tt_profile_views > 0 THEN ma.account_id
      ELSE NULL::uuid
    END
  ) as active_accounts,
  
  -- Account usernames
  STRING_AGG(DISTINCT a.username, ', '::text) as account_usernames
FROM
  meta_analytics ma
  LEFT JOIN accounts a ON ma.account_id = a.account_id
GROUP BY
  ma.date,
  ma.platform,
  ma.client_id
ORDER BY
  ma.date DESC,
  ma.platform,
  ma.client_id;

-- Create indexes on the materialized view for better performance
CREATE INDEX IF NOT EXISTS idx_mv_meta_analytics_daily_totals_date 
ON public.mv_meta_analytics_daily_totals USING btree (date);

CREATE INDEX IF NOT EXISTS idx_mv_meta_analytics_daily_totals_platform 
ON public.mv_meta_analytics_daily_totals USING btree (platform);

CREATE INDEX IF NOT EXISTS idx_mv_meta_analytics_daily_totals_client 
ON public.mv_meta_analytics_daily_totals USING btree (client_id);

CREATE INDEX IF NOT EXISTS idx_mv_meta_analytics_daily_totals_composite 
ON public.mv_meta_analytics_daily_totals USING btree (client_id, platform, date);

-- Refresh the materialized view to populate it with data
REFRESH MATERIALIZED VIEW public.mv_meta_analytics_daily_totals;
