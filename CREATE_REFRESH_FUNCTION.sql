-- Create a function to refresh materialized views
-- This function can be called from the API to refresh all materialized views

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS TABLE(
  view_name TEXT,
  status TEXT,
  message TEXT,
  refresh_time TIMESTAMP
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  view_record RECORD;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
BEGIN
  -- Create a temporary table to store results
  CREATE TEMP TABLE IF NOT EXISTS refresh_results (
    view_name TEXT,
    status TEXT,
    message TEXT,
    refresh_time TIMESTAMP
  );
  
  -- Clear previous results
  DELETE FROM refresh_results;
  
  -- List of materialized views to refresh
  FOR view_record IN 
    SELECT unnest(ARRAY[
      'public.hera_account_health',
      'public.mv_tiktok_top_posts_enhanced',
      'public.mv_instagram_daily_totals', 
      'public.mv_tiktok_daily_totals',
      'public.mv_instagram_top_posts_enhanced'
    ]) AS view_name
  LOOP
    start_time := clock_timestamp();
    
    BEGIN
      -- Try to refresh with CONCURRENTLY first
      EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY ' || view_record.view_name;
      end_time := clock_timestamp();
      
      INSERT INTO refresh_results VALUES (
        view_record.view_name,
        'SUCCESS',
        'Refreshed with CONCURRENTLY',
        end_time
      );
      
    EXCEPTION WHEN OTHERS THEN
      -- If CONCURRENTLY fails, try regular refresh
      BEGIN
        EXECUTE 'REFRESH MATERIALIZED VIEW ' || view_record.view_name;
        end_time := clock_timestamp();
        
        INSERT INTO refresh_results VALUES (
          view_record.view_name,
          'SUCCESS',
          'Refreshed without CONCURRENTLY',
          end_time
        );
        
      EXCEPTION WHEN OTHERS THEN
        -- If both fail, record the error
        end_time := clock_timestamp();
        
        INSERT INTO refresh_results VALUES (
          view_record.view_name,
          'ERROR',
          SQLERRM,
          end_time
        );
      END;
    END;
    
    -- Small delay between refreshes
    PERFORM pg_sleep(0.5);
  END LOOP;
  
  -- Return the results
  RETURN QUERY SELECT * FROM refresh_results ORDER BY view_name;
  
  -- Clean up
  DROP TABLE IF EXISTS refresh_results;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_all_materialized_views() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_materialized_views() TO anon;

-- Test the function
-- SELECT * FROM refresh_all_materialized_views(); 