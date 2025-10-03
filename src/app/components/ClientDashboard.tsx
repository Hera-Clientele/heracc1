"use client";
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import StatsGrid from './StatsGrid';
import WeeklyStatsGrid from './WeeklyStatsGrid';
import InstagramWeeklyStatsGrid from './InstagramWeeklyStatsGrid';
import ViewsChart from './ViewsChart';
import TotalViewsChart from './TotalViewsChart';
import InstagramTotalViewsChart from './InstagramTotalViewsChart';
import DateRangeSelector, { DateRange } from './DateRangeSelector';
import PlatformDateRangeSelector from './PlatformDateRangeSelector';
import TopPostsCard from './TopPostsCard';
import AccountsCard from './AccountsCard';
import InstagramStatsGrid from './InstagramStatsGrid';
import InstagramViewsChart from './InstagramViewsChart';
import InstagramTopPostsCard from './InstagramTopPostsCard';
import FacebookTotalViewsChart from './FacebookTotalViewsChart';
import ProfileVisitsChart from './ProfileVisitsChart';
import YouTubeSubscriberChart from './YouTubeSubscriberChart';
import MetaAnalyticsTotalViewsChart from './MetaAnalyticsTotalViewsChart';
import MetaAnalyticsDailyPostsChart from './MetaAnalyticsDailyPostsChart';
import FacebookViewsChart from './FacebookViewsChart';
import FacebookStatsGrid from './FacebookStatsGrid';
import FacebookWeeklyStats from './FacebookWeeklyStats';
import MetaAnalyticsStatsGrid from './MetaAnalyticsStatsGrid';
import FacebookAccountsCard from './FacebookAccountsCard';
import AllPlatformsTotalViewsChart from './AllPlatformsTotalViewsChart';
import AllPlatformsDailyViewsChart from './AllPlatformsDailyViewsChart';
import AllPlatformsDailyPostsChart from './AllPlatformsDailyPostsChart';
import UnifiedAccountsCard from './UnifiedAccountsCard';
import PlatformSelector, { Platform } from './PlatformSelector';
import ContentQueueCard from './ContentQueueCard';
import MaterializedViewRefresher from './MaterializedViewRefresher';
import MaterializedViewsRefresher from './AccountHealthRefresher';
import { useMaterializedViewRefresh } from '../hooks/useMaterializedViewRefresh';
import type { Row } from '../lib/fetchDailyAgg';
import type { AccountWithViews } from '../lib/fetchAccountsWithViews';
import { createClient } from '@supabase/supabase-js';
import { fetchInstagramDailyAgg } from '../lib/fetchInstagramDailyAgg';
import { fetchFacebookDailyAgg } from '../lib/fetchFacebookDailyAgg';
import { fetchMetaAnalyticsDailyAgg } from '../lib/metaAnalytics';
import { fetchAccountsWithViews } from '../lib/fetchAccountsWithViews';
import InstagramWeeklyStats from './InstagramWeeklyStats';
import TikTokWeeklyStats from './TikTokWeeklyStats';
import TimezoneDebug from './TimezoneDebug';
import { getCurrentTimeInAppTimezone } from '../lib/timezone';

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
  let getDateInAppTimezone;
  try {
    const timezoneModule = require('../lib/timezone');
    getDateInAppTimezone = timezoneModule.getDateInAppTimezone;
  } catch (error) {
    console.error('Error loading timezone functions:', error);
    return data; // Return unfiltered data if timezone functions fail
  }
  
  if (!getDateInAppTimezone) {
    return data; // Return unfiltered data if timezone function is not available
  }
  
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
  
  let getDateInAppTimezone;
  try {
    const timezoneModule = require('../lib/timezone');
    getDateInAppTimezone = timezoneModule.getDateInAppTimezone;
  } catch (error) {
    console.error('Error loading timezone functions:', error);
    return 'All Time'; // Return default if timezone functions fail
  }
  
  if (!getDateInAppTimezone) {
    return 'All Time'; // Return default if timezone function is not available
  }
  
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

