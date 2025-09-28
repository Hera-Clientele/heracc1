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

interface InstagramViewsChartProps {
  data: any[];
  startDate?: string;
  endDate?: string;
  platform?: 'instagram' | 'facebook' | 'youtube';
  unfilteredData?: any[]; // Add unfiltered data for comparison
  showComparison?: boolean; // Flag to show comparison
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

export default function InstagramViewsChart({ data, startDate, endDate, platform = 'instagram', unfilteredData = [], showComparison = false }: InstagramViewsChartProps) {
  // Filter data by date range if provided and ensure no future dates
  let filteredData = data;
  const currentDate = dayjs().tz('America/New_York').startOf('day');
  
  if (startDate && endDate) {
    filteredData = data.filter(row => {
      const rowDate = dayjs(row.date || row.day);
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
      const rowDate = dayjs(row.date || row.day);
      return rowDate.isBefore(currentDate.add(1, 'day'));
    });
  }

  // Filter for Instagram platform only
  filteredData = filteredData.filter(row => row.platform === 'instagram');

  // Process unfiltered data if provided
  let unfilteredChartData: any[] = [];
  if (showComparison && unfilteredData.length > 0) {
    let filteredUnfilteredData = unfilteredData;
    if (startDate && endDate) {
      filteredUnfilteredData = unfilteredData.filter(row => {
        const rowDate = dayjs(row.date || row.day);
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        return rowDate.isAfter(start.subtract(1, 'day')) && 
               rowDate.isBefore(end.add(1, 'day')) && 
               rowDate.isBefore(currentDate.add(1, 'day'));
      });
    } else {
      filteredUnfilteredData = unfilteredData.filter(row => {
        const rowDate = dayjs(row.date || row.day);
        return rowDate.isBefore(currentDate.add(1, 'day'));
      });
    }
    
    unfilteredChartData = filteredUnfilteredData
      .filter(row => row.platform === 'instagram')
      .map(row => ({
        date: row.date || row.day,
        views: Number(row.total_views),
        reach: Number(row.total_reach),
        accounts: Number(row.total_accounts),
        active_accounts: Number(row.active_accounts),
      }));
  }

  // Ensure all fields are numbers
  const chartData = filteredData.map(row => ({
    date: row.date || row.day,
    views: Number(row.total_views),
    reach: Number(row.total_reach),
    accounts: Number(row.total_accounts),
    active_accounts: Number(row.active_accounts),
  }));

  // Create combined chart data for comparison
  const combinedChartData = chartData.map(filteredRow => {
    const unfilteredRow = unfilteredChartData.find(row => row.date === filteredRow.date);
    return {
      ...filteredRow,
      unfilteredViews: unfilteredRow?.views || 0,
      unfilteredReach: unfilteredRow?.reach || 0,
    };
  });

  // Get update times
  const lastUpdate = getLastUpdateTime();
  const nextUpdate = getNextUpdateTime();

  // Calculate Y-axis domain based on filtered data when showing comparison
  const calculateYAxisDomain = (): [number, number] | [number, 'auto'] => {
    if (!showComparison || combinedChartData.length === 0) {
      return [0, 'auto'];
    }
    
    // Get max values from filtered data only
    const maxViews = Math.max(...combinedChartData.map(d => d.views || 0));
    const maxReach = Math.max(...combinedChartData.map(d => d.reach || 0));
    const maxValue = Math.max(maxViews, maxReach);
    
    // Add 10% padding to the top
    const paddedMax = Math.ceil(maxValue * 1.1);
    
    // Ensure minimum range for visibility
    const minRange = Math.max(10000, paddedMax);
    
    return [0, minRange];
  };

  const yAxisDomain = calculateYAxisDomain();

  // Custom Tooltip for Views
  const ViewsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const views = data.views || 0;
      const reach = data.reach || 0;
      
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
          <h3 className="text-xl font-bold text-white mb-1">Instagram Daily Metrics</h3>
          <p className="text-slate-400 text-sm">
            Views and Reach from Meta Analytics
          </p>
        </div>
        {showComparison && (
          <div className="text-sm text-pink-400 bg-pink-400/10 px-3 py-1 rounded-full border border-pink-400/20">
            Instagram accounts filtered
          </div>
        )}

      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={combinedChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E4405F" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#E4405F" stopOpacity={0.15}/>
            </linearGradient>
            <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#833AB4" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#833AB4" stopOpacity={0.15}/>
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
            domain={yAxisDomain} 
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
            stroke="#E4405F"
            strokeWidth={2}
            dot={{ fill: "#E4405F", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#E4405F", strokeWidth: 2 }}
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
            stroke="#833AB4"
            strokeWidth={2}
            dot={{ fill: "#833AB4", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#833AB4", strokeWidth: 2 }}
          />
          

        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#E4405F' }}></div>
          <span className="text-sm text-slate-300">Views</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#833AB4' }}></div>
          <span className="text-sm text-slate-300">Reach</span>
        </div>
      </div>
    </div>
  );
} 