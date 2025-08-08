-- Refresh Materialized Views to Fix Today's Data Issue
-- This script refreshes the enhanced materialized views to ensure they have current data

-- Refresh TikTok enhanced materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tiktok_top_posts_enhanced;

-- Refresh Instagram enhanced materialized view  
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_instagram_top_posts_enhanced;

-- Verify the refresh worked by checking today's data
SELECT 
  'TikTok Today' as platform,
  COUNT(*) as post_count,
  MIN(created_at) as earliest_post,
  MAX(created_at) as latest_post
FROM mv_tiktok_top_posts_enhanced 
WHERE period = 'today' AND client_id = 1

UNION ALL

SELECT 
  'Instagram Today' as platform,
  COUNT(*) as post_count,
  MIN(created_at) as earliest_post,
  MAX(created_at) as latest_post
FROM mv_instagram_top_posts_enhanced 
WHERE period = 'today' AND client_id = 1;

-- Show current date in EST for reference
SELECT 
  'Current Date EST' as label,
  CURRENT_DATE AT TIME ZONE 'America/New_York' as date_value; 