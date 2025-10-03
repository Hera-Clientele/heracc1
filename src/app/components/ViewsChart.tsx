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
import { getCurrentTimeInAppTimezone, getDateInAppTimezone } from "../lib/timezone";

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

// Utility function to calculate next update time (every hour)
function getNextUpdateTime() {
  const now = getCurrentTimeInAppTimezone();
  
  // Get the next hour (current hour + 1, with minutes and seconds set to 0)
  const nextUpdate = now.add(1, 'hour').minute(0).second(0).millisecond(0);
  
  return nextUpdate;
}

// Utility function to get last update time (every hour)
function getLastUpdateTime() {
  const now = getCurrentTimeInAppTimezone();
  
  // Get the current hour with minutes and seconds set to 0
  const lastUpdate = now.minute(0).second(0).millisecond(0);
  
  return lastUpdate;
}

interface ViewsChartProps {
  data: Row[];
  startDate?: string;
  endDate?: string;
}

export default function ViewsChart({ data, startDate, endDate }: ViewsChartProps) {
  // Filter data by date range if provided
  let filteredData = data;
  
  if (startDate && endDate) {
    filteredData = data.filter(row => {
      const rowDate = getDateInAppTimezone(row.day);
      const start = getDateInAppTimezone(startDate);
      const end = getDateInAppTimezone(endDate);
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

  // Compute daily views gained per day
  const dailyViewsWithInitial = [initialRow, ...filteredData];
  const dailyGains = dailyViewsWithInitial.map((row, idx) => {
    if (idx === 0) return { day: row.day, gain: 0 };
    return {
      day: row.day,
      gain: row.views,
    };
  });

  // Compute daily posts
  const dailyPostsWithInitial = [initialRow, ...filteredData];

  // Get update times
  const lastUpdate = getLastUpdateTime();
  const nextUpdate = getNextUpdateTime();

  // Custom Tooltip for Daily Gains
  const DailyGainTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const gain = payload[0].value;
      if (gain === 0 && label === initialDate) return null;
      return (
        <div className="bg-slate-900/90 p-3 rounded-lg shadow text-white border border-slate-700">
          <div className="font-semibold mb-1">{getDateInAppTimezone(label).format("MMMM D")}</div>
          <div>Daily Gain: <span className="text-orange-400 font-bold">{gain}</span></div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Posts
  const PostsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const posts = payload[0].value;
      if (posts === 0 && label === initialDate) return null;
      return (
        <div className="bg-slate-900/90 p-3 rounded-lg shadow text-white border border-slate-700">
          <div className="font-semibold mb-1">{getDateInAppTimezone(label).format("MMMM D")}</div>
          <div>Posts: <span className="text-green-400 font-bold">{posts}</span></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Daily Views Gained */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <div className="font-semibold text-lg text-white">Daily Views Gained</div>
          <div className="text-xs text-slate-400 space-x-4">
            <span>Last updated: {lastUpdate.format('MMM D, h:mm A')}</span>
            <span>Next update: {nextUpdate.format('MMM D, h:mm A')}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailyGains} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e42" stopOpacity={0.5}/>
                <stop offset="100%" stopColor="#f59e42" stopOpacity={0.15}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12 }}
              tickFormatter={(date) => date === initialDate ? "" : getDateInAppTimezone(date).format("MM/DD")}
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
            <Tooltip content={<DailyGainTooltip />} />
            <Area
              type="linear"
              dataKey="gain"
              stroke="none"
              fill="url(#colorGain)"
            />
            <Line
              type="linear"
              dataKey="gain"
              stroke="#f59e42"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      

    </div>
  );
} 