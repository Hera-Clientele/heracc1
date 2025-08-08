'use client';

import { useEffect, useState } from 'react';

interface SmartMaterializedViewRefresherProps {
  refreshOnLoad?: boolean;
  maxAgeMinutes?: number; // Maximum age of data before refresh is needed
  showStatus?: boolean;
  onRefreshComplete?: (result: any) => void;
}

export default function SmartMaterializedViewRefresher({
  refreshOnLoad = false,
  maxAgeMinutes = 30, // Default 30 minutes
  showStatus = false,
  onRefreshComplete
}: SmartMaterializedViewRefresherProps) {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataAge, setDataAge] = useState<number | null>(null);

  const checkDataFreshness = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/refresh-all-materialized-views', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if we have recent data
        if (data.lastChecked) {
          const lastChecked = new Date(data.lastChecked);
          const now = new Date();
          const ageInMinutes = (now.getTime() - lastChecked.getTime()) / (1000 * 60);
          setDataAge(ageInMinutes);
          
          return ageInMinutes <= maxAgeMinutes;
        }
      }
      
      return false; // Assume refresh is needed if we can't determine freshness
    } catch (err) {
      console.error('Error checking data freshness:', err);
      return false;
    }
  };

  const refreshMaterializedViews = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/refresh-all-materialized-views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        setRefreshStatus(result);
        setLastRefresh(new Date());
        setDataAge(0); // Data is now fresh
        onRefreshComplete?.(result);
        console.log('Materialized views refreshed successfully:', result);
      } else {
        setError(result.error || 'Failed to refresh materialized views');
        console.error('Materialized view refresh failed:', result);
      }
    } catch (err: any) {
      setError(err.message || 'Network error during refresh');
      console.error('Materialized view refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check data freshness and refresh if needed on page load
  useEffect(() => {
    if (refreshOnLoad) {
      const checkAndRefresh = async () => {
        const isFresh = await checkDataFreshness();
        
        if (!isFresh) {
          console.log(`Data is ${dataAge?.toFixed(1)} minutes old, refreshing...`);
          await refreshMaterializedViews();
        } else {
          console.log(`Data is fresh (${dataAge?.toFixed(1)} minutes old), no refresh needed`);
        }
      };
      
      checkAndRefresh();
    }
  }, [refreshOnLoad, maxAgeMinutes]);

  // Manual refresh function
  const handleManualRefresh = () => {
    refreshMaterializedViews();
  };

  if (!showStatus && !refreshOnLoad) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">Smart Materialized Views</h3>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
        </button>
      </div>

      {showStatus && (
        <div className="space-y-2">
          {dataAge !== null && (
            <p className="text-sm text-slate-300">
              Data age: {dataAge.toFixed(1)} minutes
              {dataAge <= maxAgeMinutes && <span className="text-green-400 ml-2">✓ Fresh</span>}
              {dataAge > maxAgeMinutes && <span className="text-yellow-400 ml-2">⚠ Stale</span>}
            </p>
          )}
          
          {lastRefresh && (
            <p className="text-sm text-slate-300">
              Last refreshed: {lastRefresh.toLocaleString()}
            </p>
          )}
          
          {refreshStatus && (
            <div className="text-sm">
              <p className="text-green-400 mb-2">✓ Refresh completed successfully</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Instagram: {refreshStatus.instagram?.recordCount || 0} records</div>
                <div>TikTok: {refreshStatus.tiktok?.recordCount || 0} records</div>
                <div>Duration: {refreshStatus.duration}</div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400">
              Error: {error}
            </p>
          )}

          <p className="text-sm text-slate-400">
            Max age: {maxAgeMinutes} minutes
          </p>
        </div>
      )}
    </div>
  );
} 