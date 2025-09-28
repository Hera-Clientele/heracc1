'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

interface YouTubeSubscriberChartProps {
  data: any[];
  startDate: string;
  endDate: string;
}

interface SubscriberTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const SubscriberTooltip: React.FC<SubscriberTooltipProps> = ({ active, payload, label }) => {
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

const YouTubeSubscriberChart: React.FC<YouTubeSubscriberChartProps> = ({ data, startDate, endDate }) => {
  // Debug logging
  console.log('YouTubeSubscriberChart received data:', {
    dataLength: data.length,
    sampleData: data[0],
    startDate,
    endDate
  });
  
  // Check for the specific YouTube fields we need
  if (data.length > 0) {
    console.log('YouTubeSubscriberChart - Checking for YouTube fields:', {
      hasTotalYtSubsGained: data[0]?.total_yt_subs_gained !== undefined,
      hasTotalYtSubsLost: data[0]?.total_yt_subs_lost !== undefined,
      totalYtSubsGainedValue: data[0]?.total_yt_subs_gained,
      totalYtSubsLostValue: data[0]?.total_yt_subs_lost,
      allFields: Object.keys(data[0] || {})
    });
  }

  // Filter data by date range
  const filteredData = data.filter(row => {
    const rowDate = new Date(row.date || row.day);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return rowDate >= start && rowDate <= end;
  });

  console.log('YouTubeSubscriberChart filtered data:', {
    filteredLength: filteredData.length,
    sampleFiltered: filteredData[0]
  });

  // If no filtered data, use all data for debugging
  const dataToUse = filteredData.length > 0 ? filteredData : data;
  
  // Sort by date
  const sortedData = dataToUse.sort((a, b) => new Date(a.date || a.day).getTime() - new Date(a.date || a.day).getTime());

  // Transform data for the chart - use the raw materialized view fields
  const chartData = sortedData.map(row => ({
    date: row.date || row.day,
    subs_gained: row.total_yt_subs_gained || 0,
    subs_lost: row.total_yt_subs_lost || 0,
    net_growth: (row.total_yt_subs_gained || 0) - (row.total_yt_subs_lost || 0),
  }));

  console.log('YouTubeSubscriberChart - Final chart data:', chartData.slice(0, 3));
  console.log('YouTubeSubscriberChart - Chart data sample values:', {
    subsGained: chartData.slice(0, 3).map(d => d.subs_gained),
    subsLost: chartData.slice(0, 3).map(d => d.subs_lost),
    netGrowth: chartData.slice(0, 3).map(d => d.net_growth)
  });

  // Colors for YouTube subscriber metrics
  const colors = {
    subs_gained: '#00FF00', // Green for gained
    subs_lost: '#FF0000',   // Red for lost
    net_growth: '#FF6B35',  // Orange for net growth
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            YouTube Subscriber Growth
          </h2>
          <p className="text-slate-400">
            Daily Subscriber Gains, Losses, and Net Growth
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
            <Tooltip content={<SubscriberTooltip />} />
            <Line
              type="monotone"
              dataKey="subs_gained"
              stroke={colors.subs_gained}
              strokeWidth={2}
              dot={{ fill: colors.subs_gained, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors.subs_gained, strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="subs_lost"
              stroke={colors.subs_lost}
              strokeWidth={2}
              dot={{ fill: colors.subs_lost, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors.subs_lost, strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="net_growth"
              stroke={colors.net_growth}
              strokeWidth={3}
              dot={{ fill: colors.net_growth, strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: colors.net_growth, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors.subs_gained }}
            />
            <span className="text-slate-300 text-sm">Subs Gained</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors.subs_lost }}
            />
            <span className="text-slate-300 text-sm">Subs Lost</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors.net_growth }}
            />
            <span className="text-slate-300 text-sm">Net Growth</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeSubscriberChart;
