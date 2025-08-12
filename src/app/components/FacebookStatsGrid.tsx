"use client";
import React from "react";
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

interface FacebookStatsGridProps {
  data: FacebookRow[];
  uniqueAccounts: number;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export default function FacebookStatsGrid({ data, uniqueAccounts }: FacebookStatsGridProps) {
  // Calculate totals for the filtered date range
  const totals = {
    views: sum(data.map((r) => Number(r.video_views))),
    engagements: sum(data.map((r) => Number(r.post_engagements))),
  };

  // Calculate engagement rate
  const engagementRate = totals.views === 0 ? 0 : (totals.engagements / totals.views) * 100;

  // Calculate average daily views
  const avgDailyViews = data.length > 0 ? totals.views / data.length : 0;

  // Calculate average daily engagements
  const avgDailyEngagements = data.length > 0 ? totals.engagements / data.length : 0;

  const cards = [
    { 
      label: 'Total Views', 
      value: totals.views.toLocaleString(),
      color: 'text-blue-400'
    },
    { 
      label: 'Total Engagement', 
      value: totals.engagements.toLocaleString(),
      color: 'text-green-400'
    },
    { 
      label: 'Engagement Rate', 
      value: `${engagementRate.toFixed(2)}%`,
      color: 'text-purple-400'
    },
    { 
      label: 'Avg Daily Views', 
      value: avgDailyViews.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      color: 'text-orange-400'
    },
    { 
      label: 'Avg Daily Engagement', 
      value: avgDailyEngagements.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      color: 'text-emerald-400'
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl backdrop-blur-md bg-white/5 border border-white/10 shadow-md p-6 flex flex-col items-center transition hover:scale-105 hover:shadow-xl text-white"
        >
          <div className="text-xs text-slate-300 mb-1 uppercase tracking-wider">{card.label}</div>
          <div className={`text-2xl font-bold ${card.color} drop-shadow`}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}
