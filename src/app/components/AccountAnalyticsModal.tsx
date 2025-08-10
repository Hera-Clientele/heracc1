"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface AccountAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: {
    username: string;
    platform: string;
    client_id: number;
  };
}

interface DailyAnalytics {
  date: string;
  posts: number;
  views: number;
  likes: number;
  comments: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AccountAnalyticsModal({ isOpen, onClose, account }: AccountAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<DailyAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && account) {
      fetchAccountAnalytics();
    }
  }, [isOpen, account]);

  async function fetchAccountAnalytics() {
    try {
      setLoading(true);
      setError(null);

      let query;
      if (account.platform === 'instagram') {
        // For Instagram, query the instagram_raw table
        query = supabase
          .from('instagram_raw')
          .select('created_at, views, likes, comments')
          .eq('username', account.username)
          .eq('client_id', account.client_id)
          .order('created_at', { ascending: false });
      } else {
        // For TikTok, query the latest_snapshots view
        query = supabase
          .from('latest_snapshots')
          .select('created_at, views, likes, comments')
          .eq('username', account.username)
          .eq('client_id', account.client_id)
          .order('created_at', { ascending: false });
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw supabaseError;
      }

      // Group by date and aggregate
      const dailyData = new Map<string, DailyAnalytics>();
      
      data?.forEach((post: any) => {
        const date = new Date(post.created_at).toISOString().split('T')[0];
        
        if (!dailyData.has(date)) {
          dailyData.set(date, {
            date,
            posts: 0,
            views: 0,
            likes: 0,
            comments: 0
          });
        }
        
        const dayData = dailyData.get(date)!;
        dayData.posts += 1;
        dayData.views += post.views || 0;
        dayData.likes += post.likes || 0;
        dayData.comments += post.comments || 0;
      });

      // Convert to array and sort by date (newest first)
      const sortedAnalytics = Array.from(dailyData.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30); // Show last 30 days

      setAnalytics(sortedAnalytics);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Analytics for @{account.username}
            </h2>
            <p className="text-slate-400 text-sm">
              Daily performance over the last 30 days
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-slate-300 py-8 text-center">Loading analytics...</div>
          ) : error ? (
            <div className="text-red-400 py-8 text-center">{error}</div>
          ) : analytics.length === 0 ? (
            <div className="text-slate-300 py-8 text-center">No analytics data found</div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Total Posts</div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.reduce((sum, day) => sum + day.posts, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Total Views</div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.reduce((sum, day) => sum + day.views, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Total Likes</div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.reduce((sum, day) => sum + day.likes, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Total Comments</div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.reduce((sum, day) => sum + day.comments, 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Daily Analytics Table */}
              <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                <table className="w-full text-white">
                  <thead className="bg-[#27272a] border-b border-white/10">
                    <tr className="text-slate-200 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-center">Posts</th>
                      <th className="px-4 py-3 text-center">Views</th>
                      <th className="px-4 py-3 text-center">Likes</th>
                      <th className="px-4 py-3 text-center">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map((day) => (
                      <tr key={day.date} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 text-white">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3 text-center text-white">{day.posts}</td>
                        <td className="px-4 py-3 text-center text-white">{day.views.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center text-white">{day.likes.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center text-white">{day.comments.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 