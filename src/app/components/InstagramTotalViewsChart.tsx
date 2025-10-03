"use client";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
} from "recharts";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface InstagramRow {
  day: string;
  posts: number;
  accounts: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
}

interface InstagramTotalViewsChartProps {
  data: InstagramRow[];
  startDate?: string;
  endDate?: string;
  platform?: 'instagram' | 'facebook' | 'youtube';
}

export default function InstagramTotalViewsChart({ data, startDate, endDate, platform = 'instagram' }: InstagramTotalViewsChartProps) {
  // Filter data by date range if provided
  let filteredData = data;
  
  if (startDate && endDate) {
    filteredData = data.filter(row => {
      const rowDate = dayjs(row.day);
      const start = dayjs(startDate);
      const end = dayjs(endDate);
      // Only show data within the selected range
      return rowDate.isAfter(start.subtract(1, 'day')) && 
             rowDate.isBefore(end.add(1, 'day'));
    });
  }

  // Ensure all fields are numbers
  const chartData = filteredData.map(row => ({
    date: row.day,
    total_views: Number(row.views),
    total_likes: Number(row.likes),
    total_comments: Number(row.comments),
    posts: Number(row.posts),
  }));

  // Compute cumulative views
  const cumulativeData = chartData.reduce((acc: any[], curr, idx) => {
    const prevTotal = idx > 0 ? acc[idx - 1].total_views : 0;
    acc.push({ ...curr, total_views: prevTotal + curr.total_views });
    return acc;
  }, []);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const totalViews = payload[0].value;
      return (
        <div className="bg-slate-900/90 p-3 rounded-lg shadow text-white border border-slate-700">
          <div className="font-semibold mb-1">{dayjs(label).tz('America/New_York').format("MMMM D")}</div>
          <div>Total Views: <span className="text-blue-400 font-bold">{totalViews}</span></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Performance Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={cumulativeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e4405f" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#e4405f" stopOpacity={0.15}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(date) => dayjs(date).tz('America/New_York').format("MM/DD")}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 12 }} 
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
          <Area
            type="linear"
            dataKey="total_views"
            stroke="none"
            fill="url(#colorViews)"
          />
          <Line
            type="linear"
            dataKey="total_views"
            stroke="#e4405f"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 