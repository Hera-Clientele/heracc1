import React from 'react';

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

interface InstagramStatsGridProps {
  data: Row[];
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
    shares: sum(data.map((r) => r.shares)),
    posts: sum(data.map((r) => r.posts)),
    accounts: sum(data.map((r) => r.accounts)),
  };
  const engagement = totals.views === 0 ? 0 : ((totals.likes + totals.comments + totals.shares) / totals.views) * 100;

  const cards = [
    { label: 'Total Accounts', value: (uniqueAccounts !== undefined ? uniqueAccounts : totals.accounts).toLocaleString() },
    { label: 'Total Posts', value: totals.posts.toLocaleString() },
    { label: 'Total Views', value: totals.views.toLocaleString() },
    { label: 'Engagement %', value: engagement.toFixed(2) },
  ];

  return (
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
  );
} 