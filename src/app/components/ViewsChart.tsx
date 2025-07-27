"use client";
import React, { useState } from "react";
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

const PERIODS = [
  { label: "Today", value: 'today' },
  { label: "Yesterday", value: 'yesterday' },
  { label: "This Week", value: 'this_week' },
  { label: "This Month", value: 'this_month' },
  { label: "This Year", value: 'this_year' },
  { label: "Custom Range", value: 'custom' },
  { label: "All Time", value: 'all' },
];

// Utility function to calculate next update time
function getNextUpdateTime() {
  const now = dayjs().tz('America/New_York');
  const updateTimes = [
    { hour: 12, minute: 0 },   // 12:00 PM EST (noon)
    { hour: 19, minute: 55 }   // 7:55 PM EST
  ];

  // Find the next update time
  for (const time of updateTimes) {
    const nextUpdate = now.hour(time.hour).minute(time.minute).second(0).millisecond(0);
    if (nextUpdate.isAfter(now)) {
      return nextUpdate;
    }
  }

  // If all times have passed today, return the first time tomorrow
  return now.add(1, 'day').hour(12).minute(0).second(0).millisecond(0);
}

// Utility function to get last update time (assuming it's the most recent update time before now)
function getLastUpdateTime() {
  const now = dayjs().tz('America/New_York');
  const updateTimes = [
    { hour: 12, minute: 0 },   // 12:00 PM EST (noon)
    { hour: 19, minute: 55 }   // 7:55 PM EST
  ];

  // Find the most recent update time
  let lastUpdate = null;
  for (const time of updateTimes) {
    const updateTime = now.hour(time.hour).minute(time.minute).second(0).millisecond(0);
    if (updateTime.isBefore(now) || updateTime.isSame(now)) {
      if (!lastUpdate || updateTime.isAfter(lastUpdate)) {
        lastUpdate = updateTime;
      }
    }
  }

  // If no update time found today, return the last time from yesterday
  if (!lastUpdate) {
    return now.subtract(1, 'day').hour(19).minute(55).second(0).millisecond(0);
  }

  return lastUpdate;
}

// Filter data based on selected period
function filterDataByPeriod(data: Row[], period: string, customStartDate?: string, customEndDate?: string): Row[] {
  const now = dayjs().tz('America/New_York');
  
  switch (period) {
    case 'today':
      return data.filter(row => dayjs(row.day).tz('America/New_York').isSame(now, 'day'));
    case 'yesterday':
      return data.filter(row => dayjs(row.day).tz('America/New_York').isSame(now.subtract(1, 'day'), 'day'));
    case 'this_week':
      const weekStart = now.startOf('isoWeek');
      const weekEnd = now.endOf('isoWeek');
      return data.filter(row => {
        const rowDate = dayjs(row.day).tz('America/New_York');
        return rowDate.isAfter(weekStart.subtract(1, 'day')) && rowDate.isBefore(weekEnd.add(1, 'day'));
      });
    case 'this_month':
      return data.filter(row => dayjs(row.day).tz('America/New_York').isSame(now, 'month'));
    case 'this_year':
      return data.filter(row => dayjs(row.day).tz('America/New_York').isSame(now, 'year'));
    case 'custom':
      if (customStartDate && customEndDate) {
        const startDate = dayjs(customStartDate).tz('America/New_York');
        const endDate = dayjs(customEndDate).tz('America/New_York');
        return data.filter(row => {
          const rowDate = dayjs(row.day).tz('America/New_York');
          return rowDate.isAfter(startDate.subtract(1, 'day')) && rowDate.isBefore(endDate.add(1, 'day'));
        });
      }
      return data;
    case 'all':
    default:
      return data;
  }
}

