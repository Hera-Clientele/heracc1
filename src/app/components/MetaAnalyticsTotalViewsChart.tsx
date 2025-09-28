'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import dayjs from 'dayjs';

interface MetaAnalyticsTotalViewsChartProps {
  data: any[];
  startDate: string;
  endDate: string;
  platform: 'instagram' | 'facebook';
}

interface ViewsTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const ViewsTooltip: React.FC<ViewsTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const date = dayjs(label as string);
    const formattedDate = date.format('MMM DD');
    
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
        <p className="text-slate-300 font-medium mb-2">{formattedDate}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value?.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const MetaAnalyticsTotalViewsChart: React.FC<MetaAnalyticsTotalViewsChartProps> = ({ data, startDate, endDate, platform }) => {
  // Filter data by date range and platform
  const filteredData = data.filter(row => {
    const rowDate = new Date(row.date || row.day);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return rowDate >= start && rowDate <= end;
  });

  // Sort by date
  const sortedData = filteredData.sort((a, b) => new Date(a.date || a.day).getTime() - new Date(b.date || b.day).getTime());

  // Transform data for the chart
  const chartData = sortedData.map(row => ({
    date: row.date || row.day,
    views: row.total_views || 0,
    reach: row.total_reach || 0,
  }));

  // Compute cumulative totals
  const cumulativeData = chartData.reduce((acc: any[], curr, idx) => {
    const prevViews = idx > 0 ? acc[idx - 1].cumulative_views : 0;
    const prevReach = idx > 0 ? acc[idx - 1].cumulative_reach : 0;
    
    acc.push({
      ...curr,
      cumulative_views: prevViews + curr.views,
      cumulative_reach: prevReach + curr.reach,
    });
    return acc;
  }, []);



  // Platform-specific colors
  const platformColors = {
    instagram: {
      views: '#E4405F', // Instagram red
      reach: '#833AB4', // Instagram purple
    },
    facebook: {
      views: '#1877F2', // Facebook blue
      reach: '#42A5F5', // Facebook light blue
    },
    youtube: {
      views: '#FF0000', // YouTube red
      reach: '#FF4444', // YouTube light red
    }
  };

  const colors = platformColors[platform as keyof typeof platformColors] || platformColors.instagram;

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {platform === 'instagram' ? 'Instagram' : 'Facebook'} Total Performance Over Time
          </h2>
          <p className="text-slate-400">
            Cumulative Views and Reach from Meta Analytics
          </p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cumulativeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              tickFormatter={(value) => dayjs(value).format('MM/DD')}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#9CA3AF"
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toString();
              }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<ViewsTooltip />} />
            
            {/* Cumulative Views Line */}
            <Line
              type="monotone"
              dataKey="cumulative_views"
              name="Total Views"
              stroke={colors.views}
              strokeWidth={3}
              dot={{ fill: colors.views, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors.views, strokeWidth: 2 }}
            />
            
            {/* Cumulative Reach Line */}
            <Line
              type="monotone"
              dataKey="cumulative_reach"
              name="Total Reach"
              stroke={colors.reach}
              strokeWidth={3}
              dot={{ fill: colors.reach, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors.reach, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors.views }}
            />
            <span className="text-slate-300 text-sm">Total Views</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors.reach }}
            />
            <span className="text-slate-300 text-sm">Total Reach</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaAnalyticsTotalViewsChart;
