import { useEffect, useState, useCallback } from 'react';

interface UseMaterializedViewRefreshOptions {
  refreshOnMount?: boolean;
  refreshInterval?: number; // in minutes
  maxAgeMinutes?: number; // maximum age before refresh is needed
  silent?: boolean; // don't show console logs
}

interface RefreshResult {
  success: boolean;
  data?: any;
  error?: string;
  duration?: string;
}

export function useMaterializedViewRefresh(options: UseMaterializedViewRefreshOptions = {}) {
  const {
    refreshOnMount = false,
    refreshInterval = 0,
    maxAgeMinutes = 30,
    silent = false
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastResult, setLastResult] = useState<RefreshResult | null>(null);

  const checkDataFreshness = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/refresh-all-materialized-views', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.lastChecked) {
          const lastChecked = new Date(data.lastChecked);
          const now = new Date();
          const ageInMinutes = (now.getTime() - lastChecked.getTime()) / (1000 * 60);
          
          if (!silent) {
            console.log(`Materialized view data age: ${ageInMinutes.toFixed(1)} minutes`);
          }
          
          return ageInMinutes <= maxAgeMinutes;
        }
      }
      
      return false;
    } catch (err) {
      if (!silent) {
        console.error('Error checking data freshness:', err);
      }
      return false;
    }
  }, [maxAgeMinutes, silent]);

  const refreshMaterializedViews = useCallback(async (): Promise<RefreshResult> => {
    if (isRefreshing) {
      return { success: false, error: 'Refresh already in progress' };
    }

    setIsRefreshing(true);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch('/api/refresh-all-materialized-views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const refreshResult: RefreshResult = {
          success: true,
          data: result,
          duration: `${duration}ms`
        };
        
        setLastResult(refreshResult);
        setLastRefresh(new Date());
        
        if (!silent) {
          console.log('Materialized views refreshed successfully:', refreshResult);
        }
        
        return refreshResult;
      } else {
        const refreshResult: RefreshResult = {
          success: false,
          error: result.error || 'Failed to refresh materialized views',
          duration: `${duration}ms`
        };
        
        setLastResult(refreshResult);
        
        if (!silent) {
          console.error('Materialized view refresh failed:', refreshResult);
        }
        
        return refreshResult;
      }
    } catch (err: any) {
      const refreshResult: RefreshResult = {
        success: false,
        error: err.message || 'Network error during refresh'
      };
      
      setLastResult(refreshResult);
      
      if (!silent) {
        console.error('Materialized view refresh error:', err);
      }
      
      return refreshResult;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, silent]);

  // Refresh on mount if enabled
  useEffect(() => {
    if (refreshOnMount) {
      const checkAndRefresh = async () => {
        const isFresh = await checkDataFreshness();
        
        if (!isFresh) {
          if (!silent) {
            console.log('Data is stale, refreshing materialized views...');
          }
          await refreshMaterializedViews();
        } else if (!silent) {
          console.log('Data is fresh, no refresh needed');
        }
      };
      
      checkAndRefresh();
    }
  }, [refreshOnMount, checkDataFreshness, refreshMaterializedViews, silent]);

  // Auto-refresh at intervals if enabled
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(async () => {
        if (!silent) {
          console.log(`Auto-refreshing materialized views (every ${refreshInterval} minutes)`);
        }
        await refreshMaterializedViews();
      }, refreshInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, refreshMaterializedViews, silent]);

  return {
    isRefreshing,
    lastRefresh,
    lastResult,
    refresh: refreshMaterializedViews,
    checkFreshness: checkDataFreshness
  };
} 