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
  AreaChart,
} from "recharts";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { formatChartNumber } from '../lib/formatters';
import { CHART_COLORS } from '../lib/chartColors';

dayjs.extend(utc);
dayjs.extend(timezone);

interface PlatformData {
  tiktok: any[];
  instagram: any[];
  facebook: any[];
}

interface AllPlatformsTotalViewsChartProps {
  tiktokData: any[];
  instagramData: any[];
  facebookData: any[];
  startDate?: string;
  endDate?: string;
}

export default function AllPlatformsTotalViewsChart({ 
  tiktokData, 
  instagramData, 
  facebookData, 
  startDate, 
  endDate 
}: AllPlatformsTotalViewsChartProps) {
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

  // Create a map of all unique dates
  const allDates = new Set<string>();
  [...filteredTiktok, ...filteredInstagram, ...filteredFacebook].forEach(row => {
    allDates.add(row.day);
  });

  // Create aggregated data with platform breakdown
  const aggregatedData = Array.from(allDates)
    .sort()
    .map(date => {
      const tiktokRow = filteredTiktok.find(row => row.day === date);
      const instagramRow = filteredInstagram.find(row => row.day === date);
      const facebookRow = filteredFacebook.find(row => row.day === date);

      return {
        date,
        tiktokViews: Number(tiktokRow?.views || 0),
        instagramViews: Number(instagramRow?.views || 0),
        facebookViews: Number(facebookRow?.video_views || 0),
        totalViews: (Number(tiktokRow?.views || 0) + 
                    Number(instagramRow?.views || 0) + 
                    Number(facebookRow?.video_views || 0))
      };
    });

  // Compute cumulative totals for each platform
  const cumulativeData = aggregatedData.reduce((acc: any[], curr, idx) => {
    const prevTiktok = idx > 0 ? acc[idx - 1].tiktokCumulative : 0;
    const prevInstagram = idx > 0 ? acc[idx - 1].instagramCumulative : 0;
    const prevFacebook = idx > 0 ? acc[idx - 1].facebookCumulative : 0;
    
    acc.push({
      ...curr,
      tiktokCumulative: prevTiktok + curr.tiktokViews,
      instagramCumulative: prevInstagram + curr.instagramViews,
      facebookCumulative: prevFacebook + curr.facebookViews,
      totalCumulative: prevTiktok + prevInstagram + prevFacebook + curr.totalViews
    });
    return acc;
  }, []);

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
              <span className="font-bold">{formatChartNumber(data.tiktokCumulative)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: CHART_COLORS.instagram.primary }}>Instagram:</span>
              <span className="font-bold">{formatChartNumber(data.instagramCumulative)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: CHART_COLORS.facebook.primary }}>Facebook:</span>
              <span className="font-bold">{formatChartNumber(data.facebookCumulative)}</span>
            </div>
            <div className="border-t border-slate-600 pt-1 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-white">{formatChartNumber(data.totalCumulative)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Total Views Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={cumulativeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTiktok" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.tiktok.primary} stopOpacity={0.8}/>
              <stop offset="100%" stopColor={CHART_COLORS.tiktok.primary} stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="colorInstagram" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.instagram.primary} stopOpacity={0.8}/>
              <stop offset="100%" stopColor={CHART_COLORS.instagram.primary} stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="colorFacebook" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.facebook.primary} stopOpacity={0.8}/>
              <stop offset="100%" stopColor={CHART_COLORS.facebook.primary} stopOpacity={0.3}/>
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
          
          {/* Stacked areas showing platform contribution */}
          <Area
            type="monotone"
            dataKey="tiktokCumulative"
            stackId="1"
            stroke="none"
            fill="url(#colorTiktok)"
            name="TikTok"
          />
          <Area
            type="monotone"
            dataKey="instagramCumulative"
            stackId="1"
            stroke="none"
            fill="url(#colorInstagram)"
            name="Instagram"
          />
          <Area
            type="monotone"
            dataKey="facebookCumulative"
            stackId="1"
            stroke="none"
            fill="url(#colorFacebook)"
            name="Facebook"
          />
          
          {/* Total line on top */}
          <Line
            type="monotone"
            dataKey="totalCumulative"
            stroke="#ffffff"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Total"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: CHART_COLORS.tiktok.primary }}></div>
          <span className="text-sm text-slate-300">TikTok</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: CHART_COLORS.instagram.primary }}></div>
          <span className="text-sm text-slate-300">Instagram</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: CHART_COLORS.facebook.primary }}></div>
          <span className="text-sm text-slate-300">Facebook</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white rounded"></div>
          <span className="text-sm text-slate-300">Total</span>
        </div>
      </div>
    </div>
  );
}
