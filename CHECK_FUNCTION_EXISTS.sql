-- Check if the refresh function exists
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'refresh_all_materialized_views';

-- Check if the function can be called
SELECT * FROM refresh_all_materialized_views();

-- Check what materialized views exist
SELECT 
  schemaname,
  matviewname,
  matviewowner
FROM pg_matviews 
WHERE schemaname = 'public'
ORDER BY matviewname;

-- Check the structure of mv_tiktok_top_posts_enhanced
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'mv_tiktok_top_posts_enhanced'
ORDER BY ordinal_position; 