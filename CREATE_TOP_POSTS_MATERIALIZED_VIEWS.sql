-- Create Materialized Views for Top Performing Posts
-- This approach handles continuous data growth efficiently

-- 1. Create TikTok Top Posts Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_tiktok_top_posts AS
WITH ranked_posts AS (
  SELECT 
    video_id,
    username,
    url,
    views,
    post_caption,
    created_at,
    client_id,
    snapshot_date,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY views DESC, created_at DESC
    ) as rank
  FROM latest_snapshots
  WHERE views > 0  -- Only include posts with views
)
SELECT 
  video_id,
  username,
  url,
  views,
  post_caption,
  created_at,
  client_id,
  snapshot_date,
  rank
FROM ranked_posts
WHERE rank <= 20  -- Store top 20 per client for flexibility
ORDER BY client_id, rank;

-- 2. Create Instagram Top Posts Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_instagram_top_posts AS
WITH ranked_posts AS (
  SELECT 
    video_id,
    username,
    url,
    views,
    post_caption,
    created_at,
    client_id,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY views DESC, created_at DESC
    ) as rank
  FROM v_latest_instagram
  WHERE views > 0  -- Only include posts with views
)
SELECT 
  video_id,
  username,
  url,
  views,
  post_caption,
  created_at,
  client_id,
  rank
FROM ranked_posts
WHERE rank <= 20  -- Store top 20 per client for flexibility
ORDER BY client_id, rank;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mv_tiktok_top_posts_client_rank 
ON mv_tiktok_top_posts(client_id, rank);

CREATE INDEX IF NOT EXISTS idx_mv_tiktok_top_posts_created_at 
ON mv_tiktok_top_posts(created_at);

CREATE INDEX IF NOT EXISTS idx_mv_instagram_top_posts_client_rank 
ON mv_instagram_top_posts(client_id, rank);

CREATE INDEX IF NOT EXISTS idx_mv_instagram_top_posts_created_at 
ON mv_instagram_top_posts(created_at);

-- 4. Create unique indexes required for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_tiktok_top_posts_unique 
ON mv_tiktok_top_posts(client_id, rank, video_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_instagram_top_posts_unique 
ON mv_instagram_top_posts(client_id, rank, video_id);

-- 5. Create refresh functions
CREATE OR REPLACE FUNCTION refresh_tiktok_top_posts()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tiktok_top_posts;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_instagram_top_posts()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_instagram_top_posts;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_all_top_posts()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tiktok_top_posts;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_instagram_top_posts;
END;
$$ LANGUAGE plpgsql;

-- 6. Initial refresh
SELECT refresh_all_top_posts();

-- 7. Example queries for the API endpoints
-- For TikTok top posts with date filtering:
/*
SELECT 
  video_id,
  username,
  url,
  views,
  post_caption,
  created_at,
  client_id,
  snapshot_date
FROM mv_tiktok_top_posts
WHERE client_id = $1
  AND created_at >= $2
  AND created_at < $3
ORDER BY rank
LIMIT 10;
*/

-- For Instagram top posts with date filtering:
/*
SELECT 
  video_id,
  username,
  url,
  views,
  post_caption,
  created_at,
  client_id
FROM mv_instagram_top_posts
WHERE client_id = $1
  AND created_at >= $2
  AND created_at < $3
ORDER BY rank
LIMIT 10;
*/ 