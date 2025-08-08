-- Add Unique Indexes for Concurrent Refresh
-- Run this if you already have the materialized views created

-- Add unique indexes required for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_tiktok_top_posts_unique 
ON mv_tiktok_top_posts(client_id, rank, video_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_instagram_top_posts_unique 
ON mv_instagram_top_posts(client_id, rank, video_id);

-- Verify the indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('mv_tiktok_top_posts', 'mv_instagram_top_posts')
ORDER BY tablename, indexname;

-- Test the refresh functions
SELECT refresh_tiktok_top_posts();
SELECT refresh_instagram_top_posts(); 