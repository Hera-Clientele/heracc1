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
  date: string;
  total_views: number | string;
  total_likes: number | string;
  total_comments: number | string;
  videos_scraped: number | string;
}

// Utility function to calculate next update time
function getNextUpdateTime() {
  const now = dayjs().tz('America/New_York');
  const updateTime = { hour: 19, minute: 55 }; // 7:55 PM EST

  // Find the next update time
  const nextUpdate = now.hour(updateTime.hour).minute(updateTime.minute).second(0).millisecond(0);
  if (nextUpdate.isAfter(now)) {
    return nextUpdate;
  }

  // If the time has passed today, return tomorrow at 7:55 PM
  return now.add(1, 'day').hour(updateTime.hour).minute(updateTime.minute).second(0).millisecond(0);
}

// Utility function to get last update time (assuming it's the most recent update time before now)
function getLastUpdateTime() {
  const now = dayjs().tz('America/New_York');
  const updateTime = { hour: 19, minute: 55 }; // 7:55 PM EST

  // Find the most recent update time
  const lastUpdate = now.hour(updateTime.hour).minute(updateTime.minute).second(0).millisecond(0);
  
  // If the update time hasn't occurred today yet, return yesterday's update time
  if (lastUpdate.isAfter(now)) {
    return now.subtract(1, 'day').hour(updateTime.hour).minute(updateTime.minute).second(0).millisecond(0);
  }

  return lastUpdate;
}

export default function InstagramViewsChart({ data }: { data: InstagramRow[] }) {
  // Compute daily views gained per day
  const dailyViewsChartData = data.map(row => ({
    date: row.date,
    total_views: Number(row.total_views),
  }));
  const dailyGains = dailyViewsChartData.map((row) => ({
    date: row.date,
    gain: row.total_views,
  }));

  // Compute daily posts
  const dailyPostsChartData = data.map(row => ({
    date: row.date,
    videos_scraped: Number(row.videos_scraped),
  }));

  // Get update times
  const lastUpdate = getLastUpdateTime();
  const nextUpdate = getNextUpdateTime();

  // Custom Tooltip for Daily Gains
  const DailyGainTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const gain = payload[0].value;
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
      return (
        <div className="bg-slate-900/90 p-3 rounded-lg shadow text-white border border-slate-700">
          <div className="font-semibold mb-1">{dayjs(label).tz('America/New_York').format("MMMM D")}</div>
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
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(date) => dayjs(date).tz('America/New_York').format("MM/DD")}
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
      
      {/* Daily Posts */}
      <div>
        <div className="font-semibold text-lg mb-2 text-white">Daily Posts</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailyPostsChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.5}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.15}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(date) => dayjs(date).tz('America/New_York').format("MM/DD")}
              interval={0}
            />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} domain={[0, 'auto']} tickFormatter={tick => tick === 0 ? '' : tick} />
            <Tooltip content={<PostsTooltip />} />
            <Area
              type="linear"
              dataKey="videos_scraped"
              stroke="none"
              fill="url(#colorPosts)"
            />
            <Line
              type="linear"
              dataKey="videos_scraped"
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