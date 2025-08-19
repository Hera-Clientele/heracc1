'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

interface ProfileVisitsChartProps {
  data: any[];
  startDate: string;
  endDate: string;
  platform: 'instagram' | 'facebook'; // Add platform prop
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
            {entry.name}: <span className="text-semibold">{entry.value?.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ProfileVisitsChart: React.FC<ProfileVisitsChartProps> = ({ data, startDate, endDate, platform }) => {
  // Debug logging
  console.log('ProfileVisitsChart received data:', {
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
    // Show data for the specified platform
    return rowDate >= start && rowDate <= end && row.platform === platform;
  });

  console.log('ProfileVisitsChart filtered data:', {
    filteredLength: filteredData.length,
    sampleFiltered: filteredData[0]
  });

  // If no filtered data, use all data for debugging
  const dataToUse = filteredData.length > 0 ? filteredData : data;
  
  // Sort by date
  const sortedData = dataToUse.sort((a, b) => new Date(a.date || a.day).getTime() - new Date(a.date || a.day).getTime());

  // Transform data for the chart
  const chartData = sortedData.map(row => ({
    date: row.date || row.day,
    profile_visits: row.total_profile_visits || 0,
  }));

  // Platform-specific colors
  const platformColors = {
    instagram: {
      profile_visits: '#F77737', // Instagram orange
    },
    facebook: {
      profile_visits: '#1976D2', // Facebook blue
    }
  };

  const colors = platformColors[platform];

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {platform === 'instagram' ? 'Instagram Profile Visits' : 'Facebook Page Visits'}
          </h2>
          <p className="text-slate-400">
            Daily Profile Visits from Meta Analytics
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
              tickFormatter={(value) => `${(value / 1000).toFixed(1)}K`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<ViewsTooltip />} />
            <Line
              type="monotone"
              dataKey="profile_visits"
              stroke={colors.profile_visits}
              strokeWidth={2}
              dot={{ fill: colors.profile_visits, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors.profile_visits, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors.profile_visits }}
            />
            <span className="text-slate-300 text-sm">
              {platform === 'instagram' ? 'Profile Visits' : 'Page Visits'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileVisitsChart;
