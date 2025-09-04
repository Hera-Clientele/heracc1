"use client";
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import StatsGrid from './components/StatsGrid';
import WeeklyStatsGrid from './components/WeeklyStatsGrid';
import InstagramWeeklyStatsGrid from './components/InstagramWeeklyStatsGrid';
import ViewsChart from './components/ViewsChart';
import TotalViewsChart from './components/TotalViewsChart';
import InstagramTotalViewsChart from './components/InstagramTotalViewsChart';
import DateRangeSelector, { DateRange } from './components/DateRangeSelector';
import PlatformDateRangeSelector from './components/PlatformDateRangeSelector';
import TopPostsCard from './components/TopPostsCard';
import AccountsCard from './components/AccountsCard';
import InstagramStatsGrid from './components/InstagramStatsGrid';
import InstagramViewsChart from './components/InstagramViewsChart';
import InstagramTopPostsCard from './components/InstagramTopPostsCard';
import FacebookTotalViewsChart from './components/FacebookTotalViewsChart';
import ProfileVisitsChart from './components/ProfileVisitsChart';
import MetaAnalyticsTotalViewsChart from './components/MetaAnalyticsTotalViewsChart';
import MetaAnalyticsDailyPostsChart from './components/MetaAnalyticsDailyPostsChart';
import FacebookViewsChart from './components/FacebookViewsChart';
import FacebookStatsGrid from './components/FacebookStatsGrid';
import FacebookWeeklyStats from './components/FacebookWeeklyStats';
import MetaAnalyticsStatsGrid from './components/MetaAnalyticsStatsGrid';
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
import LoginForm from './components/LoginForm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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
    case 'last_7_days':
      return 'Last 7 days';
    case 'last_30_days':
      return 'Last 30 days';
    case 'this_month':
      return 'This month';
    case 'last_month':
      return 'Last month';
    case 'last_3_months':
      return 'Last 3 months';
    case 'last_6_months':
      return 'Last 6 months';
    case 'this_year':
      return 'This year';
    case 'last_year':
      return 'Last year';
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
      return 'All time';
  }
}

