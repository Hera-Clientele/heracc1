-- Check the actual structure of all materialized views
-- This will help us understand what columns are available

-- 1. Check mv_tiktok_top_posts_enhanced structure
SELECT 
  'mv_tiktok_top_posts_enhanced' as view_name,
  column_name,
  data_type,
  is_nullable,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'mv_tiktok_top_posts_enhanced'
ORDER BY ordinal_position;

-- 2. Check mv_instagram_top_posts_enhanced structure
SELECT 
  'mv_instagram_top_posts_enhanced' as view_name,
  column_name,
  data_type,
  is_nullable,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'mv_instagram_top_posts_enhanced'
ORDER BY ordinal_position;

-- 3. Check if the views exist and have data
SELECT 
  'mv_tiktok_top_posts_enhanced' as view_name,
  COUNT(*) as row_count
FROM mv_tiktok_top_posts_enhanced
UNION ALL
SELECT 
  'mv_instagram_top_posts_enhanced' as view_name,
  COUNT(*) as row_count
FROM mv_instagram_top_posts_enhanced;

-- 4. Check sample data from each view
SELECT 
  'mv_tiktok_top_posts_enhanced sample' as label,
  video_id,
  username,
  created_at,
  period,
  rank
FROM mv_tiktok_top_posts_enhanced 
WHERE client_id = 1 
LIMIT 3;

SELECT 
  'mv_instagram_top_posts_enhanced sample' as label,
  video_id,
  username,
  created_at,
  period,
  rank
FROM mv_instagram_top_posts_enhanced 
WHERE client_id = 1 
LIMIT 3; 