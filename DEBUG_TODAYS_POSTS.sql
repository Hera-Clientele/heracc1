-- Debug script to check today's posts data
-- This will help us understand why the top posts query is returning 0 results

-- 1. Check current date in EST
SELECT 
  'Current Date EST' as label,
  CURRENT_DATE AT TIME ZONE 'America/New_York' as date_value,
  NOW() AT TIME ZONE 'America/New_York' as current_time_est;

-- 2. Check what posts exist for today in latest_snapshots
SELECT 
  'Today Posts Count' as label,
  COUNT(*) as post_count,
  MIN(created_at) as earliest_post,
  MAX(created_at) as latest_post
FROM latest_snapshots 
WHERE created_at >= CURRENT_DATE AT TIME ZONE 'America/New_York'
  AND created_at < (CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE 'America/New_York'
  AND client_id = 1;

-- 3. Check what posts exist for yesterday in latest_snapshots
SELECT 
  'Yesterday Posts Count' as label,
  COUNT(*) as post_count,
  MIN(created_at) as earliest_post,
  MAX(created_at) as latest_post
FROM latest_snapshots 
WHERE created_at >= (CURRENT_DATE - INTERVAL '1 day') AT TIME ZONE 'America/New_York'
  AND created_at < CURRENT_DATE AT TIME ZONE 'America/New_York'
  AND client_id = 1;

-- 4. Check recent posts to see the date pattern
SELECT 
  'Recent Posts Sample' as label,
  video_id,
  username,
  created_at,
  created_at AT TIME ZONE 'America/New_York' as created_at_est,
  views
FROM latest_snapshots 
WHERE client_id = 1
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check if materialized view has today's data
SELECT 
  'MV Today Data' as label,
  period,
  COUNT(*) as post_count,
  MIN(created_at) as earliest_post,
  MAX(created_at) as latest_post
FROM mv_tiktok_top_posts_enhanced 
WHERE client_id = 1 AND period = 'today';

-- 6. Check if materialized view has yesterday's data
SELECT 
  'MV Yesterday Data' as label,
  period,
  COUNT(*) as post_count,
  MIN(created_at) as earliest_post,
  MAX(created_at) as latest_post
FROM mv_tiktok_top_posts_enhanced 
WHERE client_id = 1 AND period = 'yesterday'; 