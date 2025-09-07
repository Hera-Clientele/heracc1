-- Google Sheets Integration for Instagram/Facebook Metrics
-- Single source of truth for daily views, reach, and profile visits

-- 1. Create the main metrics table
CREATE TABLE IF NOT EXISTS google_sheets_metrics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('instagram', 'facebook')),
    account_name VARCHAR(100) NOT NULL,
    views BIGINT DEFAULT 0,
    reach BIGINT DEFAULT 0,
    profile_visits BIGINT DEFAULT 0,
    client_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of date, platform, account, and client
    UNIQUE(date, platform, account_name, client_id)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_google_sheets_metrics_date ON google_sheets_metrics(date);
CREATE INDEX IF NOT EXISTS idx_google_sheets_metrics_platform ON google_sheets_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_google_sheets_metrics_account ON google_sheets_metrics(account_name);
CREATE INDEX IF NOT EXISTS idx_google_sheets_metrics_client ON google_sheets_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_google_sheets_metrics_composite ON google_sheets_metrics(client_id, platform, date);

-- 3. Create a materialized view for daily totals (replaces mv_instagram_daily_totals)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_google_sheets_daily_totals AS
SELECT 
    date,
    platform,
    client_id,
    SUM(views) as total_views,
    SUM(reach) as total_reach,
    SUM(profile_visits) as total_profile_visits,
    COUNT(*) as total_accounts,
    COUNT(CASE WHEN views > 0 THEN 1 END) as active_accounts
FROM google_sheets_metrics
GROUP BY date, platform, client_id
ORDER BY date DESC, platform, client_id;

-- 4. Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_google_sheets_daily_totals_unique 
ON mv_google_sheets_daily_totals(date, platform, client_id);

-- 5. Create a view for account-level daily metrics
CREATE OR REPLACE VIEW v_account_daily_metrics AS
SELECT 
    date,
    platform,
    account_name,
    client_id,
    views,
    reach,
    profile_visits,
    CASE 
        WHEN reach > 0 THEN ROUND((views::DECIMAL / reach) * 100, 2)
        ELSE 0 
    END as view_to_reach_ratio,
    CASE 
        WHEN reach > 0 THEN ROUND((profile_visits::DECIMAL / reach) * 100, 2)
        ELSE 0 
    END as profile_visit_to_reach_ratio
FROM google_sheets_metrics
ORDER BY date DESC, platform, account_name;

-- 6. Create refresh function for the materialized view
CREATE OR REPLACE FUNCTION refresh_google_sheets_daily_totals()
RETURNS TEXT AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_google_sheets_daily_totals;
    RETURN 'Google Sheets daily totals refreshed successfully at ' || NOW();
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error refreshing Google Sheets daily totals: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to upsert metrics from Google Sheets
CREATE OR REPLACE FUNCTION upsert_google_sheets_metrics(
    p_date DATE,
    p_platform VARCHAR(20),
    p_account_name VARCHAR(100),
    p_views BIGINT,
    p_reach BIGINT,
    p_profile_visits BIGINT,
    p_client_id INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO google_sheets_metrics (date, platform, account_name, views, reach, profile_visits, client_id)
    VALUES (p_date, p_platform, p_account_name, p_views, p_reach, p_profile_visits, p_client_id)
    ON CONFLICT (date, platform, account_name, client_id)
    DO UPDATE SET
        views = EXCLUDED.views,
        reach = EXCLUDED.reach,
        profile_visits = EXCLUDED.profile_visits,
        updated_at = NOW();
    
    RETURN 'Metrics upserted successfully for ' || p_account_name || ' on ' || p_date;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error upserting metrics: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_google_sheets_metrics_updated_at
    BEFORE UPDATE ON google_sheets_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Insert sample data mapping for your accounts
-- Map your Google Sheets account names to client_id
INSERT INTO google_sheets_metrics (date, platform, account_name, views, reach, profile_visits, client_id) VALUES
-- Example data - replace with your actual data
('2025-01-31', 'instagram', 'katiele.fit', 520149, 300000, 15000, 1),
('2025-02-01', 'instagram', 'katiele.fit', 628172, 350000, 18000, 1),
('2025-02-16', 'instagram', 'katiele.fit', 1398026, 621524, 35775, 1)
ON CONFLICT (date, platform, account_name, client_id) DO NOTHING;

-- 10. Create RLS policies (if using RLS)
ALTER TABLE google_sheets_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own client data" ON google_sheets_metrics
    FOR SELECT USING (client_id = current_setting('app.current_client_id', true)::integer);

CREATE POLICY "Service role can manage all data" ON google_sheets_metrics
    FOR ALL USING (auth.role() = 'service_role');




