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

interface FacebookRow {
  day: string;
  video_views: number;
  post_engagements: number;
}

// Utility function to calculate next update time (every hour)
function getNextUpdateTime() {
  const now = dayjs().tz('America/New_York');
  
  // Get the next hour (current hour + 1, with minutes and seconds set to 0)
  const nextUpdate = now.add(1, 'hour').minute(0).second(0).millisecond(0);
  
  return nextUpdate;
}

// Utility function to get last update time (every hour)
function getLastUpdateTime() {
  const now = dayjs().tz('America/New_York');
  
  // Get the current hour with minutes and seconds set to 0
  const lastUpdate = now.minute(0).second(0).millisecond(0);
  
  return lastUpdate;
}

export default function FacebookViewsChart({ data }: { data: FacebookRow[] }) {
  // Filter out future dates
  const currentDate = dayjs().tz('America/New_York').startOf('day');
  const filteredData = data.filter(row => {
    const rowDate = dayjs(row.day);
    return rowDate.isBefore(currentDate.add(1, 'day'));
  });

  // Compute daily views gained per day
  const dailyViewsChartData = filteredData.map(row => ({
    date: row.day,
    total_views: Number(row.video_views),
  }));
  const dailyGains = dailyViewsChartData.map((row) => ({
    date: row.date,
    gain: row.total_views,
  }));

  // Compute daily engagement
  const dailyEngagementChartData = filteredData.map(row => ({
    date: row.day,
    engagements: Number(row.post_engagements),
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
          <div>Daily Views: <span className="text-orange-400 font-bold">{gain}</span></div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Engagements
  const EngagementsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const engagements = payload[0].value;
      return (
        <div className="bg-slate-900/90 p-3 rounded-lg shadow text-white border border-slate-700">
          <div className="font-semibold mb-1">{dayjs(label).tz('America/New_York').format("MMMM D")}</div>
          <div>Engagements: <span className="text-green-400 font-bold">{engagements}</span></div>
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
      
      {/* Daily Engagement */}
      <div>
        <div className="font-semibold text-lg mb-2 text-white">Daily Engagement</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailyEngagementChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEngagements" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.5}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.15}/>
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
            <Tooltip content={<EngagementsTooltip />} />
            <Area
              type="linear"
              dataKey="engagements"
              stroke="none"
              fill="url(#colorEngagements)"
            />
            <Line
              type="linear"
              dataKey="engagements"
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
