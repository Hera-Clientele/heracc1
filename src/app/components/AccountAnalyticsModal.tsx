"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

      // Convert to array and sort by date (oldest first for chart)
      const sortedAnalytics = Array.from(dailyData.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30); // Show last 30 days

      setAnalytics(sortedAnalytics);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }

  // Prepare chart data
  const chartData = {
    labels: analytics.map(day => new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Total Views',
        data: analytics.reduce((acc: number[], day, index) => {
          const previousTotal = index > 0 ? acc[index - 1] : 0;
          acc.push(previousTotal + day.views);
          return acc;
        }, [] as number[]),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0,
        fill: true,

      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(156, 163, 175)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          maxRotation: 45
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          callback: function(value: any) {
            return value.toLocaleString();
          }
        },
        title: {
          display: true,
          text: 'Total Views',
          color: 'rgb(156, 163, 175)'
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
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
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="text-slate-300 py-8 text-center">Loading analytics...</div>
          ) : error ? (
            <div className="text-red-400 py-8 text-center">{error}</div>
          ) : analytics.length === 0 ? (
            <div className="text-slate-300 py-8 text-center">No analytics data found</div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

              {/* Charts */}
              <div className="space-y-6">
                {/* Main Combined Chart */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Total Views Over Time</h3>
                  <div className="h-80">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>

                {/* Individual Metric Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Posts Chart */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-white mb-3">Daily Posts</h4>
                    <div className="h-48">
                      <Line 
                        data={{
                          labels: chartData.labels,
                          datasets: [{
                            label: 'Posts',
                            data: analytics.map(day => day.posts),
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0,
                            fill: true
                          }]
                        }} 
                        options={{
                          ...chartOptions,
                          scales: {
                            x: chartOptions.scales.x,
                            y: {
                              ...chartOptions.scales.y,
                              display: true,
                              position: 'left',
                              title: {
                                display: true,
                                text: 'Posts',
                                color: 'rgb(156, 163, 175)'
                              }
                            }
                          }
                        }} 
                      />
                    </div>
                  </div>

                  {/* Views Chart */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-white mb-3">Daily Views</h4>
                    <div className="h-48">
                      <Line 
                        data={{
                          labels: chartData.labels,
                          datasets: [{
                            label: 'Daily Views',
                            data: analytics.map(day => day.views),
                            borderColor: 'rgb(34, 197, 94)',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            tension: 0,
                            fill: true
                          }]
                        }} 
                        options={{
                          ...chartOptions,
                          scales: {
                            x: chartOptions.scales.x,
                            y: {
                              ...chartOptions.scales.y,
                              display: true,
                              position: 'left',
                              title: {
                                display: true,
                                text: 'Daily Views',
                                color: 'rgb(156, 163, 175)'
                              }
                            }
                          }
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 