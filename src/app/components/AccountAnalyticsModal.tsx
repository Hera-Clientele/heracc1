"use client";
import React, { useEffect, useState } from 'react';
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
import supabase from '../lib/supabase';

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

interface AccountHealth {
  views_7d_avg: number;
  views_yesterday: number;
  engagement_rate: number;
  total_followers: number;
  follower_growth_7d: number;
  shadowban_flag: boolean;
  failed_post_streak: number;
  last_successful_post: string | null;
}



export default function AccountAnalyticsModal({ isOpen, onClose, account }: AccountAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<DailyAnalytics[]>([]);
  const [accountHealth, setAccountHealth] = useState<AccountHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30); // Default to 30 days
  const [queryTime, setQueryTime] = useState<number>(0);

  useEffect(() => {
    if (isOpen && account) {
      fetchAccountAnalytics();
      fetchAccountHealth();
    }
  }, [isOpen, account, selectedPeriod]);

  async function fetchAccountHealth() {
    try {
      setHealthLoading(true);
      console.log('Fetching account health for:', account.username, 'platform:', account.platform, 'client:', account.client_id);
      
      // Check if we have the right data structure
      if (!account.username || !account.client_id || !account.platform) {
        console.error('Missing username, platform, or client_id in account object');
        setHealthLoading(false);
        return;
      }
      
      // Use the API endpoint instead of direct Supabase call
      const response = await fetch(
        `/api/account-health?platform=${account.platform}&clientId=${account.client_id}&username=${account.username}`,
        { cache: 'no-store' }
      );
      
      if (!response.ok) {
        console.error('API error:', response.status, response.statusText);
        // Set empty health data so the UI doesn't break
        setAccountHealth({
          views_7d_avg: 0,
          views_yesterday: 0,
          engagement_rate: 0,
          total_followers: 0,
          follower_growth_7d: 0,
          shadowban_flag: false,
          failed_post_streak: 0,
          last_successful_post: null
        });
        setHealthLoading(false);
        return;
      }
      
      const result = await response.json();
      console.log('Account health API response:', result);
      
      if (result.health && result.health.length > 0) {
        // Find the specific account's health data
        const accountHealthData = result.health.find((h: any) => h.username === account.username);
        if (accountHealthData) {
          // Use the data directly from the table
          setAccountHealth({
            views_7d_avg: accountHealthData.views_7d_avg || 0,
            views_yesterday: accountHealthData.views_yesterday || 0,
            engagement_rate: accountHealthData.engagement_rate || 0,
            total_followers: accountHealthData.total_followers || 0,
            follower_growth_7d: accountHealthData.follower_growth_7d || 0,
            shadowban_flag: accountHealthData.shadowban_flag || false,
            failed_post_streak: accountHealthData.failed_post_streak || 0,
            last_successful_post: accountHealthData.last_successful_post || null
          });
        } else {
          console.log('No health data found for specific account:', account.username);
          setAccountHealth({
            views_7d_avg: 0,
            views_yesterday: 0,
            engagement_rate: 0,
            total_followers: 0,
            follower_growth_7d: 0,
            shadowban_flag: false,
            failed_post_streak: 0,
            last_successful_post: null
          });
        }
      } else {
        console.log('No account health data found');
        setAccountHealth({
          views_7d_avg: 0,
          views_yesterday: 0,
          engagement_rate: 0,
          total_followers: 0,
          follower_growth_7d: 0,
          shadowban_flag: false,
          failed_post_streak: 0,
          last_successful_post: null
        });
      }
    } catch (err) {
      console.error('Exception fetching account health:', err);
      // Set empty health data on any error
      setAccountHealth({
        views_7d_avg: 0,
        views_yesterday: 0,
        engagement_rate: 0,
        total_followers: 0,
        follower_growth_7d: 0,
        shadowban_flag: false,
        failed_post_streak: 0,
        last_successful_post: null
      });
    } finally {
      setHealthLoading(false);
    }
  }

  async function fetchAccountAnalytics() {
    try {
      setLoading(true);
      setError(null);
      const startTime = Date.now();

      let query;
      if (account.platform === 'instagram') {
        // For Instagram, query the instagram_raw table with date filtering
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - selectedPeriod);
        
        query = supabase
          .from('instagram_raw')
          .select('created_at, views, likes, comments')
          .eq('username', account.username)
          .eq('client_id', account.client_id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });
      } else {
        // For TikTok, try to use materialized views first, then fallback to filtered query
        try {
          // First try to use the enhanced materialized view for better performance
          const { data: mvData, error: mvError } = await supabase
            .from('mv_tiktok_top_posts_enhanced')
            .select('created_at, views, likes, comments')
            .eq('username', account.username)
            .eq('client_id', account.client_id)
            .in('period', ['7days', '30days', 'month', 'all'])
            .order('created_at', { ascending: false });

          if (!mvError && mvData && mvData.length > 0) {
            // Use materialized view data
            const endTime = Date.now();
            setQueryTime(endTime - startTime);
            processAnalyticsData(mvData);
            return;
          }
        } catch (mvErr) {
          console.log('Materialized view query failed, falling back to filtered query:', mvErr);
        }

        // Fallback: query latest_snapshots with date filtering
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - selectedPeriod);
        
        query = supabase
          .from('latest_snapshots')
          .select('created_at, views, likes, comments')
          .eq('username', account.username)
          .eq('client_id', account.client_id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw supabaseError;
      }

      const endTime = Date.now();
      setQueryTime(endTime - startTime);
      processAnalyticsData(data);
    } catch (err: any) {
      if (err.message.includes('timeout')) {
        setError('Query timed out. Please try a shorter date range or contact support.');
      } else {
        setError(err.message || 'Failed to fetch analytics');
      }
    } finally {
      setLoading(false);
    }
  }

  // Helper function to process analytics data
  function processAnalyticsData(data: any[]) {
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
      .slice(-selectedPeriod); // Show selected period

    setAnalytics(sortedAnalytics);
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
              Daily performance over the last {selectedPeriod} days
              {queryTime > 0 && (
                <span className="ml-2 text-green-400">
                  • Loaded in {queryTime}ms
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                Loading...
              </div>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="text-center py-8">
              <div className="text-red-400 text-lg mb-4">
                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {error}
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setError(null);
                    fetchAccountAnalytics();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => setSelectedPeriod(Math.min(selectedPeriod, 30))}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Try Shorter Range
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading analytics data...</p>
              <p className="text-slate-500 text-sm mt-2">This may take a few moments for longer date ranges</p>
            </div>
          ) : analytics.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-slate-400 text-lg mb-4">
                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                No analytics data found
              </div>
              <p className="text-slate-500 mb-4">No posts found for the selected date range.</p>
              <button
                onClick={() => setSelectedPeriod(30)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try 30 Days
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Account Health Metrics */}
              {healthLoading ? (
                <div className="text-slate-300 py-8 text-center">Loading account health...</div>
              ) : accountHealth ? (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Account Health</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-slate-400 text-sm">7-Day Avg Views</div>
                      <div className="text-2xl font-bold text-white">
                        {accountHealth.views_7d_avg?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-slate-400 text-sm">Yesterday Views</div>
                      <div className="text-2xl font-bold text-white">
                        {accountHealth.views_yesterday?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-slate-400 text-sm">Engagement Rate</div>
                      <div className="text-2xl font-bold text-white">
                        {accountHealth.engagement_rate ? `${(accountHealth.engagement_rate * 100).toFixed(2)}%` : '0%'}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-slate-400 text-sm">Total Followers</div>
                      <div className="text-2xl font-bold text-white">
                        {accountHealth.total_followers?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-slate-400 text-sm">Follower Growth (7d)</div>
                      <div className={`text-2xl font-bold ${accountHealth.follower_growth_7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {accountHealth.follower_growth_7d >= 0 ? '+' : ''}{accountHealth.follower_growth_7d?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-slate-400 text-sm">Failed Post Streak</div>
                      <div className={`text-2xl font-bold ${accountHealth.failed_post_streak > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {accountHealth.failed_post_streak || '0'}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-slate-400 text-sm">Last Successful Post</div>
                      <div className="text-2xl font-bold text-white">
                        {accountHealth.last_successful_post ? new Date(accountHealth.last_successful_post).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-slate-400 text-sm">Shadowban Status</div>
                      <div className={`text-2xl font-bold ${accountHealth.shadowban_flag ? 'text-red-400' : 'text-green-400'}`}>
                        {accountHealth.shadowban_flag ? '⚠️ Shadowbanned' : '✅ Healthy'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-300 py-8 text-center">No account health data found.</div>
              )}

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

              {/* Date Filter */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-md font-semibold text-white mb-3">Date Range</h3>
                {selectedPeriod > 60 && (
                  <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ Long date ranges may take longer to load. Consider using shorter periods for better performance.
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Last 7 Days', days: 7 },
                    { label: 'Last 14 Days', days: 14 },
                    { label: 'Last 30 Days', days: 30 },
                    { label: 'Last 60 Days', days: 60 },
                    { label: 'Last 90 Days', days: 90 }
                  ].map((period) => (
                    <button
                      key={period.days}
                      onClick={() => setSelectedPeriod(period.days)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedPeriod === period.days
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
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