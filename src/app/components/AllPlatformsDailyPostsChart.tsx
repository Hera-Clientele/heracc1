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

interface AllPlatformsDailyPostsChartProps {
  tiktokData: any[];
  instagramData: any[];
  facebookData: any[];
  youtubeData: any[];
  startDate?: string;
  endDate?: string;
}

export default function AllPlatformsDailyPostsChart({ 
  tiktokData, 
  instagramData, 
  facebookData, 
  youtubeData,
  startDate, 
  endDate 
}: AllPlatformsDailyPostsChartProps) {
  // Filter data by date range if provided
  const filterData = (data: any[]) => {
    let filtered = data;
    
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
  const filteredYoutube = filterData(youtubeData);

  // Create a map of all unique dates
  const allDates = new Set<string>();
  [...filteredTiktok, ...filteredInstagram, ...filteredFacebook, ...filteredYoutube].forEach(row => {
    allDates.add(row.day);
  });

  // Create aggregated data with platform breakdown
  const dailyPostsData = Array.from(allDates)
    .sort()
    .map(date => {
      const tiktokRow = filteredTiktok.find(row => row.day === date);
      const instagramRow = filteredInstagram.find(row => row.day === date);
      const facebookRow = filteredFacebook.find(row => row.day === date);
      const youtubeRow = filteredYoutube.find(row => row.day === date);

      return {
        date,
        tiktokPosts: Number(tiktokRow?.posts || 0),
        instagramPosts: Number(instagramRow?.posts || 0),
        facebookPosts: 0, // Facebook doesn't track posts
        youtubePosts: Number(youtubeRow?.posts || 0),
        totalPosts: (Number(tiktokRow?.posts || 0) + 
                    Number(instagramRow?.posts || 0) + 
                    Number(youtubeRow?.posts || 0)) // YouTube posts included
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
              <span className="font-bold">{formatChartNumber(data.tiktokPosts)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: CHART_COLORS.instagram.primary }}>Instagram:</span>
              <span className="font-bold">{formatChartNumber(data.instagramPosts)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: CHART_COLORS.facebook.primary }}>Facebook:</span>
              <span className="font-bold">{formatChartNumber(data.facebookPosts)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: CHART_COLORS.youtube.primary }}>YouTube:</span>
              <span className="font-bold">{formatChartNumber(data.youtubePosts)}</span>
            </div>
            <div className="border-t border-slate-600 pt-1 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-white">{formatChartNumber(data.totalPosts)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
              <div className="font-semibold text-lg mb-2 text-white">Daily Posts</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={dailyPostsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTiktokPosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.15}/>
            </linearGradient>
            <linearGradient id="colorInstagramPosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e4405f" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#e4405f" stopOpacity={0.15}/>
            </linearGradient>
            <linearGradient id="colorFacebookPosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1877f2" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#1877f2" stopOpacity={0.15}/>
            </linearGradient>
            <linearGradient id="colorYoutubePosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff0000" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#ff0000" stopOpacity={0.15}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(date) => dayjs(date).tz('America/New_York').format("MM/DD")}
            interval={Math.max(1, Math.floor(dailyPostsData.length / 10))}
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
          
          {/* TikTok posts line */}
          <Area
            type="monotone"
            dataKey="tiktokPosts"
            stroke="none"
            fill="url(#colorTiktokPosts)"
          />
          <Line
            type="monotone"
            dataKey="tiktokPosts"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="TikTok"
          />
          
          {/* Instagram posts line */}
          <Area
            type="monotone"
            dataKey="instagramPosts"
            stroke="none"
            fill="url(#colorInstagramPosts)"
          />
          <Line
            type="monotone"
            dataKey="instagramPosts"
            stroke="#e4405f"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Instagram"
          />
          
          {/* Facebook posts line (always 0) */}
          <Area
            type="monotone"
            dataKey="facebookPosts"
            stroke="none"
            fill="url(#colorFacebookPosts)"
          />
          <Line
            type="monotone"
            dataKey="facebookPosts"
            stroke="#1877f2"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Facebook"
          />
          
          {/* YouTube posts line */}
          <Area
            type="monotone"
            dataKey="youtubePosts"
            stroke="none"
            fill="url(#colorYoutubePosts)"
          />
          <Line
            type="monotone"
            dataKey="youtubePosts"
            stroke="#ff0000"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="YouTube"
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
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1877f2' }}></div>
          <span className="text-sm text-slate-300">Facebook</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ff0000' }}></div>
          <span className="text-sm text-slate-300">YouTube</span>
        </div>
      </div>
    </div>
  );
}
