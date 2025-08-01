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
import PlatformSelector, { Platform } from './components/PlatformSelector';
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
      const response = await fetch(`/api/accounts-by-date?startDate=${startDate}&endDate=${endDate}&platform=${platform}`);
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
    setLoading(true);
    setTiktokError(null);
    setInstagramError(null);
    try {
      // Always fetch TikTok data (original functionality)
      const [tiktokAggRes, tiktokAccRes] = await Promise.all([
        fetch('/api/daily-agg', { cache: 'no-store' }),
        fetch('/api/accounts', { cache: 'no-store' })
      ]);
      
      if (!tiktokAggRes.ok || !tiktokAccRes.ok) throw new Error('Failed to fetch TikTok dashboard data');
      
      const tiktokAggData = await tiktokAggRes.json();
      const tiktokAccData = await tiktokAccRes.json();
      
      setTiktokData(tiktokAggData.data);
      setTiktokAccounts(tiktokAccData.accounts);
      
      // Fetch Instagram daily aggregates
      let instagramAggData: any[] = [];
      try {
        const res = await fetch('/api/instagram/daily-agg', { cache: 'no-store' });
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

      // Fetch unique Instagram accounts count from accounts API
      try {
        const res = await fetch('/api/instagram/accounts', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          setInstagramUniqueAccounts(json.totalAccounts || 0);
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
      supabase.channel('realtime:latest_snapshots').on('postgres_changes', { event: '*', schema: 'public', table: 'latest_snapshots' }, fetchAll),
      supabase.channel('realtime:v_daily_video').on('postgres_changes', { event: '*', schema: 'public', table: 'v_daily_video' }, fetchAll),
      supabase.channel('realtime:v_daily_video_delta').on('postgres_changes', { event: '*', schema: 'public', table: 'v_daily_video_delta' }, fetchAll),
    ];
    channels.forEach(channel => channel.subscribe());
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  // Fetch account count when date range changes
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchAccountCountForDateRange(dateRange.startDate, dateRange.endDate, selectedPlatform);
    }
  }, [dateRange, selectedPlatform]);

  const currentData = selectedPlatform === 'tiktok' ? tiktokData : instagramData;
  const currentAccounts = selectedPlatform === 'tiktok' ? tiktokAccounts : instagramAccounts;
  const currentError = selectedPlatform === 'tiktok' ? tiktokError : instagramError;
  const platformName = selectedPlatform === 'tiktok' ? 'TikTok' : 'Instagram';
  const platformLogo = selectedPlatform === 'tiktok' ? '/tiktok-1.svg' : '/ig.svg';
  const platformDescription = selectedPlatform === 'tiktok' 
    ? 'Your daily TikTok performance in one glance.' 
    : 'Your daily Instagram performance in one glance.';

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
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 drop-shadow flex items-center gap-3">
            <img src={platformLogo} alt={`${platformName} Logo`} className="h-10 w-10" />
            {platformName} Dashboard
          </h1>
          <p className="text-slate-400 text-lg">{platformDescription}</p>
        </header>
        
        <PlatformSelector 
          selectedPlatform={selectedPlatform} 
          onPlatformChange={setSelectedPlatform} 
        />
        
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
        {selectedPlatform === 'tiktok' ? <TopPostsCard /> : <InstagramTopPostsCard />}
        
        {/* Accounts - Always use unfiltered data */}
        {loading ? (
          <div className="text-slate-300 py-8 text-center">Loading...</div>
        ) : currentError ? (
          <div className="text-red-400 py-8 text-center">{currentError}</div>
        ) : selectedPlatform === 'tiktok' ? (
          <AccountsCard accounts={currentAccounts} />
        ) : (
          <InstagramAccountsCard />
        )}
      </div>
    </main>
  );
}

// Helper function to fetch unique Instagram accounts
async function fetchInstagramUniqueAccounts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return await supabase.from('v_latest_instagram').select('username').neq('username', null);
}