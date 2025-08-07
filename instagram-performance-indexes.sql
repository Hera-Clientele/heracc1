-- Instagram Performance Indexes
-- Run these in your Supabase SQL Editor for faster queries

-- Index on instagram_raw for faster daily aggregation
CREATE INDEX IF NOT EXISTS idx_instagram_raw_client_created_date 
ON instagram_raw(client_id, created_at::date);

-- Index on v_daily_instagram_delta for faster totals calculation
CREATE INDEX IF NOT EXISTS idx_v_daily_instagram_delta_client_day 
ON v_daily_instagram_delta(client_id, day);

-- Index on v_latest_instagram for faster top posts queries
CREATE INDEX IF NOT EXISTS idx_v_latest_instagram_client_views 
ON v_latest_instagram(client_id, views DESC);

-- Index on v_latest_instagram for date filtering
CREATE INDEX IF NOT EXISTS idx_v_latest_instagram_client_created 
ON v_latest_instagram(client_id, created_at);

-- Composite index for the optimized view
CREATE INDEX IF NOT EXISTS idx_instagram_totals_client_day 
ON v_instagram_totals_by_day(client_id, day); 