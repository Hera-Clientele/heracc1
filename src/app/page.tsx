"use client";
import React, { useEffect, useState } from 'react';
import StatsGrid from './components/StatsGrid';
import ViewsChart from './components/ViewsChart';
import TopPostsCard from './components/TopPostsCard';
import AccountsCard from './components/AccountsCard';
import type { Row } from './lib/fetchDailyAgg';
import type { AccountWithViews } from './lib/fetchAccountsWithViews';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const [data, setData] = useState<Row[]>([]);
  const [accounts, setAccounts] = useState<AccountWithViews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [aggRes, accRes] = await Promise.all([
        fetch('/api/daily-agg', { cache: 'no-store' }),
        fetch('/api/accounts', { cache: 'no-store' })
      ]);
      if (!aggRes.ok || !accRes.ok) throw new Error('Failed to fetch dashboard data');
      const aggData = await aggRes.json();
      const accData = await accRes.json();
      setData(aggData.data);
      setAccounts(accData.accounts);
    } catch (err: any) {
      setError(err.message || 'Error fetching dashboard data');
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#18181b] to-[#23272f] flex flex-col items-center py-12 font-sans">
      <div className="w-full max-w-4xl">
        <header className="mb-8 flex flex-col items-center">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 drop-shadow">TikTok Dashboard</h1>
          <p className="text-slate-400 text-lg">Your daily TikTok performance at a glance</p>
        </header>
        <section className="mb-10">
          {loading ? <div className="text-slate-300 py-8 text-center">Loading...</div> : error ? <div className="text-red-400 py-8 text-center">{error}</div> : <StatsGrid data={data} uniqueAccounts={accounts.length} />}
        </section>
        <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Total Views Over Time</h2>
          {loading ? <div className="text-slate-300 py-8 text-center">Loading...</div> : error ? <div className="text-red-400 py-8 text-center">{error}</div> : <ViewsChart data={data} />}
        </section>
        <TopPostsCard />
        {loading ? <div className="text-slate-300 py-8 text-center">Loading...</div> : error ? <div className="text-red-400 py-8 text-center">{error}</div> : <AccountsCard accounts={accounts} />}
      </div>
    </main>
  );
}