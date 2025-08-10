"use client";
import React, { useState } from 'react';

interface MaterializedViewsRefresherProps {
  className?: string;
}

export default function MaterializedViewsRefresher({ className = '' }: MaterializedViewsRefresherProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      const response = await fetch('/api/refresh-account-health', { 
        method: 'POST',
        cache: 'no-store' 
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Materialized views refreshed:', result.message);
        alert('All materialized views refreshed successfully!');
      } else {
        throw new Error(`Failed to refresh: ${response.status}`);
      }
    } catch (error) {
      console.error('Error refreshing materialized views:', error);
      alert('Failed to refresh materialized views. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };



  return (
    <div className={`flex items-center justify-center ${className}`}>
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isRefreshing
            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isRefreshing ? 'Refreshing...' : 'Refresh All Views'}
      </button>
    </div>
  );
} 