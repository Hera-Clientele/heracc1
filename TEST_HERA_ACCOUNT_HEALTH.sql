-- Test query to verify data in hera_account_health table
-- This will help us understand what data is available for the frontend

-- Check the structure of the table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'hera_account_health' 
ORDER BY ordinal_position;

-- Check sample data for TikTok accounts
SELECT 
  account_id,
  platform,
  username,
  client_id,
  views_7d_avg,
  views_yesterday,
  engagement_rate,
  total_followers,
  follower_growth_7d,
  shadowban_flag,
  failed_post_streak,
  last_successful_post
FROM hera_account_health 
WHERE platform = 'tiktok' 
  AND client_id = 1
LIMIT 5;

-- Check sample data for Instagram accounts
SELECT 
  account_id,
  platform,
  username,
  client_id,
  views_7d_avg,
  views_yesterday,
  engagement_rate,
  total_followers,
  follower_growth_7d,
  shadowban_flag,
  failed_post_streak,
  last_successful_post
FROM hera_account_health 
WHERE platform = 'instagram' 
  AND client_id = 1
LIMIT 5;

-- Check total counts by platform
SELECT 
  platform,
  COUNT(*) as total_accounts,
  COUNT(CASE WHEN views_7d_avg > 0 THEN 1 END) as accounts_with_views,
  COUNT(CASE WHEN shadowban_flag = true THEN 1 END) as shadowbanned_accounts,
  COUNT(CASE WHEN failed_post_streak > 0 THEN 1 END) as accounts_with_failed_posts
FROM hera_account_health 
WHERE client_id = 1
GROUP BY platform;

-- Check for any NULL values that might cause issues
SELECT 
  platform,
  username,
  views_7d_avg,
  views_yesterday,
  engagement_rate,
  total_followers,
  follower_growth_7d,
  shadowban_flag,
  failed_post_streak,
  last_successful_post
FROM hera_account_health 
WHERE client_id = 1
  AND (
    views_7d_avg IS NULL OR
    views_yesterday IS NULL OR
    engagement_rate IS NULL OR
    total_followers IS NULL OR
    follower_growth_7d IS NULL OR
    shadowban_flag IS NULL OR
    failed_post_streak IS NULL
  )
LIMIT 10; 