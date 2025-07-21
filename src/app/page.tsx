"use client";
import React, { useEffect, useState } from 'react';
import StatsGrid from './components/StatsGrid';
import ViewsChart from './components/ViewsChart';
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('tiktok');
  const [tiktokData, setTiktokData] = useState<Row[]>([]);
  const [tiktokAccounts, setTiktokAccounts] = useState<AccountWithViews[]>([]);
  const [instagramData, setInstagramData] = useState<any[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tiktokError, setTiktokError] = useState<string | null>(null);
  const [instagramError, setInstagramError] = useState<string | null>(null);

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
      
      // Try to fetch Instagram data, but don't fail if it doesn't exist yet
      try {
        const [instagramAggRes, instagramAccRes] = await Promise.all([
          fetch('/api/instagram/daily-agg', { cache: 'no-store' }),
          fetch('/api/instagram/accounts', { cache: 'no-store' })
        ]);
        
        if (instagramAggRes.ok && instagramAccRes.ok) {
          const instagramAggData = await instagramAggRes.json();
          const instagramAccData = await instagramAccRes.json();
          
          setInstagramData(instagramAggData.data || []);
          setInstagramAccounts(instagramAccData.accounts || []);
        } else {
          // Instagram data not available yet, set empty arrays
          setInstagramData([]);
          setInstagramAccounts([]);
        }
      } catch (instagramErr) {
        // Instagram data not available yet, set empty arrays
        setInstagramData([]);
        setInstagramAccounts([]);
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
      supabase.channel('realtime:latest_snapshots').on('postgres_changes', { event: '*', schema: 'public', table: 'latest_snapshots' }, fetchAll),
      supabase.channel('realtime:v_daily_video').on('postgres_changes', { event: '*', schema: 'public', table: 'v_daily_video' }, fetchAll),
      supabase.channel('realtime:v_daily_video_delta').on('postgres_changes', { event: '*', schema: 'public', table: 'v_daily_video_delta' }, fetchAll),
    ];
    channels.forEach(channel => channel.subscribe());
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const currentData = selectedPlatform === 'tiktok' ? tiktokData : instagramData;
  const currentAccounts = selectedPlatform === 'tiktok' ? tiktokAccounts : instagramAccounts;
  const currentError = selectedPlatform === 'tiktok' ? tiktokError : instagramError;
  const platformName = selectedPlatform === 'tiktok' ? 'TikTok' : 'Instagram';
  const platformLogo = selectedPlatform === 'tiktok' ? '/tiktok-1.svg' : '/instagram.svg';
  const platformDescription = selectedPlatform === 'tiktok' 
    ? 'Your daily TikTok performance at a glance' 
    : 'Your daily Instagram performance at a glance';

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
        
        <section className="mb-10">
          {loading ? (
            <div className="text-slate-300 py-8 text-center">Loading...</div>
          ) : currentError ? (
            <div className="text-red-400 py-8 text-center">{currentError}</div>
          ) : selectedPlatform === 'tiktok' ? (
            <StatsGrid data={currentData} uniqueAccounts={currentAccounts.length} />
          ) : (
            <InstagramStatsGrid data={currentData} uniqueAccounts={currentAccounts.length} />
          )}
        </section>
        
        <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {selectedPlatform === 'tiktok' ? 'Total Views Over Time' : 'Performance Over Time'}
          </h2>
          {loading ? (
            <div className="text-slate-300 py-8 text-center">Loading...</div>
          ) : currentError ? (
            <div className="text-red-400 py-8 text-center">{currentError}</div>
          ) : selectedPlatform === 'tiktok' ? (
            <ViewsChart data={currentData} />
          ) : (
            <InstagramViewsChart data={currentData} />
          )}
        </section>
        
        {selectedPlatform === 'tiktok' ? <TopPostsCard /> : <InstagramTopPostsCard />}
        
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