interface ClientDashboardProps {
  clientId: string;
  clientName?: string;
}

export default function ClientDashboard({ clientId, clientName }: ClientDashboardProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');
  const [tiktokData, setTiktokData] = useState<Row[]>([]);
  const [tiktokAccounts, setTiktokAccounts] = useState<AccountWithViews[]>([]);
  const [instagramData, setInstagramData] = useState<any[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<any[]>([]);
  const [facebookData, setFacebookData] = useState<any[]>([]);
  const [youtubeData, setYoutubeData] = useState<Row[]>([]);
  const [youtubeRawData, setYoutubeRawData] = useState<any[]>([]);
  const [youtubeAccounts, setYoutubeAccounts] = useState<AccountWithViews[]>([]);
  const [loading, setLoading] = useState(true);
  const [tiktokError, setTiktokError] = useState<string | null>(null);
  const [instagramError, setInstagramError] = useState<string | null>(null);
  const [facebookError, setFacebookError] = useState<string | null>(null);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [instagramUniqueAccounts, setInstagramUniqueAccounts] = useState<number>(0);
  const [selectedInstagramAccounts, setSelectedInstagramAccounts] = useState<string[]>([]);
  const [instagramAccountNames, setInstagramAccountNames] = useState<string[]>([]);
  const [instagramUnfilteredData, setInstagramUnfilteredData] = useState<any[]>([]);
  
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
      const response = await fetch(`/api/accounts-by-date?startDate=${startDate}&endDate=${endDate}&platform=${platform}&clientId=${clientId}`);
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
    setLoading(true);
    setTiktokError(null);
    setInstagramError(null);
    setFacebookError(null);
    
    try {
      // Refresh all materialized views in the background
      refreshAllMaterializedViews();
      
      // Fetch TikTok data using meta analytics
      const [tiktokAggData, tiktokAccData] = await Promise.all([
        fetchMetaAnalyticsDailyAgg(clientId, 'tiktok', dateRange.startDate, dateRange.endDate).catch(() => []),
        fetchAccountsWithViews('tiktok', clientId).catch(() => [])
      ]);
      
      // Map meta analytics TikTok data to match the expected interface
      const mappedTiktokData = tiktokAggData.map(row => ({
        day: row.day,
        posts: row.total_posts || 0,
        accounts: row.total_accounts || 0,
        views: row.total_views || 0,
        likes: row.total_likes || 0,
        comments: row.total_comments || 0,
        shares: row.total_shares || 0,
        engagement_rate: 0 // This will be calculated by the component
      }));
      
      setTiktokData(mappedTiktokData);
      setTiktokAccounts(tiktokAccData);
      
      // Fetch YouTube data using meta analytics
      console.log('ClientDashboard: Fetching YouTube data for clientId:', clientId, 'dateRange:', dateRange);
      const [youtubeAggData, youtubeAccData] = await Promise.all([
        fetchMetaAnalyticsDailyAgg(clientId, 'youtube', dateRange.startDate, dateRange.endDate).catch((err) => {
          console.error('ClientDashboard: Failed to fetch YouTube meta analytics:', err);
          return [];
        }),
        fetchAccountsWithViews('youtube', clientId).catch((err) => {
          console.error('ClientDashboard: Failed to fetch YouTube accounts:', err);
          return [];
        })
      ]);
      
      console.log('ClientDashboard: YouTube data fetched:', {
        aggData: youtubeAggData.length,
        accData: youtubeAccData.length,
        sampleAgg: youtubeAggData[0],
        sampleAcc: youtubeAccData[0]
      });
      
      // Map meta analytics YouTube data to match the expected interface
      const mappedYoutubeData = youtubeAggData.map(row => ({
        day: row.day,
        posts: row.total_posts || 0,
        accounts: row.total_accounts || 0,
        views: row.total_views || 0,
        likes: row.total_likes || 0,
        comments: row.total_comments || 0,
        shares: row.total_shares || 0,
        subs_gained: row.total_yt_subs_gained || 0,
        subs_lost: row.total_yt_subs_lost || 0,
        net_subs: (row.total_yt_subs_gained || 0) - (row.total_yt_subs_lost || 0),
        engagement_rate: 0 // This will be calculated by the component
      }));
      
      setYoutubeData(mappedYoutubeData);
      setYoutubeRawData(youtubeAggData); // Store raw materialized view data
      setYoutubeAccounts(youtubeAccData);
      
      // Debug the raw YouTube data
      console.log('ClientDashboard: YouTube raw data stored:', {
        count: youtubeAggData.length,
        sample: youtubeAggData[0],
        hasTotalYtSubsGained: youtubeAggData[0]?.total_yt_subs_gained !== undefined,
        hasTotalYtSubsLost: youtubeAggData[0]?.total_yt_subs_lost !== undefined,
        totalYtSubsGainedValue: youtubeAggData[0]?.total_yt_subs_gained,
        totalYtSubsLostValue: youtubeAggData[0]?.total_yt_subs_lost,
        allFields: Object.keys(youtubeAggData[0] || {})
      });
      
      // Fetch Instagram daily aggregates
      let instagramAggData: any[] = [];
      try {
        const res = await fetch(`/api/instagram/daily-agg?clientId=${clientId}`, { cache: 'no-store' });
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
        const res = await fetch(`/api/accounts?platform=instagram&clientId=${clientId}`, { cache: 'no-store' });
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

      // Fetch Instagram account names for filtering from accounts table
      try {
        const { data, error } = await supabase
          .from('accounts')
          .select('username, platform')
          .eq('client_id', parseInt(clientId))
          .eq('platform', 'instagram')
          .not('username', 'is', null)
          .order('username');
        
        if (error) {
          console.error('Error fetching Instagram account names from accounts table:', error);
          setInstagramAccountNames([]);
        } else {
        console.log('Raw data from accounts table:', data?.slice(0, 10)); // Show first 10 rows for debugging
        console.log('Total raw records:', data?.length);
        
        // Check what platforms we have
        const platforms = [...new Set(data?.map(row => row.platform).filter(Boolean) || [])];
        console.log('Platforms found:', platforms);
        
        const uniqueAccounts = [...new Set(data?.map(row => row.username).filter(Boolean) || [])];
        setInstagramAccountNames(uniqueAccounts);
        console.log('Instagram account names from accounts table:', uniqueAccounts);
        console.log('Total accounts found:', uniqueAccounts.length);
        }
      } catch (err) {
        console.error('Error fetching Instagram account names:', err);
        setInstagramAccountNames([]);
      }

      // Fetch Facebook daily aggregates
      let facebookAggData: any[] = [];
      try {
        const res = await fetch(`/api/facebook/daily-agg?clientId=${clientId}`, { cache: 'no-store' });
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

  // Function to fetch Instagram data with account filtering
  const fetchInstagramDataWithFiltering = async () => {
    if (selectedPlatform !== 'instagram') return;
    
    console.log('fetchInstagramDataWithFiltering called with:', {
      clientId,
      startDate: instagramDateRange.startDate,
      endDate: instagramDateRange.endDate,
      selectedAccounts: selectedInstagramAccounts
    });
    
    try {
      setMetaAnalyticsLoading(true);
      
      // Build URL with parameters
      const params = new URLSearchParams({
        clientId,
        platform: 'instagram',
        startDate: instagramDateRange.startDate,
        endDate: instagramDateRange.endDate
      });
      
      if (selectedInstagramAccounts.length > 0) {
        params.append('accountUsernames', JSON.stringify(selectedInstagramAccounts));
      }
      
      // Fetch filtered data
      const response = await fetch(`/api/meta-analytics/daily-agg?${params.toString()}`);
      
      if (response.ok) {
        const result = await response.json();
        const filteredData = result.data || [];
        
        console.log('Filtered data result:', { count: filteredData.length, sample: filteredData[0] });
        
        // Fetch unfiltered data for comparison if accounts are filtered
        let unfilteredData: any[] = [];
        if (selectedInstagramAccounts.length > 0) {
          const unfilteredParams = new URLSearchParams({
            clientId,
            platform: 'instagram',
            startDate: instagramDateRange.startDate,
            endDate: instagramDateRange.endDate
          });
          
          const unfilteredResponse = await fetch(`/api/meta-analytics/daily-agg?${unfilteredParams.toString()}`);
          if (unfilteredResponse.ok) {
            const unfilteredResult = await unfilteredResponse.json();
            unfilteredData = unfilteredResult.data || [];
          }
          console.log('Unfiltered data result:', { count: unfilteredData.length, sample: unfilteredData[0] });
        } else {
          // If no accounts selected, use the filtered data as unfiltered data
          unfilteredData = filteredData;
        }
        
        setMetaAnalyticsData(unfilteredData); // Use unfiltered data for charts
        setInstagramUnfilteredData(unfilteredData);
        
        console.log('Data set to state:', { count: unfilteredData.length });
      } else {
        console.error('Failed to fetch Instagram meta analytics data');
        setMetaAnalyticsData([]);
        setInstagramUnfilteredData([]);
      }
    } catch (err) {
      console.error('Error fetching Instagram data with filtering:', err);
      setMetaAnalyticsData([]);
      setInstagramUnfilteredData([]);
    } finally {
      setMetaAnalyticsLoading(false);
    }
  };

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
  }, [clientId]);

  // Fetch account count when date range changes
  useEffect(() => {
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
  }, [tiktokDateRange, instagramDateRange, facebookDateRange, dateRange, selectedPlatform, clientId]);

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

  const currentData = selectedPlatform === 'tiktok' ? tiktokData : selectedPlatform === 'instagram' ? instagramData : selectedPlatform === 'facebook' ? facebookData : selectedPlatform === 'youtube' ? youtubeData : getAggregatedData();
  // Ensure currentData is always an array - with additional safety for loading state
  const safeCurrentData = loading ? [] : (Array.isArray(currentData) ? currentData : []);
  const currentAccounts = selectedPlatform === 'tiktok' ? tiktokAccounts : selectedPlatform === 'instagram' ? instagramAccounts : selectedPlatform === 'youtube' ? youtubeAccounts : [];
  const currentError = selectedPlatform === 'tiktok' ? tiktokError : selectedPlatform === 'instagram' ? instagramError : selectedPlatform === 'facebook' ? facebookError : selectedPlatform === 'youtube' ? youtubeError : null;
  const platformName = selectedPlatform === 'tiktok' ? 'TikTok' : selectedPlatform === 'instagram' ? 'Instagram' : selectedPlatform === 'facebook' ? 'Facebook' : selectedPlatform === 'youtube' ? 'YouTube' : selectedPlatform === 'all_platforms' ? 'All Platforms' : 'Scheduled Posts';
  const platformLogo = selectedPlatform === 'tiktok' ? '/tiktok-1.svg' : selectedPlatform === 'instagram' ? '/ig.svg' : selectedPlatform === 'facebook' ? '/fb.png' : selectedPlatform === 'youtube' ? '/youtube.svg' : '';
  const platformDescription = selectedPlatform === 'tiktok' 
    ? 'Your daily TikTok performance in one glance' 
    : selectedPlatform === 'instagram'
    ? 'Your daily Instagram performance at a glance'
    : selectedPlatform === 'youtube'
    ? 'Your daily YouTube performance at a glance'
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

  const fetchMetaAnalytics = useCallback(async (platform?: 'instagram' | 'facebook') => {
    try {
      setMetaAnalyticsLoading(true);
      const url = platform 
        ? `/api/meta-analytics/daily-agg?clientId=${clientId}&platform=${platform}`
        : `/api/meta-analytics/daily-agg?clientId=${clientId}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        if (result.data && Array.isArray(result.data)) {
          setMetaAnalyticsData(result.data);
        } else {
          console.warn('Meta analytics data is empty or invalid for client:', clientId);
          setMetaAnalyticsData([]);
        }
      } else {
        console.warn('Failed to fetch meta analytics data for client:', clientId);
        setMetaAnalyticsData([]);
      }
    } catch (error) {
      console.warn('Error fetching meta analytics data for client:', clientId, error);
      setMetaAnalyticsData([]);
    } finally {
      setMetaAnalyticsLoading(false);
    }
  }, [clientId]);

  // Fetch meta analytics data when client changes (only for non-Instagram platforms)
  useEffect(() => {
    if (selectedPlatform === 'facebook') {
      fetchMetaAnalytics('facebook');
    } else if (selectedPlatform !== 'instagram') {
      fetchMetaAnalytics();
    }
  }, [fetchMetaAnalytics, selectedPlatform]);

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

  // Effect to fetch Instagram data when filtering changes or platform changes to Instagram
  useEffect(() => {
    if (selectedPlatform === 'instagram') {
      fetchInstagramDataWithFiltering();
    }
  }, [selectedInstagramAccounts, instagramDateRange, selectedPlatform, clientId]);

  // Set all accounts as selected by default when instagramAccountNames are loaded
  useEffect(() => {
    if (instagramAccountNames.length > 0 && selectedInstagramAccounts.length === 0) {
      setSelectedInstagramAccounts(instagramAccountNames);
    }
  }, [instagramAccountNames, selectedInstagramAccounts]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#18181b] to-[#23272f] flex flex-col items-center py-12 font-sans">
      <div className="w-full max-w-4xl">
        <header className="mb-8 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-4">
            <div className="flex items-center gap-3">
              <img src="/hera.png" alt="Hera Logo" className="h-10 w-10" />
              <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow">
                {clientName ? `${clientName}'s Dashboard` : 'Hera Dashboard'}
              </h1>
            </div>
            <MaterializedViewsRefresher />
          </div>
        </header>
        
        {/* Client Selector - Display Only */}
        <div className="mb-6">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-white font-medium">Client:</span>
                <span className="text-blue-400 font-semibold">{clientName || 'Unknown'}</span>
              </div>
              <div className="text-sm text-slate-400">
                Active Session
              </div>
            </div>
          </div>
        </div>
        
        <PlatformSelector 
          selectedPlatform={selectedPlatform} 
          onPlatformChange={setSelectedPlatform} 
        />
        
        {/* Instagram Account Filter */}
        {selectedPlatform === 'instagram' && instagramAccountNames.length > 0 && (
          <div className="mb-6 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">Filter Instagram Accounts</h3>
            
            {/* Quick filter buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedInstagramAccounts(instagramAccountNames)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedInstagramAccounts.length === instagramAccountNames.length
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                All Accounts
              </button>
              <button
                onClick={() => setSelectedInstagramAccounts(instagramAccountNames.filter(acc => 
                  !['angelkatiele', 'baddiekatiele', 'funwithkatiee'].includes(acc)
                ))}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedInstagramAccounts.length > 0 && 
                  selectedInstagramAccounts.length === instagramAccountNames.length - 3 &&
                  !selectedInstagramAccounts.some(acc => ['angelkatiele', 'baddiekatiele', 'funwithkatiee'].includes(acc))
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                No Meme
              </button>
              <button
                onClick={() => setSelectedInstagramAccounts(instagramAccountNames.filter(acc => 
                  ['angelkatiele', 'baddiekatiele', 'funwithkatiee'].includes(acc)
                ))}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedInstagramAccounts.length === 3 &&
                  selectedInstagramAccounts.every(acc => ['angelkatiele', 'baddiekatiele', 'funwithkatiee'].includes(acc))
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                Meme Accounts
              </button>
            </div>

            {/* Account checkboxes in horizontal grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-48 overflow-y-auto">
              {instagramAccountNames.map(account => (
                <label key={account} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-white/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedInstagramAccounts.includes(account)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInstagramAccounts([...selectedInstagramAccounts, account]);
                      } else {
                        setSelectedInstagramAccounts(selectedInstagramAccounts.filter(acc => acc !== account));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-pink-400 font-medium text-sm truncate" title={account}>{account}</span>
                </label>
              ))}
            </div>
            
            {selectedInstagramAccounts.length > 0 && (
              <div className="mt-3 text-xs text-slate-400">
                {selectedInstagramAccounts.length} account{selectedInstagramAccounts.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        )}
        
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
        
        {selectedPlatform === 'youtube' && (
          <div className="mb-6">
            <PlatformDateRangeSelector
              platform="youtube"
              onDateRangeChange={(newRange) => setDateRange(newRange)}
              currentRange={dateRange}
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
              ) : selectedPlatform === 'instagram' ? (
                !metaAnalyticsLoading && metaAnalyticsData.length > 0 ? (
                  <>
                    <InstagramViewsChart 
                      data={metaAnalyticsData} 
                      startDate={instagramDateRange.startDate} 
                      endDate={instagramDateRange.endDate}
                      unfilteredData={instagramUnfilteredData}
                      showComparison={selectedInstagramAccounts.length > 0}
                    />
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
              ) : selectedPlatform === 'tiktok' ? (
                <TotalViewsChart data={safeCurrentData} startDate={tiktokDateRange.startDate} endDate={tiktokDateRange.endDate} />
              ) : selectedPlatform === 'youtube' ? (
                youtubeData.length > 0 ? (
                  <TotalViewsChart data={youtubeData} startDate={dateRange.startDate} endDate={dateRange.endDate} />
                ) : (
                  <div className="text-slate-300 py-8 text-center">Loading YouTube data...</div>
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
              youtubeData={youtubeData}
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
                ) : selectedPlatform === 'youtube' ? (
                  youtubeRawData.length > 0 ? (
                    <>
                      <ViewsChart data={youtubeData} startDate={dateRange.startDate} endDate={dateRange.endDate} />
                      <div className="mt-6">
                        <YouTubeSubscriberChart data={youtubeRawData} startDate={dateRange.startDate} endDate={dateRange.endDate} />
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-300 py-8 text-center">Loading YouTube data...</div>
                  )
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
              youtubeData={youtubeData}
              startDate={dateRange.startDate} 
              endDate={dateRange.endDate} 
            />
                    <AllPlatformsDailyPostsChart 
                      tiktokData={tiktokData} 
                      instagramData={instagramData} 
                      facebookData={facebookData}
                      youtubeData={youtubeData}
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
            {/* {selectedPlatform === 'instagram' && (
              <InstagramWeeklyStats data={safeCurrentData} />
            )}
            {selectedPlatform === 'tiktok' && (
              <TikTokWeeklyStats data={safeCurrentData} />
            )} */}

            {/* Facebook Accounts - Only show for Facebook platform */}
            {selectedPlatform === 'facebook' && (
              <FacebookAccountsCard clientId={clientId} />
            )}
            
            {/* Total Performance Chart - Show below accounts for Facebook */}
            {selectedPlatform === 'facebook' && !metaAnalyticsLoading && metaAnalyticsData.length > 0 && (
              <div className="mt-6">
                <MetaAnalyticsTotalViewsChart data={metaAnalyticsData} startDate={facebookDateRange.startDate} endDate={facebookDateRange.endDate} platform="facebook" />
              </div>
            )}
            
            {/* Top Posts - Hidden for now */}
            {/* {selectedPlatform === 'instagram' ? <InstagramTopPostsCard clientId={clientId} /> : selectedPlatform === 'tiktok' ? <TopPostsCard clientId={clientId} /> : null} */}
            
            {/* Accounts - Always use unfiltered data */}
            {selectedPlatform !== 'facebook' && selectedPlatform !== 'all_platforms' && (
              <UnifiedAccountsCard platform={selectedPlatform as 'instagram' | 'tiktok' | 'youtube'} clientId={clientId} />
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
          <ContentQueueCard clientId={clientId} />
        )}
      </div>
      
      {/* Timezone Debug Component */}
      <TimezoneDebug />
    </main>
  );
}
