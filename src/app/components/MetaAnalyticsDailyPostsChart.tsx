'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import dayjs from 'dayjs';

interface MetaAnalyticsDailyPostsChartProps {
  data: any[];
  startDate: string;
  endDate: string;
  platform: 'instagram' | 'facebook';
}

interface PostsTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const PostsTooltip: React.FC<PostsTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const date = dayjs(label as string);
    const formattedDate = date.format('MMM DD, YYYY');
    
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

const MetaAnalyticsDailyPostsChart: React.FC<MetaAnalyticsDailyPostsChartProps> = ({ data, startDate, endDate, platform }) => {
  // Debug logging to see what data we're receiving
  console.log('MetaAnalyticsDailyPostsChart received data:', {
    dataLength: data.length,
    sampleData: data[0],
    startDate,
    endDate,
    platform
  });

  // Filter data by date range and platform
  const filteredData = data.filter(row => {
    const rowDate = new Date(row.date || row.day);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return rowDate >= start && rowDate <= end && row.platform === platform;
  });

  console.log('MetaAnalyticsDailyPostsChart filtered data:', {
    filteredLength: filteredData.length,
    sampleFiltered: filteredData[0],
    hasTotalPosts: filteredData[0]?.total_posts !== undefined
  });

  // Use the daily aggregated data directly since it already has total_posts per day
  const chartData = filteredData
    .map(row => ({
      date: row.date || row.day,
      posts: Number(row.total_posts) || 0
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  console.log('Chart data:', chartData);

  // If no posts data is available, show a message
  if (chartData.length === 0 || chartData.every(item => item.posts === 0)) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {platform === 'instagram' ? 'Instagram' : 'Facebook'} Daily Posts
            </h2>
            <p className="text-slate-400">
              Daily Posts from Meta Analytics
            </p>
          </div>
        </div>
        
        <div className="h-80 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <p className="text-lg mb-2">No posts data available</p>
            <p className="text-sm">The num_posts field may not be included in the materialized view.</p>
            <p className="text-sm">Check the console for debug information.</p>
          </div>
        </div>
      </div>
    );
  }

  // Platform-specific colors
  const platformColors = {
    instagram: {
      posts: '#E4405F', // Instagram red
    },
    facebook: {
      posts: '#1877F2', // Facebook blue
    }
  };

  const colors = platformColors[platform];

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {platform === 'instagram' ? 'Instagram' : 'Facebook'} Daily Posts
          </h2>
          <p className="text-slate-400">
            Daily Posts from Meta Analytics
          </p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              tickFormatter={(value) => dayjs(value).format('MM/DD')}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#9CA3AF"
              tickFormatter={(value) => value.toLocaleString()}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<PostsTooltip />} />
            
            {/* Posts Line */}
            <Line
              type="monotone"
              dataKey="posts"
              name="Daily Posts"
              stroke={colors.posts}
              strokeWidth={3}
              dot={{ fill: colors.posts, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors.posts, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors.posts }}
            />
            <span className="text-slate-300 text-sm">Daily Posts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaAnalyticsDailyPostsChart;
