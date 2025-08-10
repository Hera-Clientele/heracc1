-- Diagnose why posts after August 3rd aren't showing up
-- This will help us understand the data structure and identify the root cause

-- 1. Check what's in tiktok_raw table for recent dates
SELECT 
  'tiktok_raw Recent Data' as label,
  COUNT(*) as total_rows,
  MIN(created_at) as earliest_created,
  MAX(created_at) as latest_created,
  MIN(snapshot_date) as earliest_snapshot,
  MAX(snapshot_date) as latest_snapshot
FROM tiktok_raw 
WHERE client_id = 1;

-- 2. Check if there are posts with created_at after August 3rd
SELECT 
  'Posts After Aug 3' as label,
  COUNT(*) as post_count,
  MIN(created_at) as earliest_post,
  MAX(created_at) as latest_post
FROM tiktok_raw 
WHERE client_id = 1 
  AND created_at >= '2025-08-04T00:00:00Z';

-- 3. Check if there are posts with snapshot_date after August 3rd
SELECT 
  'Snapshots After Aug 3' as label,
  COUNT(*) as snapshot_count,
  MIN(snapshot_date) as earliest_snapshot,
  MAX(snapshot_date) as latest_snapshot
FROM tiktok_raw 
WHERE client_id = 1 
  AND snapshot_date >= '2025-08-04T00:00:00Z';

-- 4. Look at the actual data structure for recent entries
SELECT 
  'Recent Raw Data Sample' as label,
  video_id,
  username,
  created_at,
  created_at AT TIME ZONE 'America/New_York' as created_at_est,
  snapshot_date,
  snapshot_date AT TIME ZONE 'America/New_York' as snapshot_date_est,
  views,
  client_id
FROM tiktok_raw 
WHERE client_id = 1
ORDER BY GREATEST(created_at, snapshot_date) DESC
LIMIT 20;

-- 5. Check if there are duplicate video_ids with different dates
SELECT 
  'Duplicate Video IDs' as label,
  video_id,
  COUNT(*) as duplicate_count,
  MIN(created_at) as min_created,
  MAX(created_at) as max_created,
  MIN(snapshot_date) as min_snapshot,
  MAX(snapshot_date) as max_snapshot
FROM tiktok_raw 
WHERE client_id = 1
GROUP BY video_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- 6. Check the current latest_snapshots view
SELECT 
  'Current latest_snapshots View' as label,
  COUNT(*) as total_posts,
  MIN(created_at) as earliest_post,
  MAX(created_at) as latest_post,
  MIN(snapshot_date) as earliest_snapshot,
  MAX(snapshot_date) as latest_snapshot
FROM latest_snapshots 
WHERE client_id = 1;

-- 7. Check if there's a data ingestion issue
SELECT 
  'Data Ingestion Timeline' as label,
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as posts_created,
  COUNT(DISTINCT video_id) as unique_videos
FROM tiktok_raw 
WHERE client_id = 1
  AND created_at >= '2025-08-01'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC; 