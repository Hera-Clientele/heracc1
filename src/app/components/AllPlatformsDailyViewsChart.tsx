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
import { formatChartNumber } from '../lib/formatters';
import { CHART_COLORS } from '../lib/chartColors';

dayjs.extend(utc);
dayjs.extend(timezone);

interface AllPlatformsDailyViewsChartProps {
  tiktokData: any[];
  instagramData: any[];
  facebookData: any[];
  instagramUnfilteredData?: any[]; // Add unfiltered Instagram data for comparison
  startDate?: string;
  endDate?: string;
  showInstagramComparison?: boolean; // Flag to show comparison
}

export default function AllPlatformsDailyViewsChart({ 
  tiktokData, 
  instagramData, 
  facebookData, 
  instagramUnfilteredData = [],
  startDate, 
  endDate,
  showInstagramComparison = false
}: AllPlatformsDailyViewsChartProps) {
  // Filter out future dates and create aggregated data
  const currentDate = dayjs().tz('America/New_York').startOf('day');
  
  const filterData = (data: any[]) => {
    let filtered = data.filter(row => {
      const rowDate = dayjs(row.day);
      return rowDate.isBefore(currentDate.add(1, 'day'));
    });
    
    if (startDate && endDate) {
      filtered = filtered.filter(row => {
        const rowDate = dayjs(row.day);
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        return rowDate.isAfter(start.subtract(1, 'day')) && 
               rowDate.isBefore(end.add(1, 'day'));
      });
    }
    
    return filtered;
  };

  const filteredTiktok = filterData(tiktokData);
  const filteredInstagram = filterData(instagramData);
  const filteredFacebook = filterData(facebookData);
  const filteredInstagramUnfiltered = filterData(instagramUnfilteredData);

  // Create a map of all unique dates
  const allDates = new Set<string>();
  [...filteredTiktok, ...filteredInstagram, ...filteredFacebook, ...filteredInstagramUnfiltered].forEach(row => {
    allDates.add(row.day);
  });

  // Create aggregated data with platform breakdown
  const dailyViewsData = Array.from(allDates)
    .sort()
    .map(date => {
      const tiktokRow = filteredTiktok.find(row => row.day === date);
      const instagramRow = filteredInstagram.find(row => row.day === date);
      const facebookRow = filteredFacebook.find(row => row.day === date);
      const instagramUnfilteredRow = filteredInstagramUnfiltered.find(row => row.day === date);

      return {
        date,
        tiktokViews: Number(tiktokRow?.views || 0),
        instagramViews: Number(instagramRow?.views || 0),
        instagramUnfilteredViews: Number(instagramUnfilteredRow?.views || 0),
        facebookViews: Number(facebookRow?.video_views || 0),
        totalViews: (Number(tiktokRow?.views || 0) + 
                    Number(instagramRow?.views || 0) + 
                    Number(facebookRow?.video_views || 0))
      };
    });

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/90 p-3 rounded-lg shadow text-white border border-slate-700">
          <div className="font-semibold mb-2">{dayjs(label).tz('America/New_York').format("MMMM D, YYYY")}</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span style={{ color: CHART_COLORS.tiktok.primary }}>TikTok:</span>
              <span className="font-bold">{formatChartNumber(data.tiktokViews)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: CHART_COLORS.instagram.primary }}>Instagram:</span>
              <span className="font-bold">{formatChartNumber(data.instagramViews)}</span>
            </div>
            {showInstagramComparison && data.instagramUnfilteredViews > 0 && (
              <div className="flex justify-between">
                <span style={{ color: CHART_COLORS.instagram.primary, opacity: 0.6 }}>Instagram (All):</span>
                <span className="font-bold" style={{ opacity: 0.6 }}>{formatChartNumber(data.instagramUnfilteredViews)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: CHART_COLORS.facebook.primary }}>Facebook:</span>
              <span className="font-bold">{formatChartNumber(data.facebookViews)}</span>
            </div>
            <div className="border-t border-slate-600 pt-1 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-white">{formatChartNumber(data.totalViews)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <div className="font-semibold text-lg text-white">Daily Views Gained</div>
        {showInstagramComparison && (
          <div className="text-sm text-pink-400 bg-pink-400/10 px-3 py-1 rounded-full border border-pink-400/20">
            Instagram accounts filtered
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={dailyViewsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTiktok" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.15}/>
            </linearGradient>
            <linearGradient id="colorInstagram" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e4405f" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#e4405f" stopOpacity={0.15}/>
            </linearGradient>
            <linearGradient id="colorFacebook" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1877f2" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#1877f2" stopOpacity={0.15}/>
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
              return formatChartNumber(tick);
            }} 
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* TikTok line */}
          <Area
            type="monotone"
            dataKey="tiktokViews"
            stroke="none"
            fill="url(#colorTiktok)"
          />
          <Line
            type="monotone"
            dataKey="tiktokViews"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="TikTok"
          />
          
          {/* Instagram line */}
          <Area
            type="monotone"
            dataKey="instagramViews"
            stroke="none"
            fill="url(#colorInstagram)"
          />
          <Line
            type="monotone"
            dataKey="instagramViews"
            stroke="#e4405f"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Instagram"
          />
          
          {/* Instagram unfiltered line (dashed) */}
          {showInstagramComparison && (
            <Line
              type="monotone"
              dataKey="instagramUnfilteredViews"
              stroke="#e4405f"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4 }}
              name="Instagram (All)"
            />
          )}
          
          {/* Facebook line */}
          <Area
            type="monotone"
            dataKey="facebookViews"
            stroke="none"
            fill="url(#colorFacebook)"
          />
          <Line
            type="monotone"
            dataKey="facebookViews"
            stroke="#1877f2"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Facebook"
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
          <span className="text-sm text-slate-300">TikTok</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e4405f' }}></div>
          <span className="text-sm text-slate-300">Instagram</span>
        </div>
        {showInstagramComparison && (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 rounded" style={{ backgroundColor: '#e4405f', borderStyle: 'dashed' }}></div>
            <span className="text-sm text-slate-300">Instagram (All)</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1877f2' }}></div>
          <span className="text-sm text-slate-300">Facebook</span>
        </div>
      </div>
    </div>
  );
}
