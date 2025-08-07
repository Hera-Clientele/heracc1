-- Essential Database Indexes for Performance Optimization
-- Run these commands in your Supabase SQL editor

-- TikTok Raw Table Indexes (Most Important)
CREATE INDEX IF NOT EXISTS idx_tiktok_raw_client_created ON tiktok_raw(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tiktok_raw_video_client ON tiktok_raw(video_id, client_id);

-- Instagram Raw Table Indexes (Most Important)
CREATE INDEX IF NOT EXISTS idx_instagram_raw_client_created ON instagram_raw(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_instagram_raw_video_client ON instagram_raw(video_id, client_id);

-- Content Queue Table Indexes
CREATE INDEX IF NOT EXISTS idx_content_queue_client ON content_queue(client_id);
CREATE INDEX IF NOT EXISTS idx_content_queue_status ON content_queue(client_id, status);

-- Accounts Table Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_client_platform ON accounts(client_id, platform);

-- Test the indexes work
-- Run this after creating indexes to verify performance:
-- EXPLAIN ANALYZE SELECT * FROM tiktok_raw WHERE client_id = 1 AND created_at >= '2025-08-01'; 