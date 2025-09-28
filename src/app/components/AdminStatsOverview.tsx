"use client";
import React, { useState, useEffect } from 'react';

interface AdminStatsOverviewProps {
  startDate: string;
  endDate: string;
}

interface AggregatedStats {
  period: {
    startDate: string;
    endDate: string;
  };
  totals: {
    views: number;
    posts: number;
    likes: number;
    comments: number;
    shares: number;
    accounts: number;
    clients: number;
  };
  platforms: {
    tiktok: {
      views: number;
      posts: number;
      likes: number;
      comments: number;
      shares: number;
      accounts: number;
    };
    instagram: {
      views: number;
      posts: number;
      likes: number;
      comments: number;
      shares: number;
      accounts: number;
    };
    facebook: {
      views: number;
      reach: number;
      accounts: number;
    };
  };
}

export default function AdminStatsOverview({ startDate, endDate }: AdminStatsOverviewProps) {
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      if (!startDate || !endDate) return;
      
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `/api/admin/aggregated-stats?startDate=${startDate}&endDate=${endDate}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        
        const data = await response.json();
        setStats(data.data);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 animate-pulse">
            <div className="h-6 bg-white/10 rounded mb-2"></div>
            <div className="h-8 bg-white/10 rounded mb-1"></div>
            <div className="h-4 bg-white/10 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 mb-8">
      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Total Views</h3>
          <p className="text-3xl font-bold text-blue-400">
            {stats.totals.views.toLocaleString()}
          </p>
          <p className="text-sm text-slate-400 mt-1">Across all platforms</p>
        </div>
        
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Total Posts</h3>
          <p className="text-3xl font-bold text-green-400">
            {stats.totals.posts.toLocaleString()}
          </p>
          <p className="text-sm text-slate-400 mt-1">TikTok + Instagram</p>
        </div>
        
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Total Accounts</h3>
          <p className="text-3xl font-bold text-purple-400">
            {stats.totals.accounts}
          </p>
          <p className="text-sm text-slate-400 mt-1">All platforms</p>
        </div>
        
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Active Clients</h3>
          <p className="text-3xl font-bold text-orange-400">
            {stats.totals.clients}
          </p>
          <p className="text-sm text-slate-400 mt-1">With active accounts</p>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <img src="/tiktok-1.svg" alt="TikTok" className="h-5 w-5" />
            TikTok Performance
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-300">Views:</span>
              <span className="text-green-400 font-semibold">
                {stats.platforms.tiktok.views.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Posts:</span>
              <span className="text-green-400 font-semibold">
                {stats.platforms.tiktok.posts.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Likes:</span>
              <span className="text-green-400 font-semibold">
                {stats.platforms.tiktok.likes.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Accounts:</span>
              <span className="text-green-400 font-semibold">
                {stats.platforms.tiktok.accounts}
              </span>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <img src="/ig.svg" alt="Instagram" className="h-5 w-5" />
            Instagram Performance
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-300">Views:</span>
              <span className="text-pink-400 font-semibold">
                {stats.platforms.instagram.views.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Posts:</span>
              <span className="text-pink-400 font-semibold">
                {stats.platforms.instagram.posts.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Likes:</span>
              <span className="text-pink-400 font-semibold">
                {stats.platforms.instagram.likes.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Accounts:</span>
              <span className="text-pink-400 font-semibold">
                {stats.platforms.instagram.accounts}
              </span>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <img src="/fb.png" alt="Facebook" className="h-5 w-5" />
            Facebook Performance
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-300">Views:</span>
              <span className="text-blue-400 font-semibold">
                {stats.platforms.facebook.views.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Reach:</span>
              <span className="text-blue-400 font-semibold">
                {stats.platforms.facebook.reach.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Accounts:</span>
              <span className="text-blue-400 font-semibold">
                {stats.platforms.facebook.accounts}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Engagement Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {stats.totals.likes.toLocaleString()}
            </p>
            <p className="text-sm text-slate-400">Total Likes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-cyan-400">
              {stats.totals.comments.toLocaleString()}
            </p>
            <p className="text-sm text-slate-400">Total Comments</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-400">
              {stats.totals.shares.toLocaleString()}
            </p>
            <p className="text-sm text-slate-400">Total Shares</p>
          </div>
        </div>
      </div>
    </div>
  );
}



