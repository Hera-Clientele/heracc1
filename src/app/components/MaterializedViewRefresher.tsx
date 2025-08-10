'use client';

import { useEffect, useState } from 'react';

interface MaterializedViewRefresherProps {
  refreshOnLoad?: boolean;
  refreshInterval?: number; // in minutes
  autoRefresh?: boolean;
  showStatus?: boolean;
  onRefreshComplete?: (result: any) => void;
}

export default function MaterializedViewRefresher({
  refreshOnLoad = false,
  refreshInterval = 0, // 0 means no interval refresh
  autoRefresh = false,
  showStatus = false,
  onRefreshComplete
}: MaterializedViewRefresherProps) {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshMaterializedViews = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/refresh-account-health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        setRefreshStatus(result);
        setLastRefresh(new Date());
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

  // Refresh on page load if enabled
  useEffect(() => {
    if (refreshOnLoad) {
      refreshMaterializedViews();
    }
  }, [refreshOnLoad]);

  // Auto-refresh at intervals if enabled
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshMaterializedViews();
      }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Manual refresh function
  const handleManualRefresh = () => {
    refreshMaterializedViews();
  };

  if (!showStatus && !refreshOnLoad && !autoRefresh) {
    return null; // Don't render anything if no features are enabled
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">Materialized Views</h3>
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

          {autoRefresh && refreshInterval > 0 && (
            <p className="text-sm text-slate-400">
              Auto-refresh every {refreshInterval} minute{refreshInterval !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
} 