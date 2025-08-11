"use client";
import React, { useEffect, useState } from 'react';
import { getCurrentWeekNumber, getDateInAppTimezone } from '../lib/timezone';

interface Row {
  day: string;
  posts: number;
  accounts: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
}

interface WeeklyStatsGridProps {
  data: Row[];
  uniqueAccounts: number;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

// Get week range for display
function getWeekRange(dates: string[]): string {
  if (dates.length === 0) return '';
  const start = getDateInAppTimezone(dates[0]).startOf('isoWeek').format('MMM D');
  const end = getDateInAppTimezone(dates[0]).endOf('isoWeek').format('MMM D');
  return `${start} - ${end}`;
}

export default function WeeklyStatsGrid({ data, uniqueAccounts }: WeeklyStatsGridProps) {
  const [preciseUniqueAccounts, setPreciseUniqueAccounts] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const currentWeek = getCurrentWeekNumber();

  // Group data by week number and get current week data
  const weeks: Record<string, Row[]> = {};
  for (const row of data) {
    const week = getDateInAppTimezone(row.day).isoWeek();
    if (!weeks[week]) weeks[week] = [];
    weeks[week].push(row);
  }

  const currentWeekData = weeks[currentWeek] || [];

  // Calculate weekly totals (same logic as existing table)
  const weeklyTotals = {
    views: sum(currentWeekData.map((r) => r.views)),
    likes: sum(currentWeekData.map((r) => r.likes)),
    comments: sum(currentWeekData.map((r) => r.comments)),
    shares: sum(currentWeekData.map((r) => r.shares)),
    posts: sum(currentWeekData.map((r) => r.posts)),
    accounts: sum(currentWeekData.map((r) => r.accounts)),
  };

  // Calculate weekly engagement rate
  const weeklyEngagement = weeklyTotals.views === 0 ? 0 : ((weeklyTotals.likes + weeklyTotals.comments + weeklyTotals.shares) / weeklyTotals.views) * 100;

  // Fetch precise unique accounts from API
  useEffect(() => {
    async function fetchUniqueAccounts() {
      try {
        const response = await fetch('/api/weekly-accounts', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setPreciseUniqueAccounts(data.uniqueAccounts);
        }
      } catch (error) {
        console.error('Failed to fetch unique accounts:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUniqueAccounts();
  }, []);

  // Get week range for display
  const weekRange = getWeekRange(currentWeekData.map(r => r.day));

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