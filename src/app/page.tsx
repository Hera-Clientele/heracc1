"use client";
import React, { useEffect, useState } from 'react';
import StatsGrid from './components/StatsGrid';
import WeeklyStatsGrid from './components/WeeklyStatsGrid';
import InstagramWeeklyStatsGrid from './components/InstagramWeeklyStatsGrid';
import ViewsChart from './components/ViewsChart';
import TotalViewsChart from './components/TotalViewsChart';
import InstagramTotalViewsChart from './components/InstagramTotalViewsChart';
import DateRangeSelector, { DateRange } from './components/DateRangeSelector';
import TopPostsCard from './components/TopPostsCard';
import AccountsCard from './components/AccountsCard';
import InstagramStatsGrid from './components/InstagramStatsGrid';
import InstagramViewsChart from './components/InstagramViewsChart';
import InstagramTopPostsCard from './components/InstagramTopPostsCard';
import FacebookTotalViewsChart from './components/FacebookTotalViewsChart';
import FacebookViewsChart from './components/FacebookViewsChart';
import FacebookStatsGrid from './components/FacebookStatsGrid';
import FacebookWeeklyStats from './components/FacebookWeeklyStats';
import FacebookAccountsCard from './components/FacebookAccountsCard';
import AllPlatformsTotalViewsChart from './components/AllPlatformsTotalViewsChart';
import AllPlatformsDailyViewsChart from './components/AllPlatformsDailyViewsChart';
import AllPlatformsDailyPostsChart from './components/AllPlatformsDailyPostsChart';
// InstagramAccountsCard is no longer used - using UnifiedAccountsCard instead
import UnifiedAccountsCard from './components/UnifiedAccountsCard';
import PlatformSelector, { Platform } from './components/PlatformSelector';
import ClientSelector from './components/ClientSelector';
import ContentQueueCard from './components/ContentQueueCard';
import MaterializedViewRefresher from './components/MaterializedViewRefresher';
import MaterializedViewsRefresher from './components/AccountHealthRefresher';
import { useMaterializedViewRefresh } from './hooks/useMaterializedViewRefresh';
import type { Row } from './lib/fetchDailyAgg';
import type { AccountWithViews } from './lib/fetchAccountsWithViews';
import { createClient } from '@supabase/supabase-js';
import { fetchInstagramDailyAgg } from './lib/fetchInstagramDailyAgg';
import { fetchFacebookDailyAgg } from './lib/fetchFacebookDailyAgg';
import InstagramWeeklyStats from './components/InstagramWeeklyStats';
import TikTokWeeklyStats from './components/TikTokWeeklyStats';
import TimezoneDebug from './components/TimezoneDebug';
import { getCurrentTimeInAppTimezone } from './lib/timezone';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Filter data based on date range
function filterDataByDateRange(data: any[] | null | undefined, startDate: string, endDate: string): any[] {
  // Return empty array if data is null/undefined or empty
  if (!data || !Array.isArray(data) || data.length === 0) return [];
  
  if (!startDate || !endDate) return data;
  
  // Import timezone functions here to avoid circular dependency
  const { getDateInAppTimezone } = require('./lib/timezone');
  
  const start = getDateInAppTimezone(startDate);
  const end = getDateInAppTimezone(endDate);
  
  return data.filter(row => {
    const rowDate = getDateInAppTimezone(row.day || row.date);
    return rowDate.isAfter(start.subtract(1, 'day')) && rowDate.isBefore(end.add(1, 'day'));
  });
}

