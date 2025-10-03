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
  // Data should already be filtered by date range from the API
  let filteredData = data;
  
  // Only apply additional filtering if needed for debugging
  if (startDate && endDate && process.env.NODE_ENV === 'development') {
    console.log('Chart component date filtering:', {
      dataLength: data.length,
      startDate,
      endDate,
      sampleData: data[0]
    });
  }

  // Filter for Instagram platform only (if platform field exists)
  if (filteredData.length > 0 && filteredData[0].platform !== undefined) {
    filteredData = filteredData.filter(row => row.platform === 'instagram');
  }

  // Process unfiltered data if provided
  let unfilteredChartData: any[] = [];
  if (showComparison && unfilteredData.length > 0) {
    // Unfiltered data should already be filtered by date range from the API
    unfilteredChartData = unfilteredData
      .filter(row => !row.platform || row.platform === 'instagram')
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
    views: Number(row.total_views || row.views || 0),
    reach: Number(row.total_reach || row.reach || 0),
    accounts: Number(row.total_accounts || row.accounts || 0),
    active_accounts: Number(row.active_accounts || 0),
  }));

  // If no data after filtering, try to use original data
  const finalChartData = chartData.length > 0 ? chartData : data.map(row => ({
    date: row.date || row.day,
    views: Number(row.total_views || row.views || 0),
    reach: Number(row.total_reach || row.reach || 0),
    accounts: Number(row.total_accounts || row.accounts || 0),
    active_accounts: Number(row.active_accounts || 0),
  }));

  // Create combined chart data for comparison
  const combinedChartData = finalChartData.map(filteredRow => {
    const unfilteredRow = unfilteredChartData.find(row => row.date === filteredRow.date);
    return {
      ...filteredRow,
      unfilteredViews: unfilteredRow?.views || 0,
      unfilteredReach: unfilteredRow?.reach || 0,
    };
  });

  // Debug logging
  console.log('InstagramViewsChart data debug:', {
    originalDataLength: data.length,
    originalDataSample: data[0],
    filteredDataLength: filteredData.length,
    filteredDataSample: filteredData[0],
    chartDataLength: chartData.length,
    finalChartDataLength: finalChartData.length,
    combinedChartDataLength: combinedChartData.length,
    showComparison,
    unfilteredDataLength: unfilteredData.length,
    unfilteredChartDataLength: unfilteredChartData.length,
    sampleChartData: chartData[0],
    sampleFinalChartData: finalChartData[0],
    sampleCombinedData: combinedChartData[0],
    startDate,
    endDate,
    actualDateRange: finalChartData.length > 0 ? {
      firstDate: finalChartData[0]?.date,
      lastDate: finalChartData[finalChartData.length - 1]?.date
    } : 'no data'
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
        <LineChart data={combinedChartData.length > 0 ? combinedChartData : []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
            interval={Math.max(1, Math.floor(combinedChartData.length / 10))}
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
            dot={false}
            connectNulls={false}
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
            dot={false}
            connectNulls={false}
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