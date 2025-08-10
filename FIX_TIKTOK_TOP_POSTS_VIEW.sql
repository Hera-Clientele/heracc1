-- Fix the mv_tiktok_top_posts_enhanced materialized view
-- Drop the existing view first
DROP MATERIALIZED VIEW IF EXISTS public.mv_tiktok_top_posts_enhanced;

-- Create the corrected materialized view with snapshot_date
CREATE MATERIALIZED VIEW public.mv_tiktok_top_posts_enhanced AS
SELECT
  'today'::text AS period,
  latest_snapshots.client_id,
  latest_snapshots.video_id,
  latest_snapshots.username,
  latest_snapshots.url,
  latest_snapshots.post_caption,
  latest_snapshots.created_at,
  latest_snapshots.created_at::date AS snapshot_date,  -- Add this line!
  latest_snapshots.views,
  latest_snapshots.likes,
  latest_snapshots.comments,
  latest_snapshots.shares,
  row_number() OVER (
    PARTITION BY latest_snapshots.client_id
    ORDER BY latest_snapshots.views DESC
  ) AS rank
FROM latest_snapshots
WHERE latest_snapshots.created_at >= (
  CURRENT_DATE AT TIME ZONE 'America/New_York'::text
)
AND latest_snapshots.created_at < (
  (CURRENT_DATE + '1 day'::interval) AT TIME ZONE 'America/New_York'::text
)

UNION ALL

SELECT
  'yesterday'::text AS period,
  latest_snapshots.client_id,
  latest_snapshots.video_id,
  latest_snapshots.username,
  latest_snapshots.url,
  latest_snapshots.post_caption,
  latest_snapshots.created_at,
  latest_snapshots.created_at::date AS snapshot_date,  -- Add this line!
  latest_snapshots.views,
  latest_snapshots.likes,
  latest_snapshots.comments,
  latest_snapshots.shares,
  row_number() OVER (
    PARTITION BY latest_snapshots.client_id
    ORDER BY latest_snapshots.views DESC
  ) AS rank
FROM latest_snapshots
WHERE latest_snapshots.created_at >= (
  (CURRENT_DATE - '1 day'::interval) AT TIME ZONE 'America/New_York'::text
)
AND latest_snapshots.created_at < (
  CURRENT_DATE AT TIME ZONE 'America/New_York'::text
)

UNION ALL

SELECT
  '3days'::text AS period,
  latest_snapshots.client_id,
  latest_snapshots.video_id,
  latest_snapshots.username,
  latest_snapshots.url,
  latest_snapshots.post_caption,
  latest_snapshots.created_at,
  latest_snapshots.created_at::date AS snapshot_date,  -- Add this line!
  latest_snapshots.views,
  latest_snapshots.likes,
  latest_snapshots.comments,
  latest_snapshots.shares,
  row_number() OVER (
    PARTITION BY latest_snapshots.client_id
    ORDER BY latest_snapshots.views DESC
  ) AS rank
FROM latest_snapshots
WHERE latest_snapshots.created_at >= (
  (CURRENT_DATE - '2 days'::interval) AT TIME ZONE 'America/New_York'::text
)
AND latest_snapshots.created_at < (
  (CURRENT_DATE + '1 day'::interval) AT TIME ZONE 'America/New_York'::text
)

UNION ALL

SELECT
  '7days'::text AS period,
  latest_snapshots.client_id,
  latest_snapshots.video_id,
  latest_snapshots.username,
  latest_snapshots.url,
  latest_snapshots.post_caption,
  latest_snapshots.created_at,
  latest_snapshots.created_at::date AS snapshot_date,  -- Add this line!
  latest_snapshots.views,
  latest_snapshots.likes,
  latest_snapshots.comments,
  latest_snapshots.shares,
  row_number() OVER (
    PARTITION BY latest_snapshots.client_id
    ORDER BY latest_snapshots.views DESC
  ) AS rank
FROM latest_snapshots
WHERE latest_snapshots.created_at >= (
  (CURRENT_DATE - '6 days'::interval) AT TIME ZONE 'America/New_York'::text
)
AND latest_snapshots.created_at < (
  (CURRENT_DATE + '1 day'::interval) AT TIME ZONE 'America/New_York'::text
)

UNION ALL

SELECT
  'month'::text AS period,
  latest_snapshots.client_id,
  latest_snapshots.video_id,
  latest_snapshots.username,
  latest_snapshots.url,
  latest_snapshots.post_caption,
  latest_snapshots.created_at,
  latest_snapshots.created_at::date AS snapshot_date,  -- Add this line!
  latest_snapshots.views,
  latest_snapshots.likes,
  latest_snapshots.comments,
  latest_snapshots.shares,
  row_number() OVER (
    PARTITION BY latest_snapshots.client_id
    ORDER BY latest_snapshots.views DESC
  ) AS rank
FROM latest_snapshots
WHERE latest_snapshots.created_at >= date_trunc(
  'month'::text,
  (CURRENT_DATE AT TIME ZONE 'America/New_York'::text)
)
AND latest_snapshots.created_at < (
  date_trunc(
    'month'::text,
    (CURRENT_DATE AT TIME ZONE 'America/New_York'::text)
  ) + '1 mon'::interval
)

UNION ALL

SELECT
  'all'::text AS period,
  latest_snapshots.client_id,
  latest_snapshots.video_id,
  latest_snapshots.username,
  latest_snapshots.url,
  latest_snapshots.post_caption,
  latest_snapshots.created_at,
  latest_snapshots.created_at::date AS snapshot_date,  -- Add this line!
  latest_snapshots.views,
  latest_snapshots.likes,
  latest_snapshots.comments,
  latest_snapshots.shares,
  row_number() OVER (
    PARTITION BY latest_snapshots.client_id
    ORDER BY latest_snapshots.views DESC
  ) AS rank
FROM latest_snapshots;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mv_tiktok_top_posts_enhanced_client_period 
ON public.mv_tiktok_top_posts_enhanced(client_id, period);

CREATE INDEX IF NOT EXISTS idx_mv_tiktok_top_posts_enhanced_username 
ON public.mv_tiktok_top_posts_enhanced(username);

CREATE INDEX IF NOT EXISTS idx_mv_tiktok_top_posts_enhanced_created_at 
ON public.mv_tiktok_top_posts_enhanced(created_at);

-- Grant permissions
GRANT SELECT ON public.mv_tiktok_top_posts_enhanced TO authenticated;
GRANT SELECT ON public.mv_tiktok_top_posts_enhanced TO anon;

-- Refresh the view
REFRESH MATERIALIZED VIEW public.mv_tiktok_top_posts_enhanced; 