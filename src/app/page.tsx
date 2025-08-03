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
import InstagramAccountsCard from './components/InstagramAccountsCard';
import UnifiedAccountsCard from './components/UnifiedAccountsCard';
import PlatformSelector, { Platform } from './components/PlatformSelector';
import ClientSelector from './components/ClientSelector';
import ContentQueueCard from './components/ContentQueueCard';
import TodayPostsCard from './components/TodayPostsCard';
import type { Row } from './lib/fetchDailyAgg';
import type { AccountWithViews } from './lib/fetchAccountsWithViews';
import { createClient } from '@supabase/supabase-js';
import { fetchInstagramDailyAgg } from './lib/fetchInstagramDailyAgg';
import InstagramWeeklyStats from './components/InstagramWeeklyStats';
import TikTokWeeklyStats from './components/TikTokWeeklyStats';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Filter data based on date range
function filterDataByDateRange(data: any[], startDate: string, endDate: string): any[] {
  if (!startDate || !endDate) return data;
  
  const start = dayjs(startDate).tz('America/New_York');
  const end = dayjs(endDate).tz('America/New_York');
  
  return data.filter(row => {
    const rowDate = dayjs(row.day || row.date).tz('America/New_York');
    return rowDate.isAfter(start.subtract(1, 'day')) && rowDate.isBefore(end.add(1, 'day'));
  });
}

// Format date range for display
function formatDateRangeForDisplay(startDate: string, endDate: string, period: string): string {
  if (!startDate || !endDate) return 'All Time';
  
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  
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
  const [selectedClientId, setSelectedClientId] = useState<string>('1'); // Default to Katie Le (client_id: 1)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('tiktok');
  const [tiktokData, setTiktokData] = useState<Row[]>([]);
  const [tiktokAccounts, setTiktokAccounts] = useState<AccountWithViews[]>([]);
  const [instagramData, setInstagramData] = useState<any[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tiktokError, setTiktokError] = useState<string | null>(null);
  const [instagramError, setInstagramError] = useState<string | null>(null);
  const [instagramUniqueAccounts, setInstagramUniqueAccounts] = useState<number>(0);
  
  // Global date range state
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '2025-07-07',
    endDate: dayjs().tz('America/New_York').format('YYYY-MM-DD'),
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
        setFilteredAccountCount(platform === 'tiktok' ? tiktokAccounts.length : instagramUniqueAccounts);
      }
    } catch (error) {
      console.error('Error fetching account count:', error);
      // Fallback to original count
      setFilteredAccountCount(platform === 'tiktok' ? tiktokAccounts.length : instagramUniqueAccounts);
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
      setInstagramUniqueAccounts(0);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setTiktokError(null);
    setInstagramError(null);
    try {
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

  const currentData = selectedPlatform === 'tiktok' ? tiktokData : instagramData;
  const currentAccounts = selectedPlatform === 'tiktok' ? tiktokAccounts : instagramAccounts;
  const currentError = selectedPlatform === 'tiktok' ? tiktokError : instagramError;
  const platformName = selectedPlatform === 'tiktok' ? 'TikTok' : selectedPlatform === 'instagram' ? 'Instagram' : 'Scheduled Posts';
  const platformLogo = selectedPlatform === 'tiktok' ? '/tiktok-1.svg' : selectedPlatform === 'instagram' ? '/ig.svg' : '';
  const platformDescription = selectedPlatform === 'tiktok' 
    ? 'Your daily TikTok performance in one glance' 
    : selectedPlatform === 'instagram'
    ? 'Your daily Instagram performance at a glance'
    : 'Manage and monitor your scheduled content';

  // Filter data based on current date range
  const filteredData = filterDataByDateRange(currentData, dateRange.startDate, dateRange.endDate);

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
          </div>
        </header>
        
        <ClientSelector 
          selectedClientId={selectedClientId} 
          onClientChange={setSelectedClientId} 
        />
        
        <PlatformSelector 
          selectedPlatform={selectedPlatform} 
          onPlatformChange={setSelectedPlatform} 
        />
        
        {/* Content for TikTok and Instagram platforms */}
        {selectedPlatform !== 'scheduled' && (
          <>
            {/* Total Views Over Time Chart - Top of page */}
            <section className="mb-6">
              {loading ? (
                <div className="text-slate-300 py-8 text-center">Loading...</div>
              ) : currentError ? (
                <div className="text-red-400 py-8 text-center">{currentError}</div>
              ) : selectedPlatform === 'tiktok' ? (
                <TotalViewsChart data={currentData} />
              ) : (
                <InstagramTotalViewsChart data={currentData} />
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
            <section className="mb-10">
              <h3 className="text-lg font-semibold text-white mb-4">Account Performance ({dateRangeText})</h3>
              {loading ? (
                <div className="text-slate-300 py-8 text-center">Loading...</div>
              ) : currentError ? (
                <div className="text-red-400 py-8 text-center">{currentError}</div>
              ) : selectedPlatform === 'tiktok' ? (
                <StatsGrid data={filteredData} uniqueAccounts={loadingAccountCount ? 0 : filteredAccountCount} />
              ) : (
                <InstagramStatsGrid data={filteredData} uniqueAccounts={loadingAccountCount ? 0 : filteredAccountCount} />
              )}
            </section>
            
            {/* Daily Views Gained and Daily Posts Charts */}
            <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mb-10">
              {loading ? (
                <div className="text-slate-300 py-8 text-center">Loading...</div>
              ) : currentError ? (
                <div className="text-red-400 py-8 text-center">{currentError}</div>
              ) : selectedPlatform === 'tiktok' ? (
                <ViewsChart data={filteredData} />
              ) : (
                <InstagramViewsChart data={filteredData} />
              )}
            </section>
            
            {/* Weekly Statistics - Always use unfiltered data */}
            {selectedPlatform === 'tiktok' && (
              <TikTokWeeklyStats data={currentData} />
            )}
            {selectedPlatform === 'instagram' && (
              <InstagramWeeklyStats data={currentData} />
            )}
            
                    {/* Top Posts - Always use unfiltered data */}
        {selectedPlatform === 'tiktok' ? <TopPostsCard clientId={selectedClientId} /> : <InstagramTopPostsCard clientId={selectedClientId} />}
        
        {/* Accounts - Always use unfiltered data */}
        <UnifiedAccountsCard platform={selectedPlatform as 'tiktok' | 'instagram'} clientId={selectedClientId} />
      </>
    )}

    {/* Content for Scheduled Posts platform */}
    {selectedPlatform === 'scheduled' && (
      <>
        <TodayPostsCard clientId={selectedClientId} />
        <ContentQueueCard clientId={selectedClientId} />
      </>
    )}
      </div>
    </main>
  );
}