export default function ViewsChart({ data }: { data: Row[] }) {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [dailyViewsPeriod, setDailyViewsPeriod] = useState('all');
  const [dailyPostsPeriod, setDailyPostsPeriod] = useState('all');
  
  // Custom date range states
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dailyViewsCustomStartDate, setDailyViewsCustomStartDate] = useState('');
  const [dailyViewsCustomEndDate, setDailyViewsCustomEndDate] = useState('');
  const [dailyPostsCustomStartDate, setDailyPostsCustomStartDate] = useState('');
  const [dailyPostsCustomEndDate, setDailyPostsCustomEndDate] = useState('');
  
  // Filter data based on selected period
  const filteredData = filterDataByPeriod(data, selectedPeriod, customStartDate, customEndDate);
  const dailyViewsData = filterDataByPeriod(data, dailyViewsPeriod, dailyViewsCustomStartDate, dailyViewsCustomEndDate);
  const dailyPostsData = filterDataByPeriod(data, dailyPostsPeriod, dailyPostsCustomStartDate, dailyPostsCustomEndDate);
  
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
  const dataWithInitial = [initialRow, ...filteredData];

  // Compute cumulative views
  const cumulativeData = dataWithInitial.reduce((acc: Row[], curr, idx) => {
    const prevTotal = idx > 0 ? acc[idx - 1].views : 0;
    acc.push({ ...curr, views: prevTotal + curr.views });
    return acc;
  }, []);

  // Compute daily views gained per day
  const dailyViewsWithInitial = [initialRow, ...dailyViewsData];
  const dailyGains = dailyViewsWithInitial.map((row, idx) => {
    if (idx === 0) return { day: row.day, gain: 0 };
    return {
      day: row.day,
      gain: row.views,
    };
  });

  // Compute daily posts
  const dailyPostsWithInitial = [initialRow, ...dailyPostsData];

  // Get update times
  const lastUpdate = getLastUpdateTime();
  const nextUpdate = getNextUpdateTime();

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

  // Custom Tooltip for Daily Gains
  const DailyGainTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const gain = payload[0].value;
      if (gain === 0 && label === initialDate) return null;
      return (
        <div className="bg-slate-900/90 p-3 rounded-lg shadow text-white border border-slate-700">
          <div className="font-semibold mb-1">{dayjs(label).tz('America/New_York').format("MMMM D")}</div>
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
          <div className="font-semibold mb-1">{dayjs(label).tz('America/New_York').format("MMMM D")}</div>
          <div>Posts: <span className="text-green-400 font-bold">{posts}</span></div>
        </div>
      );
    }
    return null;
  };

  // Custom date range component
  const CustomDateRange = ({ 
    startDate, 
    endDate, 
    onStartDateChange, 
    onEndDateChange 
  }: {
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
  }) => (
    <div className="flex items-center space-x-2 mt-2">
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        max={endDate || undefined}
      />
      <span className="text-slate-400 text-xs">to</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        min={startDate || undefined}
      />
    </div>
  );

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={cumulativeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.15}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12 }}
            tickFormatter={(date) => date === initialDate ? "" : dayjs(date).tz('America/New_York').format("MM/DD")}
            interval={0}
          />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} domain={[0, 'auto']} tickFormatter={tick => tick === 0 ? '' : tick} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="linear"
            dataKey="views"
            stroke="none"
            fill="#ff0000"
          />
          <Line
            type="linear"
            dataKey="views"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Daily Views Gained with dropdown */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-2">
          <div className="font-semibold text-lg text-white">Daily Views Gained</div>
          <div className="flex items-center space-x-4">
            <div className="text-xs text-slate-400 space-x-4">
              <span>Last updated: {lastUpdate.format('MMM D, h:mm A')}</span>
              <span>Next update: {nextUpdate.format('MMM D, h:mm A')}</span>
            </div>
            <div className="relative">
              <select
                value={dailyViewsPeriod}
                onChange={(e) => setDailyViewsPeriod(e.target.value)}
                className="bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PERIODS.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
              {dailyViewsPeriod === 'custom' && (
                <CustomDateRange
                  startDate={dailyViewsCustomStartDate}
                  endDate={dailyViewsCustomEndDate}
                  onStartDateChange={setDailyViewsCustomStartDate}
                  onEndDateChange={setDailyViewsCustomEndDate}
                />
              )}
            </div>
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
              tickFormatter={(date) => date === initialDate ? "" : dayjs(date).tz('America/New_York').format("MM/DD")}
              interval={0}
            />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} domain={[0, 'auto']} tickFormatter={tick => tick === 0 ? '' : tick} />
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
      
      {/* Daily Posts with dropdown */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-2">
          <div className="font-semibold text-lg text-white">Daily Posts</div>
          <div className="relative">
            <select
              value={dailyPostsPeriod}
              onChange={(e) => setDailyPostsPeriod(e.target.value)}
              className="bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PERIODS.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            {dailyPostsPeriod === 'custom' && (
              <CustomDateRange
                startDate={dailyPostsCustomStartDate}
                endDate={dailyPostsCustomEndDate}
                onStartDateChange={setDailyPostsCustomStartDate}
                onEndDateChange={setDailyPostsCustomEndDate}
              />
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailyPostsWithInitial} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.5}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.15}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12 }}
              tickFormatter={(date) => date === initialDate ? "" : dayjs(date).tz('America/New_York').format("MM/DD")}
              interval={0}
            />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} domain={[0, 'auto']} tickFormatter={tick => tick === 0 ? '' : tick} />
            <Tooltip content={<PostsTooltip />} />
            <Area
              type="linear"
              dataKey="posts"
              stroke="none"
              fill="url(#colorPosts)"
            />
            <Line
              type="linear"
              dataKey="posts"
              stroke="#10b981"
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