import React from 'react';
import dayjs from 'dayjs';

interface MetaAnalyticsStatsGridProps {
  data: any[];
  platform: 'instagram' | 'facebook';
  uniqueAccounts?: number;
  oldData?: any[]; // Add old data source for Instagram
}

export default function MetaAnalyticsStatsGrid({ data, platform, uniqueAccounts, oldData }: MetaAnalyticsStatsGridProps) {
  if (!data || data.length === 0) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
        <div className="text-center text-slate-400">
          No {platform} data available for the selected date range.
        </div>
      </div>
    );
  }

  // Filter data for the specific platform
  const platformData = data.filter(row => row.platform === platform);
  
  if (platformData.length === 0) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
        <div className="text-center text-slate-400">
          No {platform} data available for the selected date range.
        </div>
      </div>
    );
  }

  // Calculate totals from meta_analytics
  const totalViews = platformData.reduce((sum, row) => sum + (Number(row.total_views) || 0), 0);
  const totalReach = platformData.reduce((sum, row) => sum + (Number(row.total_reach) || 0), 0);
  const totalProfileVisits = platformData.reduce((sum, row) => sum + (Number(row.total_profile_visits) || 0), 0);

  // For Instagram, use old data for accounts posted, total posts, and engagement
  let accountsPosted = uniqueAccounts || 0;
  let totalPosts = 0;
  let engagement = 0;

  if ((platform === 'instagram' || platform === 'facebook') && oldData && oldData.length > 0) {
    // Calculate using the same logic as TikTok
    const totals = {
      posts: oldData.reduce((sum, r) => sum + (r.posts || 0), 0),
      views: oldData.reduce((sum, r) => sum + (r.views || 0), 0),
      likes: oldData.reduce((sum, r) => sum + (r.likes || 0), 0),
      comments: oldData.reduce((sum, r) => sum + (r.comments || 0), 0),
      shares: oldData.reduce((sum, r) => sum + (r.shares || 0), 0),
    };
    
    totalPosts = totals.posts;
    // Calculate engagement rate the same way as TikTok
    engagement = totals.views === 0 ? 0 : ((totals.likes + totals.comments + totals.shares) / totals.views) * 100;
  }

  // Get date range for display
  const dates = platformData.map(row => new Date(row.date || row.day)).sort((a, b) => a.getTime() - b.getTime());
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const platformColors = {
    instagram: {
      primary: '#E4405F',
      secondary: '#833AB4',
      accent: '#F77737'
    },
    facebook: {
      primary: '#1877F2',
      secondary: '#42A5F5',
      accent: '#1976D2'
    }
  };

  const colors = platformColors[platform];

  // For Instagram, show the combined metrics
  if (platform === 'instagram') {
    const stats = [
      {
        label: 'ACCOUNTS POSTED',
        value: accountsPosted,
        color: colors.primary
      },
      {
        label: 'TOTAL POSTS',
        value: totalPosts,
        color: colors.secondary
      },
      {
        label: 'TOTAL VIEWS',
        value: totalViews.toLocaleString(),
        color: colors.primary
      },
      {
        label: 'TOTAL REACH',
        value: totalReach.toLocaleString(),
        color: colors.secondary
      },
      {
        label: 'PROFILE VISITS',
        value: totalProfileVisits.toLocaleString(),
        color: colors.accent
      },
      {
        label: 'ENGAGEMENT %',
        value: engagement.toFixed(2),
        color: '#F59E0B'
      }
    ];

    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Instagram Performance Overview
            </h3>
            <p className="text-slate-400 text-sm">
              {startDate && endDate ? (
                `${dayjs(startDate).format('MMM D')} - ${dayjs(endDate).format('MMM D, YYYY')}`
              ) : (
                'Performance metrics from Meta Analytics'
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">{stat.label}</span>
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: stat.color }}
                ></div>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // For Facebook, show the same 6-card layout as Instagram
  if (platform === 'facebook') {
    const stats = [
      {
        label: 'ACCOUNTS POSTED',
        value: accountsPosted,
        color: colors.primary
      },
      {
        label: 'TOTAL POSTS',
        value: totalPosts,
        color: colors.secondary
      },
      {
        label: 'TOTAL VIEWS',
        value: totalViews.toLocaleString(),
        color: colors.primary
      },
      {
        label: 'TOTAL REACH',
        value: totalReach.toLocaleString(),
        color: colors.secondary
      },
      {
        label: 'PROFILE VISITS',
        value: totalProfileVisits.toLocaleString(),
        color: colors.accent
      },
      {
        label: 'ENGAGEMENT %',
        value: engagement.toFixed(2),
        color: '#F59E0B'
      }
    ];

    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Facebook Performance Overview
            </h3>
            <p className="text-slate-400 text-sm">
              {startDate && endDate ? (
                `${dayjs(startDate).format('MMM D')} - ${dayjs(endDate).format('MMM D, YYYY')}`
              ) : (
                'Performance metrics from Meta Analytics'
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">{stat.label}</span>
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: stat.color }}
                ></div>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
