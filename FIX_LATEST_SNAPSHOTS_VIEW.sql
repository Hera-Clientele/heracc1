-- Fix latest_snapshots view to show posts based on actual creation dates
-- The current view only shows the latest snapshot for each video, which might miss newer posts

-- 1. Drop the existing view
DROP VIEW IF EXISTS public.latest_snapshots;

-- 2. Create a new view that shows posts based on creation dates
CREATE VIEW public.latest_snapshots AS
SELECT
  video_id,
  username,
  url,
  'https://www.tiktok.com/@'::text || username as profile_url,
  followers,
  post_caption,
  is_slideshow,
  created_at,
  snapshot_date,
  views,
  likes,
  comments,
  shares,
  client_id
FROM (
  SELECT
    tiktok_raw.video_id,
    tiktok_raw.username,
    tiktok_raw.url,
    tiktok_raw.created_at,
    tiktok_raw.snapshot_date,
    tiktok_raw.views,
    tiktok_raw.likes,
    tiktok_raw.comments,
    tiktok_raw.shares,
    tiktok_raw.post_caption,
    tiktok_raw.followers,
    tiktok_raw.is_slideshow,
    tiktok_raw.profile_url,
    tiktok_raw.client_id,
    -- Use created_at for ranking instead of snapshot_date
    ROW_NUMBER() OVER (
      PARTITION BY tiktok_raw.video_id
      ORDER BY tiktok_raw.created_at DESC, tiktok_raw.snapshot_date DESC
    ) as rn
  FROM tiktok_raw
) s
WHERE rn = 1;

-- 3. Test the new view to see if it shows newer posts
SELECT 
  'New View Test' as label,
  COUNT(*) as total_posts,
  MIN(created_at) as earliest_post,
  MAX(created_at) as latest_post,
  COUNT(CASE WHEN created_at >= '2025-08-04' THEN 1 END) as posts_after_aug3
FROM public.latest_snapshots 
WHERE client_id = 1;

-- 4. Show recent posts to verify they're now visible
SELECT 
  'Recent Posts (New View)' as label,
  video_id,
  username,
  created_at,
  created_at AT TIME ZONE 'America/New_York' as created_at_est,
  snapshot_date,
  views
FROM public.latest_snapshots 
WHERE client_id = 1
ORDER BY created_at DESC
LIMIT 10; 