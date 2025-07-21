"use client";
import React, { useState } from "react";
import dayjs from "dayjs";
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

interface InstagramRow {
  date: string;
  total_views: number;
  total_likes: number;
  total_comments: number;
  videos_scraped: number;
}

function getWeekNumber(date: string) {
  return dayjs(date).isoWeek();
}

function getWeekRange(dates: string[]) {
  if (dates.length === 0) return '';
  const start = dayjs(dates[0]).startOf('isoWeek').format('MMM D');
  const end = dayjs(dates[0]).endOf('isoWeek').format('MMM D');
  return `${start} - ${end}`;
}

export default function InstagramWeeklyStats({ data }: { data: InstagramRow[] }) {
  const [expanded, setExpanded] = useState(false);

  // Group data by week number
  const weeks: Record<string, InstagramRow[]> = {};
  for (const row of data) {
    const week = getWeekNumber(row.date);
    if (!weeks[week]) weeks[week] = [];
    weeks[week].push(row);
  }

  // Prepare weekly stats
  const weeklyStats = Object.entries(weeks).map(([week, rows]) => {
    const totalViews = rows.reduce((sum, r) => sum + Number(r.total_views), 0);
    const totalLikes = rows.reduce((sum, r) => sum + Number(r.total_likes), 0);
    const totalComments = rows.reduce((sum, r) => sum + Number(r.total_comments), 0);
    const totalPosts = rows.reduce((sum, r) => sum + Number(r.videos_scraped), 0);
    const engagement = totalViews === 0 ? 0 : ((totalLikes + totalComments) / totalViews) * 100;
    const weekRange = getWeekRange(rows.map(r => r.date));
    return {
      week,
      weekRange,
      totalViews,
      totalPosts,
      engagement: engagement.toFixed(2),
    };
  });

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-8">
      <button
        className="text-white font-semibold text-lg flex items-center gap-2 focus:outline-none"
        onClick={() => setExpanded(e => !e)}
      >
        Weekly Statistics
        <span className="ml-2 text-xs bg-slate-700 rounded px-2 py-1">
          {expanded ? 'Hide' : 'Show'}
        </span>
      </button>
      {expanded && (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full text-white">
            <thead>
              <tr className="text-slate-300 text-sm uppercase">
                <th className="px-4 py-2 text-left">Week</th>
                <th className="px-4 py-2 text-left">Date Range</th>
                <th className="px-4 py-2 text-center">Total Views</th>
                <th className="px-4 py-2 text-center">Total Posts</th>
                <th className="px-4 py-2 text-center">Engagement %</th>
              </tr>
            </thead>
            <tbody>
              {weeklyStats.map((stat) => (
                <tr key={stat.week} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-2">Week {stat.week}</td>
                  <td className="px-4 py-2">{stat.weekRange}</td>
                  <td className="px-4 py-2 text-center">{stat.totalViews.toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">{stat.totalPosts}</td>
                  <td className="px-4 py-2 text-center">{stat.engagement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 