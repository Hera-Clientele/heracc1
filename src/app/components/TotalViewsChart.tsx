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

interface Row {
  day: string;
  posts: number;
  accounts: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
}

interface TotalViewsChartProps {
  data: Row[];
  startDate?: string;
  endDate?: string;
}

export default function TotalViewsChart({ data, startDate, endDate }: TotalViewsChartProps) {
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

  // Insert initial zero point for 2025-07-07
  const initialDate = "2025-07-07";
  const initialRow: Row = {
    day: initialDate,
    posts: 0,
    accounts: 0,
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    engagement_rate: 0,
  };
  
  // Only add initial row if we're not filtering by date or if the initial date is within range
  let dataWithInitial = filteredData;
  if (!startDate || !endDate || dayjs(initialDate).isAfter(dayjs(startDate).subtract(1, 'day'))) {
    dataWithInitial = [initialRow, ...filteredData];
  }

  // Compute cumulative views
  const cumulativeData = dataWithInitial.reduce((acc: Row[], curr, idx) => {
    const prevTotal = idx > 0 ? acc[idx - 1].views : 0;
    acc.push({ ...curr, views: prevTotal + curr.views });
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
      <h2 className="text-xl font-semibold text-white mb-4">Total Views Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={cumulativeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.15}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12 }}
            tickFormatter={(date) => date === initialDate ? "" : dayjs(date).tz('America/New_York').format("MM/DD")}
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
            dataKey="views"
            stroke="none"
            fill="url(#colorViews)"
          />
          <Line
            type="linear"
            dataKey="views"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 