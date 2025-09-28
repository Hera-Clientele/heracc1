import React from 'react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';

interface MetaAnalyticsChartProps {
  data: any[];
  platform: 'instagram' | 'facebook';
  startDate?: string;
  endDate?: string;
}

function getLastUpdateTime() {
  const now = dayjs().tz('America/New_York');
  const lastUpdate = now.subtract(now.minute() % 30, 'minute').startOf('minute');
  return lastUpdate;
}

function getNextUpdateTime() {
  const lastUpdate = getLastUpdateTime();
  return lastUpdate.add(30, 'minute');
}

export default function MetaAnalyticsChart({ 
  data, 
  platform, 
  startDate, 
  endDate 
}: MetaAnalyticsChartProps) {
  // Filter data by date range if provided and ensure no future dates
  let filteredData = data;
  const currentDate = dayjs().tz('America/New_York').startOf('day');
  
  if (startDate && endDate) {
    filteredData = data.filter(row => {
      const rowDate = dayjs(row.day);
      const start = dayjs(startDate);
      const end = dayjs(endDate);
      // Only show data within the selected range and not in the future
      return rowDate.isAfter(start.subtract(1, 'day')) && 
             rowDate.isBefore(end.add(1, 'day')) && 
             rowDate.isBefore(currentDate.add(1, 'day'));
    });
  } else {
    // If no date range specified, still filter out future dates
    filteredData = data.filter(row => {
      const rowDate = dayjs(row.day);
      return rowDate.isBefore(currentDate.add(1, 'day'));
    });
  }

  // Filter by platform
  filteredData = filteredData.filter(row => row.platform === platform);

  // Ensure all fields are numbers
  const chartData = filteredData.map(row => ({
    date: row.day,
    views: Number(row.total_views),
    reach: Number(row.total_reach),
    profile_visits: Number(row.total_profile_visits),
    accounts: Number(row.total_accounts),
    active_accounts: Number(row.active_accounts),
  }));

  // Get update times
  const lastUpdate = getLastUpdateTime();
  const nextUpdate = getNextUpdateTime();

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const views = payload.find((p: any) => p.dataKey === 'views')?.value || 0;
      const reach = payload.find((p: any) => p.dataKey === 'reach')?.value || 0;
      const profileVisits = payload.find((p: any) => p.dataKey === 'profile_visits')?.value || 0;
      
      return (
        <div className="bg-slate-900/90 p-3 rounded-lg shadow text-white border border-slate-700">
          <div className="font-semibold mb-1">{dayjs(label).tz('America/New_York').format("MMMM D")}</div>
          <div className="space-y-1">
            <div>Views: <span className="text-blue-400 font-bold">{views.toLocaleString()}</span></div>
            <div>Reach: <span className="text-green-400 font-bold">{reach.toLocaleString()}</span></div>
            <div>Profile Visits: <span className="text-purple-400 font-bold">{profileVisits.toLocaleString()}</span></div>
          </div>
        </div>
      );
    }
    return null;
  };

  const platformColors = {
    instagram: {
      views: '#E4405F',
      reach: '#833AB4',
      profile_visits: '#F77737'
    },
    facebook: {
      views: '#1877F2',
      reach: '#42A5F5',
      profile_visits: '#1976D2'
    }
  };

  const colors = platformColors[platform];

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">
            {platform.charAt(0).toUpperCase() + platform.slice(1)} Daily Metrics
          </h3>
          <p className="text-slate-400 text-sm">
            Views, Reach, and Profile Visits from Meta Analytics
          </p>
        </div>
        <div className="text-xs text-slate-400 space-x-4">
          <span>Last updated: {lastUpdate.format('MMM D, h:mm A')}</span>
          <span>Next update: {nextUpdate.format('MMM D, h:mm A')}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.views} stopOpacity={0.5}/>
              <stop offset="100%" stopColor={colors.views} stopOpacity={0.15}/>
            </linearGradient>
            <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.reach} stopOpacity={0.5}/>
              <stop offset="100%" stopColor={colors.reach} stopOpacity={0.15}/>
            </linearGradient>
            <linearGradient id="colorProfileVisits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.profile_visits} stopOpacity={0.5}/>
              <stop offset="100%" stopColor={colors.profile_visits} stopOpacity={0.15}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
            tickFormatter={(date) => dayjs(date).tz('America/New_York').format("MM/DD")}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#9CA3AF' }} 
            allowDecimals={false} 
            domain={[0, 'auto']} 
            tickFormatter={tick => {
              if (tick === 0) return '';
              if (tick >= 1000000) return `${(tick / 1000000).toFixed(1)}M`;
              if (tick >= 1000) return `${(tick / 1000).toFixed(1)}K`;
              return tick.toString();
            }} 
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Views Area and Line */}
          <Area
            type="linear"
            dataKey="views"
            stroke="none"
            fill="url(#colorViews)"
          />
          <Line
            type="linear"
            dataKey="views"
            stroke={colors.views}
            strokeWidth={2}
            dot={{ fill: colors.views, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: colors.views, strokeWidth: 2 }}
          />
          
          {/* Reach Area and Line */}
          <Area
            type="linear"
            dataKey="reach"
            stroke="none"
            fill="url(#colorReach)"
          />
          <Line
            type="linear"
            dataKey="reach"
            stroke={colors.reach}
            strokeWidth={2}
            dot={{ fill: colors.reach, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: colors.reach, strokeWidth: 2 }}
          />
          
          {/* Profile Visits Area and Line */}
          <Area
            type="linear"
            dataKey="profile_visits"
            stroke="none"
            fill="url(#colorProfileVisits)"
          />
          <Line
            type="linear"
            dataKey="profile_visits"
            stroke={colors.profile_visits}
            strokeWidth={2}
            dot={{ fill: colors.profile_visits, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: colors.profile_visits, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.views }}></div>
          <span className="text-sm text-slate-300">Views</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.reach }}></div>
          <span className="text-sm text-slate-300">Reach</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.profile_visits }}></div>
          <span className="text-sm text-slate-300">Profile Visits</span>
        </div>
      </div>
    </div>
  );
}







