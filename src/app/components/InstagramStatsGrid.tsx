import React from 'react';

interface InstagramRow {
  day: string;
  posts: number;
  accounts: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
}

interface InstagramStatsGridProps {
  data: InstagramRow[];
  uniqueAccounts?: number;
}

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}

export default function InstagramStatsGrid({ data, uniqueAccounts }: InstagramStatsGridProps) {
  const totals = {
    views: sum(data.map((r) => r.views)),
    likes: sum(data.map((r) => r.likes)),
    comments: sum(data.map((r) => r.comments)),
    posts: sum(data.map((r) => r.posts)),
    accounts: uniqueAccounts || 0,
  };
  const engagement = totals.views === 0 ? 0 : ((totals.likes + totals.comments) / totals.views) * 100;

  const stats = [
    {
      label: 'ACCOUNTS POSTED',
      value: uniqueAccounts || 0,
      subtext: ''
    },
    {
      label: 'TOTAL POSTS',
      value: totals.posts,
      subtext: ''
    },
    {
      label: 'TOTAL VIEWS',
      value: totals.views.toLocaleString(),
      subtext: ''
    },
    {
      label: 'ENGAGEMENT %',
      value: engagement.toFixed(2),
      subtext: ''
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl backdrop-blur-md bg-white/5 border border-white/10 shadow-md p-6 flex flex-col items-center transition hover:scale-105 hover:shadow-xl text-white"
        >
          <div className="text-xs text-slate-300 mb-1 uppercase tracking-wider">{stat.label}</div>
          <div className="text-2xl font-bold text-white drop-shadow">{stat.value}</div>
        </div>
      ))}
    </div>
  );
} 