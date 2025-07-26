"use client";
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

interface InstagramRow {
  date: string;
  total_views: number | string;
  total_likes: number | string;
  total_comments: number | string;
  videos_scraped: number | string;
}

interface InstagramWeeklyStatsGridProps {
  data: InstagramRow[];
  uniqueAccounts: number;
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

export default function InstagramWeeklyStatsGrid({ data, uniqueAccounts }: InstagramWeeklyStatsGridProps) {
  const [preciseUniqueAccounts, setPreciseUniqueAccounts] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const currentWeek = getCurrentWeekNumber();

  // Group data by week number and get current week data
  const weeks: Record<string, any[]> = {};
  for (const row of data) {
    const week = dayjs(row.date).tz('America/New_York').isoWeek();
    if (!weeks[week]) weeks[week] = [];
    weeks[week].push({
      date: row.date,
      total_views: Number(row.total_views),
      total_likes: Number(row.total_likes),
      total_comments: Number(row.total_comments),
      videos_scraped: Number(row.videos_scraped),
    });
  }

  const currentWeekData = weeks[currentWeek] || [];

  // Calculate weekly totals
  const weeklyTotals = {
    views: sum(currentWeekData.map((r) => r.total_views)),
    likes: sum(currentWeekData.map((r) => r.total_likes)),
    comments: sum(currentWeekData.map((r) => r.total_comments)),
    posts: sum(currentWeekData.map((r) => r.videos_scraped)),
  };

  // Calculate weekly engagement rate
  const weeklyEngagement = weeklyTotals.views === 0 ? 0 : ((weeklyTotals.likes + weeklyTotals.comments) / weeklyTotals.views) * 100;

  // Fetch precise unique accounts from API
  useEffect(() => {
    async function fetchUniqueAccounts() {
      try {
        const response = await fetch('/api/instagram-weekly-accounts', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setPreciseUniqueAccounts(data.uniqueAccounts);
        }
      } catch (error) {
        console.error('Failed to fetch Instagram unique accounts:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUniqueAccounts();
  }, []);

  // Get week range for display
  const weekRange = getWeekRange(currentWeekData.map(r => r.date));

  const cards = [
    { 
      label: 'Accounts Posting', 
      value: preciseUniqueAccounts !== null ? preciseUniqueAccounts.toString() : (loading ? '...' : '0')
    },
    { 
      label: 'Posts This Week', 
      value: weeklyTotals.posts.toLocaleString()
    },
    { 
      label: 'Views This Week', 
      value: weeklyTotals.views.toLocaleString()
    },
    { 
      label: 'Engagement %', 
      value: weeklyEngagement.toFixed(2)
    },
  ];

  return (
    <div className="mb-10">
      <h3 className="text-lg font-semibold text-white mb-4">
        This Week's Performance ({weekRange})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl backdrop-blur-md bg-white/5 border border-white/10 shadow-md p-6 flex flex-col items-center transition hover:scale-105 hover:shadow-xl text-white"
          >
            <div className="text-xs text-slate-300 mb-1 uppercase tracking-wider">{card.label}</div>
            <div className="text-2xl font-bold text-white drop-shadow">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 