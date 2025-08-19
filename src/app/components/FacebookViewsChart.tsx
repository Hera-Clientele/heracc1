"use client";
import React from 'react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';

interface FacebookViewsChartProps {
  data: any[];
  startDate?: string;
  endDate?: string;
}

function getLastUpdateTime() {
  const now = dayjs().tz('America/New_York');
  const lastUpdate = now.subtract(now.minute() % 30, 'minute').startOf('minute');
  return lastUpdate;
}

function getNextUpdateTime() {
  const lastUpdate = getLastUpdateTime();
  return lastUpdate.add(30, 'minute');
}

export default function FacebookViewsChart({ data, startDate, endDate }: FacebookViewsChartProps) {
  // Filter data by date range if provided and ensure no future dates
  let filteredData = data;
  const currentDate = dayjs().tz('America/New_York').startOf('day');
  
  if (startDate && endDate) {
    filteredData = data.filter(row => {
      const rowDate = dayjs(row.day);
      const start = dayjs(startDate);
      const end = dayjs(endDate);
      // Only show data within the selected range and not in the future
      return rowDate.isAfter(start.subtract(1, 'day')) && 
             rowDate.isBefore(end.add(1, 'day')) && 
             rowDate.isBefore(currentDate.add(1, 'day'));
    });
  } else {
    // If no date range specified, still filter out future dates
    filteredData = data.filter(row => {
      const rowDate = dayjs(row.day);
      return rowDate.isBefore(currentDate.add(1, 'day'));
    });
  }

  // Filter for Facebook platform only
  filteredData = filteredData.filter(row => row.platform === 'facebook');

  // Ensure all fields are numbers
  const chartData = filteredData.map(row => ({
    date: row.day,
    views: Number(row.total_views),
    reach: Number(row.total_reach),
    accounts: Number(row.total_accounts),
    active_accounts: Number(row.active_accounts),
  }));

  // Get update times
  const lastUpdate = getLastUpdateTime();
  const nextUpdate = getNextUpdateTime();

  // Custom Tooltip for Views
  const ViewsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const views = payload.find((p: any) => p.dataKey === 'views')?.value || 0;
      const reach = payload.find((p: any) => p.dataKey === 'reach')?.value || 0;

      
      return (
        <div className="bg-slate-900/90 p-3 rounded-lg shadow text-white border border-slate-700">
          <div className="font-semibold mb-1">{dayjs(label).tz('America/New_York').format("MMMM D")}</div>
          <div className="space-y-1">
            <div>Views: <span className="text-blue-400 font-bold">{views.toLocaleString()}</span></div>
            <div>Reach: <span className="text-green-400 font-bold">{reach.toLocaleString()}</span></div>

          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Facebook Daily Metrics</h3>
          <p className="text-slate-400 text-sm">
            Views and Reach from Meta Analytics
          </p>
        </div>

      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1877F2" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#1877F2" stopOpacity={0.15}/>
            </linearGradient>
            <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#42A5F5" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#42A5F5" stopOpacity={0.15}/>
            </linearGradient>

          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
            tickFormatter={(date) => dayjs(date).tz('America/New_York').format("MM/DD")}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#9CA3AF' }} 
            allowDecimals={false} 
            domain={[0, 'auto']} 
            tickFormatter={tick => {
              if (tick === 0) return '';
              if (tick >= 1000000) return `${(tick / 1000000).toFixed(1)}M`;
              if (tick >= 1000) return `${(tick / 1000).toFixed(1)}K`;
              return tick.toString();
            }} 
          />
          <Tooltip content={<ViewsTooltip />} />
          
          {/* Views Area and Line */}
          <Area
            type="linear"
            dataKey="views"
            stroke="none"
            fill="url(#colorViews)"
          />
          <Line
            type="linear"
            dataKey="views"
            stroke="#1877F2"
            strokeWidth={2}
            dot={{ fill: "#1877F2", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#1877F2", strokeWidth: 2 }}
          />
          
          {/* Reach Area and Line */}
          <Area
            type="linear"
            dataKey="reach"
            stroke="none"
            fill="url(#colorReach)"
          />
          <Line
            type="linear"
            dataKey="reach"
            stroke="#42A5F5"
            strokeWidth={2}
            dot={{ fill: "#42A5F5", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#42A5F5", strokeWidth: 2 }}
          />
          

        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1877F2' }}></div>
          <span className="text-sm text-slate-300">Views</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#42A5F5' }}></div>
          <span className="text-sm text-slate-300">Reach</span>
        </div>

      </div>
    </div>
  );
}
