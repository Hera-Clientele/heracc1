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

export default function InstagramViewsChart({ data }: { data: InstagramRow[] }) {
  // Ensure all fields are numbers
  const chartData = data.map(row => ({
    date: row.date,
    total_views: Number(row.total_views),
    total_likes: Number(row.total_likes),
    total_comments: Number(row.total_comments),
    videos_scraped: Number(row.videos_scraped),
  }));

  // Compute cumulative views
  const cumulativeData = chartData.reduce((acc: any[], curr, idx) => {
    const prevTotal = idx > 0 ? acc[idx - 1].total_views : 0;
    acc.push({ ...curr, total_views: prevTotal + curr.total_views });
    return acc;
  }, []);

  // Compute daily views gained per day
  const dailyGains = chartData.map((row) => ({
    date: row.date,
    gain: row.total_views,
  }));

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
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(date) => dayjs(date).tz('America/New_York').format("MMMM D")}
          />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} domain={[0, 'auto']} tickFormatter={tick => tick === 0 ? '' : tick} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="linear"
            dataKey="total_views"
            stroke="none"
            fill="#ff0000"
          />
          <Line
            type="linear"
            dataKey="total_views"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      {/* New chart for daily views gained */}
      <div className="mt-8">
        <div className="font-semibold text-lg mb-2 text-white">Daily Views Gained</div>
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
              tickFormatter={(date) => dayjs(date).tz('America/New_York').format("MMMM D")}
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
      {/* New chart for daily posts */}
      <div className="mt-8">
        <div className="font-semibold text-lg mb-2 text-white">Daily Posts</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
              tickFormatter={(date) => dayjs(date).tz('America/New_York').format("MMMM D")}
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