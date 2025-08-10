-- Set up automatic hourly refresh of hera_account_health materialized view
-- This requires the pg_cron extension to be enabled in Supabase

-- First, enable the pg_cron extension (if not already enabled)
-- Note: This requires superuser privileges in Supabase
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule hourly refresh of the materialized view
-- This will run every hour at the top of the hour
SELECT cron.schedule(
  'refresh-account-health-hourly',
  '0 * * * *', -- Every hour at minute 0
  'REFRESH MATERIALIZED VIEW public.hera_account_health;'
);

-- Schedule daily refresh at 2 AM (when traffic is low)
SELECT cron.schedule(
  'refresh-account-health-daily',
  '0 2 * * *', -- Daily at 2:00 AM
  'REFRESH MATERIALIZED VIEW public.hera_account_health;'
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- To remove a job if needed:
-- SELECT cron.unschedule('refresh-account-health-hourly');
-- SELECT cron.unschedule('refresh-account-health-daily'); 