export default function Page() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('1');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');
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
  
  // Global date range state for All Platforms
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = getCurrentTimeInAppTimezone();
    const last30DaysStart = now.subtract(30, 'day');
    const last30DaysEnd = now;
    return {
      startDate: last30DaysStart.format('YYYY-MM-DD'),
      endDate: last30DaysEnd.format('YYYY-MM-DD'),
      period: 'last_30_days'
    };
  });

  // Separate date ranges for each platform
  const [tiktokDateRange, setTiktokDateRange] = useState<DateRange>(() => {
    const now = getCurrentTimeInAppTimezone();
    const last30DaysStart = now.subtract(30, 'day');
    const last30DaysEnd = now;
    return {
      startDate: last30DaysStart.format('YYYY-MM-DD'),
      endDate: last30DaysEnd.format('YYYY-MM-DD'),
      period: 'last_30_days'
    };
  });

  const [instagramDateRange, setInstagramDateRange] = useState<DateRange>(() => {
    const now = getCurrentTimeInAppTimezone();
    const last30DaysStart = now.subtract(30, 'day');
    const last30DaysEnd = now;
    return {
      startDate: last30DaysStart.format('YYYY-MM-DD'),
      endDate: last30DaysEnd.format('YYYY-MM-DD'),
      period: 'last_30_days'
    };
  });

  const [facebookDateRange, setFacebookDateRange] = useState<DateRange>(() => {
    const now = getCurrentTimeInAppTimezone();
    const last30DaysStart = now.subtract(30, 'day');
    const last30DaysEnd = now;
    return {
      startDate: last30DaysStart.format('YYYY-MM-DD'),
      endDate: last30DaysEnd.format('YYYY-MM-DD'),
      period: 'last_30_days'
    };
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
    if (selectedClientId === 'all') {
      setFilteredAccountCount(0);
      return;
    }

    let startDate = '';
    let endDate = '';
    
    switch (selectedPlatform) {
      case 'tiktok':
        startDate = tiktokDateRange.startDate;
        endDate = tiktokDateRange.endDate;
        break;
      case 'instagram':
        startDate = instagramDateRange.startDate;
        endDate = instagramDateRange.endDate;
        break;
      case 'facebook':
        startDate = facebookDateRange.startDate;
        endDate = facebookDateRange.endDate;
        break;
      case 'all_platforms':
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
        break;
      default:
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
    }

    if (startDate && endDate) {
      fetchAccountCountForDateRange(startDate, endDate, selectedPlatform);
    }
  }, [tiktokDateRange, instagramDateRange, facebookDateRange, dateRange, selectedPlatform, selectedClientId]);

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

  // Filter data based on platform-specific date ranges
  const getFilteredData = (platform: string) => {
    if (loading) return [];
    
    let startDate = '';
    let endDate = '';
    
    switch (platform) {
      case 'tiktok':
        startDate = tiktokDateRange.startDate;
        endDate = tiktokDateRange.endDate;
        break;
      case 'instagram':
        startDate = instagramDateRange.startDate;
        endDate = instagramDateRange.endDate;
        break;
      case 'facebook':
        startDate = facebookDateRange.startDate;
        endDate = facebookDateRange.endDate;
        break;
      case 'all_platforms':
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
        break;
      default:
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
    }
    
    return filterDataByDateRange(safeCurrentData, startDate, endDate);
  };

  const filteredData = getFilteredData(selectedPlatform);



  const handleTiktokDateRangeChange = (newRange: DateRange) => {
    setTiktokDateRange(newRange);
  };

  const handleInstagramDateRangeChange = (newRange: DateRange) => {
    setInstagramDateRange(newRange);
  };

  const handleFacebookDateRangeChange = (newRange: DateRange) => {
    setFacebookDateRange(newRange);
  };

  // Format the date range for display based on selected platform
  const getDateRangeText = (platform: string) => {
    let startDate = '';
    let endDate = '';
    let period = '';
    
    switch (platform) {
      case 'tiktok':
        startDate = tiktokDateRange.startDate;
        endDate = tiktokDateRange.endDate;
        period = tiktokDateRange.period;
        break;
      case 'instagram':
        startDate = instagramDateRange.startDate;
        endDate = instagramDateRange.endDate;
        period = instagramDateRange.period;
        break;
      case 'facebook':
        startDate = facebookDateRange.startDate;
        endDate = facebookDateRange.endDate;
        period = facebookDateRange.period;
        break;
      case 'all_platforms':
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
        period = dateRange.period;
        break;
      default:
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
        period = dateRange.period;
    }
    
    return formatDateRangeForDisplay(startDate, endDate, period);
  };

  const dateRangeText = getDateRangeText(selectedPlatform);

  // Fetch meta analytics data for Instagram and Facebook
  const [metaAnalyticsData, setMetaAnalyticsData] = useState<any[]>([]);
  const [metaAnalyticsLoading, setMetaAnalyticsLoading] = useState(true);

  const fetchMetaAnalytics = useCallback(async () => {
    if (!selectedClientId || selectedClientId === 'all') {
      setMetaAnalyticsData([]);
      setMetaAnalyticsLoading(false);
      return;
    }

    try {
      setMetaAnalyticsLoading(true);
      const response = await fetch(`/api/meta-analytics/daily-agg?clientId=${selectedClientId}`);
      if (response.ok) {
        const result = await response.json();
        setMetaAnalyticsData(result.data || []);
      } else {
        console.error('Failed to fetch meta analytics data');
        setMetaAnalyticsData([]);
      }
    } catch (error) {
      console.error('Error fetching meta analytics data:', error);
      setMetaAnalyticsData([]);
    } finally {
      setMetaAnalyticsLoading(false);
    }
  }, [selectedClientId]);

  // Fetch meta analytics data when client changes
  useEffect(() => {
    fetchMetaAnalytics();
  }, [fetchMetaAnalytics]);

  // Calculate earliest available date from meta analytics data
  const earliestDataDate = useMemo(() => {
    if (metaAnalyticsData.length === 0) return undefined;
    
    const dates = metaAnalyticsData
      .map(row => row.date || row.day)
      .filter(date => date) // Filter out undefined/null dates
      .sort();
    
    return dates[0]; // Return the earliest date
  }, [metaAnalyticsData]);

  // Debug logging
  useEffect(() => {
    console.log('Meta Analytics Data:', {
      loading: metaAnalyticsLoading,
      count: metaAnalyticsData.length,
      sample: metaAnalyticsData[0],
      platform: selectedPlatform
    });
  }, [metaAnalyticsData, metaAnalyticsLoading, selectedPlatform]);

  // Check admin authentication on component mount
  useEffect(() => {
    const checkAdminAuth = () => {
      const isAdmin = localStorage.getItem('isAdmin') === 'true';
      setIsAdminAuthenticated(isAdmin);
    };
    
    checkAdminAuth();
  }, []);

  const handleAdminLogin = (clientId: string, model: string) => {
    // For admin access, we'll use a special client ID or check if it's admin
    // For now, let's assume admin has client ID "admin" or we can check against a special admin client
    if (clientId === 'admin' || model === 'admin') {
      localStorage.setItem('isAdmin', 'true');
      setIsAdminAuthenticated(true);
    } else {
      // Regular client - redirect to their page
      window.location.href = `/client/${clientId}`;
    }
  };

  // Show login form if not authenticated as admin
  if (!isAdminAuthenticated) {
    return <LoginForm onLogin={handleAdminLogin} />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#18181b] to-[#23272f] flex flex-col items-center py-12 font-sans">
      <div className="w-full max-w-4xl">
        <header className="mb-8 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-4">
            <div className="flex items-center gap-3">
              <img src="/hera.png" alt="Hera Logo" className="h-10 w-10" />
              <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow">
                Hera Dashboard - Admin
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <MaterializedViewsRefresher />
              <button
                onClick={() => {
                  localStorage.removeItem('isAdmin');
                  setIsAdminAuthenticated(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            </div>
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
        
        {/* Platform-specific Date Range Selectors */}
        {selectedPlatform === 'instagram' && (
          <div className="mb-6">
            <PlatformDateRangeSelector
              platform="instagram"
              onDateRangeChange={handleInstagramDateRangeChange}
              currentRange={instagramDateRange}
              earliestDataDate={earliestDataDate}
            />
          </div>
        )}
        
        {selectedPlatform === 'tiktok' && (
          <div className="mb-6">
            <PlatformDateRangeSelector
              platform="tiktok"
              onDateRangeChange={handleTiktokDateRangeChange}
              currentRange={tiktokDateRange}
              earliestDataDate={earliestDataDate}
            />
          </div>
        )}
        
        {selectedPlatform === 'facebook' && (
          <div className="mb-6">
            <PlatformDateRangeSelector
              platform="facebook"
              onDateRangeChange={handleFacebookDateRangeChange}
              currentRange={facebookDateRange}
              earliestDataDate={earliestDataDate}
            />
          </div>
        )}
        
        {selectedPlatform === 'all_platforms' && (
          <div className="mb-6">
            <PlatformDateRangeSelector
              platform="all_platforms"
              onDateRangeChange={(newRange) => setDateRange(newRange)}
              currentRange={dateRange}
              earliestDataDate={earliestDataDate}
            />
          </div>
        )}
        
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
                <TotalViewsChart data={safeCurrentData} startDate={tiktokDateRange.startDate} endDate={tiktokDateRange.endDate} />
              ) : selectedPlatform === 'instagram' ? (
                !metaAnalyticsLoading && metaAnalyticsData.length > 0 ? (
                  <>
                    <InstagramViewsChart data={metaAnalyticsData} startDate={instagramDateRange.startDate} endDate={instagramDateRange.endDate} />
                    <div className="mt-6">
                      <ProfileVisitsChart data={metaAnalyticsData} startDate={instagramDateRange.startDate} endDate={instagramDateRange.endDate} platform="instagram" />
                    </div>
                    <div className="mt-6">
                      <MetaAnalyticsDailyPostsChart data={metaAnalyticsData} startDate={instagramDateRange.startDate} endDate={instagramDateRange.endDate} platform="instagram" />
                    </div>
                  </>
                ) : (
                  <div className="text-slate-300 py-8 text-center">Loading Instagram meta analytics data...</div>
                )
              ) : selectedPlatform === 'facebook' ? (
                !metaAnalyticsLoading && metaAnalyticsData.length > 0 ? (
                  <>
                    <FacebookViewsChart data={metaAnalyticsData} startDate={facebookDateRange.startDate} endDate={facebookDateRange.endDate} />
                    <div className="mt-6">
                      <MetaAnalyticsDailyPostsChart data={metaAnalyticsData} startDate={facebookDateRange.startDate} endDate={facebookDateRange.endDate} platform="facebook" />
                    </div>
                  </>
                ) : (
                  <div className="text-slate-300 py-8 text-center">Loading Facebook meta analytics data...</div>
                )
              ) : selectedPlatform === 'all_platforms' ? (
                <AllPlatformsTotalViewsChart 
                  tiktokData={tiktokData} 
                  instagramData={instagramData} 
                  facebookData={facebookData}
                  startDate={dateRange.startDate} 
                  endDate={dateRange.endDate} 
                />
              ) : (
                <TotalViewsChart data={safeCurrentData} startDate={tiktokDateRange.startDate} endDate={tiktokDateRange.endDate} />
              )}
            </section>



            
            {/* Daily Views Gained Charts - Hidden for Instagram */}
            {selectedPlatform !== 'instagram' && (
              <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mb-10">
                {loading ? (
                  <div className="text-slate-300 py-8 text-center">Loading...</div>
                ) : currentError ? (
                  <div className="text-red-400 py-8 text-center">{currentError}</div>
                ) : selectedPlatform === 'tiktok' ? (
                  <ViewsChart data={filteredData} />
                ) : selectedPlatform === 'facebook' ? (
                  !metaAnalyticsLoading && metaAnalyticsData.length > 0 ? (
                    <>
                      <FacebookViewsChart data={metaAnalyticsData} startDate={facebookDateRange.startDate} endDate={facebookDateRange.endDate} />
                      <div className="mt-6">
                        <ProfileVisitsChart data={metaAnalyticsData} startDate={facebookDateRange.startDate} endDate={facebookDateRange.endDate} platform="facebook" />
                      </div>
                      <div className="mt-6 text-slate-300 text-center">Facebook daily posts chart moved to main section above</div>
                    </>
                  ) : (
                    <div className="text-slate-300 py-8 text-center">Loading Facebook data...</div>
                  )
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
            )}
            
            {/* Weekly Statistics - Hidden for now */}
            {/* {selectedPlatform === 'tiktok' && (
              <TikTokWeeklyStats data={safeCurrentData} />
            )}
            {selectedPlatform === 'instagram' && (
              <InstagramWeeklyStats data={safeCurrentData} />
            )} */}

            
            {/* Facebook Accounts - Only show for Facebook platform */}
            {selectedPlatform === 'facebook' && (
              <FacebookAccountsCard clientId={selectedClientId} />
            )}
            
            {/* Total Performance Chart - Show below accounts for Facebook */}
            {selectedPlatform === 'facebook' && !metaAnalyticsLoading && metaAnalyticsData.length > 0 && (
              <div className="mt-6">
                <MetaAnalyticsTotalViewsChart data={metaAnalyticsData} startDate={facebookDateRange.startDate} endDate={facebookDateRange.endDate} platform="facebook" />
              </div>
            )}
            
            {/* Top Posts - Hidden for now */}
            {/* {selectedPlatform === 'tiktok' ? <TopPostsCard clientId={selectedClientId} /> : selectedPlatform === 'instagram' ? <InstagramTopPostsCard clientId={selectedClientId} /> : null} */}
            
            {/* Accounts - Always use unfiltered data */}
            {selectedPlatform !== 'facebook' && selectedPlatform !== 'all_platforms' && (
              <UnifiedAccountsCard platform={selectedPlatform as 'tiktok' | 'instagram'} clientId={selectedClientId} />
            )}
            
            {/* Total Performance Chart - Show below accounts for Instagram */}
            {selectedPlatform === 'instagram' && !metaAnalyticsLoading && metaAnalyticsData.length > 0 && (
              <div className="mt-6">
                <MetaAnalyticsTotalViewsChart data={metaAnalyticsData} startDate={instagramDateRange.startDate} endDate={instagramDateRange.endDate} platform="instagram" />
              </div>
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

