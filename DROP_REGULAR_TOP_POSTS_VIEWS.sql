-- Drop Regular Top Posts Materialized Views
-- Since we now have enhanced versions with better functionality

-- 1. Drop the regular top posts materialized views
DROP MATERIALIZED VIEW IF EXISTS mv_tiktok_top_posts CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_instagram_top_posts CASCADE;

-- 2. Drop the associated indexes (they will be dropped automatically with CASCADE, but being explicit)
DROP INDEX IF EXISTS idx_mv_tiktok_top_posts_client_rank;
DROP INDEX IF EXISTS idx_mv_tiktok_top_posts_created_at;
DROP INDEX IF EXISTS idx_mv_tiktok_top_posts_unique;

DROP INDEX IF EXISTS idx_mv_instagram_top_posts_client_rank;
DROP INDEX IF EXISTS idx_mv_instagram_top_posts_created_at;
DROP INDEX IF EXISTS idx_mv_instagram_top_posts_unique;

-- 3. Drop the refresh functions for regular views
DROP FUNCTION IF EXISTS refresh_tiktok_top_posts();
DROP FUNCTION IF EXISTS refresh_instagram_top_posts();
DROP FUNCTION IF EXISTS refresh_all_top_posts();

-- 4. Verify the enhanced views still exist and are working
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE tablename IN ('mv_tiktok_top_posts_enhanced', 'mv_instagram_top_posts_enhanced')
ORDER BY tablename, indexname;

-- 5. Test the enhanced refresh functions
SELECT refresh_tiktok_top_posts_enhanced();
SELECT refresh_instagram_top_posts_enhanced();
SELECT refresh_all_top_posts_enhanced();

-- 6. Show remaining materialized views
SELECT 
    schemaname,
    matviewname,
    matviewowner
FROM pg_matviews 
WHERE schemaname = 'public'
ORDER BY matviewname; 