// Format date range for display
function formatDateRangeForDisplay(startDate: string, endDate: string, period: string): string {
  if (!startDate || !endDate) return 'All Time';
  
  const { getDateInAppTimezone } = require('./lib/timezone');
  const start = getDateInAppTimezone(startDate);
  const end = getDateInAppTimezone(endDate);
  
  switch (period) {
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case 'this_week':
      return 'This Week';
    case 'this_month':
      return 'This Month';
    case 'this_year':
      return 'This Year';
    case 'custom_range':
      if (start.isSame(end, 'day')) {
        return start.format('MMM D, YYYY');
      }
      if (start.isSame(end, 'year')) {
        return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
      }
      return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`;
    case 'custom_single':
      return start.format('MMM D, YYYY');
    case 'all':
    default:
      return 'All Time';
  }
}

export default function Page() {
  const [selectedClientId, setSelectedClientId] = useState('1');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('tiktok');
  const [tiktokData, setTiktokData] = useState<Row[]>([]);
  const [tiktokAccounts, setTiktokAccounts] = useState<AccountWithViews[]>([]);
  const [instagramData, setInstagramData] = useState<any[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<any[]>([]);
  const [facebookData, setFacebookData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tiktokError, setTiktokError] = useState<string | null>(null);
  const [instagramError, setInstagramError] = useState<string | null>(null);
  const [facebookError, setFacebookError] = useState<string | null>(null);
  const [instagramUniqueAccounts, setInstagramUniqueAccounts] = useState<number>(0);
  
  // Materialized view refresh hook - refreshes on page load if data is stale
  const { isRefreshing, lastRefresh, refresh } = useMaterializedViewRefresh({
    refreshInterval: 60, // 1 hour in minutes
    refreshOnMount: true
  });

  // Function to refresh all materialized views
  const refreshAllMaterializedViews = async () => {
    try {
      console.log('Refreshing all materialized views...');
      const response = await fetch('/api/refresh-account-health', { 
        method: 'POST',
        cache: 'no-store' 
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('All materialized views refreshed:', result.message);
      } else {
        console.warn('Failed to refresh materialized views:', response.status);
      }
    } catch (error) {
      console.error('Error refreshing materialized views:', error);
    }
  };
  
  // Global date range state
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '2025-07-07',
            endDate: getCurrentTimeInAppTimezone().format('YYYY-MM-DD'),
    period: 'all'
  });

  // State for filtered account count
  const [filteredAccountCount, setFilteredAccountCount] = useState<number>(0);
  const [loadingAccountCount, setLoadingAccountCount] = useState(false);

  // Function to fetch account count for date range
  const fetchAccountCountForDateRange = async (startDate: string, endDate: string, platform: string) => {
    setLoadingAccountCount(true);
    try {
      const response = await fetch(`/api/accounts-by-date?startDate=${startDate}&endDate=${endDate}&platform=${platform}&clientId=${selectedClientId}`);
      if (response.ok) {
        const data = await response.json();
        setFilteredAccountCount(data.uniqueAccounts);
      } else {
        console.error('Failed to fetch account count');
        // Fallback to original count
        setFilteredAccountCount(platform === 'tiktok' ? tiktokAccounts.length : platform === 'instagram' ? instagramUniqueAccounts : platform === 'all_platforms' ? (tiktokAccounts.length + instagramUniqueAccounts) : 0);
      }
    } catch (error) {
      console.error('Error fetching account count:', error);
      // Fallback to original count
      setFilteredAccountCount(platform === 'tiktok' ? tiktokAccounts.length : platform === 'instagram' ? instagramUniqueAccounts : platform === 'all_platforms' ? (tiktokAccounts.length + instagramUniqueAccounts) : 0);
    } finally {
      setLoadingAccountCount(false);
    }
  };

  async function fetchAll() {
    if (selectedClientId === 'all') {
      // For "all clients", we'll show empty data or handle differently
      setTiktokData([]);
      setTiktokAccounts([]);
      setInstagramData([]);
      setInstagramAccounts([]);
      setFacebookData([]);
      setInstagramUniqueAccounts(0);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setTiktokError(null);
    setInstagramError(null);
    setFacebookError(null);
    
    try {
      // Refresh all materialized views in the background
      refreshAllMaterializedViews();
      
      // Fetch TikTok data using the new unified accounts API
      const [tiktokAggRes, tiktokAccRes] = await Promise.all([
        fetch(`/api/daily-agg?clientId=${selectedClientId}`, { cache: 'no-store' }),
        fetch(`/api/accounts?platform=tiktok&clientId=${selectedClientId}`, { cache: 'no-store' })
      ]);
      
      if (!tiktokAggRes.ok || !tiktokAccRes.ok) throw new Error('Failed to fetch TikTok dashboard data');
      
      const tiktokAggData = await tiktokAggRes.json();
      const tiktokAccData = await tiktokAccRes.json();
      
      setTiktokData(tiktokAggData.data);
      setTiktokAccounts(tiktokAccData.accounts);
      
      // Fetch Instagram daily aggregates
      let instagramAggData: any[] = [];
      try {
        const res = await fetch(`/api/instagram/daily-agg?clientId=${selectedClientId}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          instagramAggData = json.data || [];
          setInstagramData(instagramAggData);
        } else {
          setInstagramData([]);
        }
      } catch {
        setInstagramData([]);
      }

      // Fetch Instagram accounts using the new unified accounts API
      try {
        const res = await fetch(`/api/accounts?platform=instagram&clientId=${selectedClientId}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          setInstagramUniqueAccounts(json.accounts.length || 0);
        } else {
          setInstagramUniqueAccounts(0);
        }
      } catch {
        setInstagramUniqueAccounts(0);
      }
      setInstagramAccounts([]); // Not used for stats grid anymore

      // Fetch Facebook daily aggregates
      let facebookAggData: any[] = [];
      try {
        const res = await fetch(`/api/facebook/daily-agg?clientId=${selectedClientId}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          facebookAggData = json.data || [];
          setFacebookData(facebookAggData);
        } else {
          setFacebookData([]);
        }
      } catch {
        setFacebookData([]);
      }
    } catch (err: any) {
      setTiktokError(err.message || 'Error fetching TikTok dashboard data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // Subscribe to real-time updates for all relevant tables/views
    const channels = [
      supabase.channel('realtime:daily_agg').on('postgres_changes', { event: '*', schema: 'public', table: 'daily_agg' }, fetchAll),
      supabase.channel('realtime:accounts').on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, fetchAll),
      supabase.channel('realtime:v_daily_video').on('postgres_changes', { event: '*', schema: 'public', table: 'v_daily_video' }, fetchAll),
      supabase.channel('realtime:v_daily_video_delta').on('postgres_changes', { event: '*', schema: 'public', table: 'v_daily_video_delta' }, fetchAll),
      supabase.channel('realtime:content_queue').on('postgres_changes', { event: '*', schema: 'public', table: 'content_queue' }, fetchAll),
      supabase.channel('realtime:fb_daily_agg').on('postgres_changes', { event: '*', schema: 'public', table: 'fb_daily_agg' }, fetchAll),
    ];
    channels.forEach(channel => channel.subscribe());
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [selectedClientId]);

  // Fetch account count when date range changes
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate && selectedClientId !== 'all') {
      fetchAccountCountForDateRange(dateRange.startDate, dateRange.endDate, selectedPlatform);
    } else if (selectedClientId === 'all') {
      setFilteredAccountCount(0);
    }
  }, [dateRange, selectedPlatform, selectedClientId]);

  // Function to aggregate data from all platforms
  const getAggregatedData = () => {
    if (selectedPlatform !== 'all_platforms') return [];
    
    // Create a map to store aggregated data by date
    const aggregatedMap = new Map<string, any>();
    
    // Process TikTok data - add safety checks
    if (Array.isArray(tiktokData)) {
      tiktokData.forEach(row => {
        const day = row.day;
        if (!aggregatedMap.has(day)) {
          aggregatedMap.set(day, {
            day,
            views: 0,
            posts: 0,
            likes: 0,
            comments: 0,
            shares: 0
          });
        }
        const existing = aggregatedMap.get(day);
        existing.views += Number(row.views) || 0;
        existing.posts += Number(row.posts) || 0;
        existing.likes += Number(row.likes) || 0;
        existing.comments += Number(row.comments) || 0;
        existing.shares += Number(row.shares) || 0;
      });
    }
    
    // Process Instagram data - add safety checks
    if (Array.isArray(instagramData)) {
      instagramData.forEach(row => {
        const day = row.day;
        if (!aggregatedMap.has(day)) {
          aggregatedMap.set(day, {
            day,
            views: 0,
            posts: 0,
            likes: 0,
            comments: 0,
            shares: 0
          });
        }
        const existing = aggregatedMap.get(day);
        existing.views += Number(row.views) || 0;
        existing.posts += Number(row.posts) || 0;
        existing.likes += Number(row.likes) || 0;
        existing.comments += Number(row.comments) || 0;
        existing.shares += Number(row.shares) || 0;
      });
    }
    
    // Process Facebook data - add safety checks
    if (Array.isArray(facebookData)) {
      facebookData.forEach(row => {
        const day = row.day;
        if (!aggregatedMap.has(day)) {
          aggregatedMap.set(day, {
            day,
            views: 0,
            posts: 0,
            likes: 0,
            comments: 0,
            shares: 0
          });
        }
        const existing = aggregatedMap.get(day);
        existing.views += Number(row.video_views) || 0;
        existing.posts += 0; // Facebook posts are always 0
        existing.likes += Number(row.post_engagements) || 0; // Use engagements as likes equivalent
        existing.comments += 0; // No comments data for Facebook
        existing.shares += 0; // No shares data for Facebook
      });
    }
    
    // Convert map to array and sort by date
    return Array.from(aggregatedMap.values()).sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
  };

  const currentData = selectedPlatform === 'tiktok' ? tiktokData : selectedPlatform === 'instagram' ? instagramData : selectedPlatform === 'facebook' ? facebookData : getAggregatedData();
  // Ensure currentData is always an array - with additional safety for loading state
  const safeCurrentData = loading ? [] : (Array.isArray(currentData) ? currentData : []);
  const currentAccounts = selectedPlatform === 'tiktok' ? tiktokAccounts : selectedPlatform === 'instagram' ? instagramAccounts : [];
  const currentError = selectedPlatform === 'tiktok' ? tiktokError : selectedPlatform === 'instagram' ? instagramError : selectedPlatform === 'facebook' ? facebookError : null;
  const platformName = selectedPlatform === 'tiktok' ? 'TikTok' : selectedPlatform === 'instagram' ? 'Instagram' : selectedPlatform === 'facebook' ? 'Facebook' : selectedPlatform === 'all_platforms' ? 'All Platforms' : 'Scheduled Posts';
  const platformLogo = selectedPlatform === 'tiktok' ? '/tiktok-1.svg' : selectedPlatform === 'instagram' ? '/ig.svg' : selectedPlatform === 'facebook' ? '/fb.png' : '';
  const platformDescription = selectedPlatform === 'tiktok' 
    ? 'Your daily TikTok performance in one glance' 
    : selectedPlatform === 'instagram'
    ? 'Your daily Instagram performance at a glance'
    : selectedPlatform === 'facebook'
    ? 'Your daily Facebook performance at a glance'
    : selectedPlatform === 'all_platforms'
    ? 'Aggregated performance across all platforms'
    : 'Manage and monitor your scheduled content';

  // Filter data based on current date range - only when not loading and data is available
  const filteredData = loading ? [] : filterDataByDateRange(safeCurrentData, dateRange.startDate, dateRange.endDate);

  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  // Format the date range for display
  const dateRangeText = formatDateRangeForDisplay(dateRange.startDate, dateRange.endDate, dateRange.period);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#18181b] to-[#23272f] flex flex-col items-center py-12 font-sans">
      <div className="w-full max-w-4xl">
        <header className="mb-8 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-4">
            <div className="flex items-center gap-3">
              <img src="/hera.png" alt="Hera Logo" className="h-10 w-10" />
              <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow">
                Hera Dashboard
              </h1>
            </div>
            <MaterializedViewsRefresher />
          </div>
        </header>
        
        <div className="mb-6">
          <ClientSelector 
            selectedClientId={selectedClientId} 
            onClientChange={setSelectedClientId} 
          />
        </div>
        
        <PlatformSelector 
          selectedPlatform={selectedPlatform} 
          onPlatformChange={setSelectedPlatform} 
        />
        
        {/* Materialized View Refresher - Only show when refreshing */}
        {isRefreshing && (
          <MaterializedViewRefresher 
            showStatus={true}
            onRefreshComplete={(result) => {
              console.log('Materialized views refreshed, data should be fresh now');
            }}
          />
        )}
        
        {/* Content for TikTok, Instagram, Facebook, and All Platforms */}
        {selectedPlatform !== 'scheduled' && (
          <>
            {/* Total Views Over Time Chart - Top of page */}
            <section className="mb-6">
              {loading ? (
                <div className="text-slate-300 py-8 text-center">Loading...</div>
              ) : currentError ? (
                <div className="text-red-400 py-8 text-center">{currentError}</div>
              ) : selectedPlatform === 'tiktok' ? (
                <TotalViewsChart data={safeCurrentData} startDate={dateRange.startDate} endDate={dateRange.endDate} />
              ) : selectedPlatform === 'instagram' ? (
                <InstagramTotalViewsChart data={safeCurrentData} startDate={dateRange.startDate} endDate={dateRange.endDate} />
              ) : selectedPlatform === 'facebook' ? (
                <FacebookTotalViewsChart data={safeCurrentData} startDate={dateRange.startDate} endDate={dateRange.endDate} />
              ) : selectedPlatform === 'all_platforms' ? (
                <AllPlatformsTotalViewsChart 
                  tiktokData={tiktokData} 
                  instagramData={instagramData} 
                  facebookData={facebookData}
                  startDate={dateRange.startDate} 
                  endDate={dateRange.endDate} 
                />
              ) : (
                <TotalViewsChart data={safeCurrentData} startDate={dateRange.startDate} endDate={dateRange.endDate} />
              )}
            </section>

            {/* Date Range Selector */}
            <section className="mb-10">
              <DateRangeSelector 
                onDateRangeChange={handleDateRangeChange}
                currentRange={dateRange}
              />
            </section>
            
            {/* Account Performance - Single section with dynamic date range */}
            {selectedPlatform !== 'all_platforms' && (
              <section className="mb-10">
                <h3 className="text-lg font-semibold text-white mb-4">Account Performance ({dateRangeText})</h3>
                {loading ? (
                  <div className="text-slate-300 py-8 text-center">Loading...</div>
                ) : currentError ? (
                  <div className="text-red-400 py-8 text-center">{currentError}</div>
                ) : selectedPlatform === 'tiktok' ? (
                  <StatsGrid data={filteredData} uniqueAccounts={loadingAccountCount ? 0 : filteredAccountCount} />
                ) : selectedPlatform === 'instagram' ? (
                  <InstagramStatsGrid data={filteredData} uniqueAccounts={loadingAccountCount ? 0 : filteredAccountCount} />
                ) : selectedPlatform === 'facebook' ? (
                  <FacebookStatsGrid data={filteredData} uniqueAccounts={loadingAccountCount ? 0 : filteredAccountCount} />
                ) : (
                  <StatsGrid data={filteredData} uniqueAccounts={loadingAccountCount ? 0 : filteredAccountCount} />
                )}
              </section>
            )}
            
            {/* Daily Views Gained and Daily Posts Charts */}
            <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mb-10">
              {loading ? (
                <div className="text-slate-300 py-8 text-center">Loading...</div>
              ) : currentError ? (
                <div className="text-red-400 py-8 text-center">{currentError}</div>
              ) : selectedPlatform === 'tiktok' ? (
                <ViewsChart data={filteredData} />
              ) : selectedPlatform === 'instagram' ? (
                <InstagramViewsChart data={filteredData} />
              ) : selectedPlatform === 'facebook' ? (
                <FacebookViewsChart data={filteredData} />
              ) : selectedPlatform === 'all_platforms' ? (
                <>
                  <AllPlatformsDailyViewsChart 
                    tiktokData={tiktokData} 
                    instagramData={instagramData} 
                    facebookData={facebookData}
                    startDate={dateRange.startDate} 
                    endDate={dateRange.endDate} 
                  />
                  <AllPlatformsDailyPostsChart 
                    tiktokData={tiktokData} 
                    instagramData={instagramData} 
                    facebookData={facebookData}
                    startDate={dateRange.startDate} 
                    endDate={dateRange.endDate} 
                  />
                </>
              ) : (
                <ViewsChart data={filteredData} />
              )}
            </section>
            
            {/* Weekly Statistics - Always use unfiltered data */}
            {selectedPlatform === 'tiktok' && (
              <TikTokWeeklyStats data={safeCurrentData} />
            )}
            {selectedPlatform === 'instagram' && (
              <InstagramWeeklyStats data={safeCurrentData} />
            )}
            {selectedPlatform === 'facebook' && (
              <FacebookWeeklyStats data={safeCurrentData} />
            )}
            
            {/* Facebook Accounts - Only show for Facebook platform */}
            {selectedPlatform === 'facebook' && (
              <FacebookAccountsCard clientId={selectedClientId} />
            )}
            
            {/* Top Posts - Always use unfiltered data */}
            {selectedPlatform === 'tiktok' ? <TopPostsCard clientId={selectedClientId} /> : selectedPlatform === 'instagram' ? <InstagramTopPostsCard clientId={selectedClientId} /> : null}
            
            {/* Accounts - Always use unfiltered data */}
            {selectedPlatform !== 'facebook' && selectedPlatform !== 'all_platforms' && (
              <UnifiedAccountsCard platform={selectedPlatform as 'tiktok' | 'instagram'} clientId={selectedClientId} />
            )}
      </>
    )}

    {/* Content for Scheduled Posts platform */}
    {selectedPlatform === 'scheduled' && (
      <ContentQueueCard clientId={selectedClientId} />
    )}
      </div>
      
      {/* Timezone Debug Component */}
      <TimezoneDebug />
    </main>
  );
}

