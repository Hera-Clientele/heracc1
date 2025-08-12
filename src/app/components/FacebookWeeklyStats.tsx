"use client";
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

interface FacebookRow {
  day: string;
  video_views: number;
  post_engagements: number;
}

interface FacebookWeeklyStatsProps {
  data: FacebookRow[];
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

// Get the current ISO week number
function getCurrentWeekNumber(): number {
  return dayjs().tz('America/New_York').isoWeek();
}

// Get week range for display
function getWeekRange(dates: string[]): string {
  if (dates.length === 0) return '';
  const start = dayjs(dates[0]).startOf('isoWeek').format('MMM D');
  const end = dayjs(dates[0]).endOf('isoWeek').format('MMM D');
  return `${start} - ${end}`;
}

export default function FacebookWeeklyStats({ data }: FacebookWeeklyStatsProps) {
  const currentWeek = getCurrentWeekNumber();

  // Group data by week number and get current week data
  const weeks: Record<string, any[]> = {};
  for (const row of data) {
    const week = dayjs(row.day).tz('America/New_York').isoWeek();
    if (!weeks[week]) weeks[week] = [];
    weeks[week].push({
      date: row.day,
      total_views: Number(row.video_views),
      total_engagements: Number(row.post_engagements),
    });
  }

  const currentWeekData = weeks[currentWeek] || [];

  // Calculate weekly totals
  const weeklyTotals = {
    views: sum(currentWeekData.map((r) => r.total_views)),
    engagements: sum(currentWeekData.map((r) => r.total_engagements)),
  };

  // Calculate weekly engagement rate
  const weeklyEngagement = weeklyTotals.views === 0 ? 0 : (weeklyTotals.engagements / weeklyTotals.views) * 100;

  // Get week range for display
  const weekRange = getWeekRange(currentWeekData.map(r => r.date));

  const cards = [
    { 
      label: 'Views This Week', 
      value: weeklyTotals.views.toLocaleString(),
      color: 'text-blue-400'
    },
    { 
      label: 'Engagement This Week', 
      value: weeklyTotals.engagements.toLocaleString(),
      color: 'text-green-400'
    },
    { 
      label: 'Engagement %', 
      value: weeklyEngagement.toFixed(2),
      color: 'text-purple-400'
    },
  ];

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          This Week's Performance ({weekRange})
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
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
    </div>
  );
}
