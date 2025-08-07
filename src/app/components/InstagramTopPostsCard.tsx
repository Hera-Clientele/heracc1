"use client";
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const PERIODS = [
  { label: "Today's Top 10", value: 'today' },
  { label: "Yesterday", value: 'yesterday' },
  { label: 'Past 3 Days', value: '3days' },
  { label: 'Past 7 Days', value: '7days' },
  { label: 'This Month', value: 'month' },
  { label: 'All Time', value: 'all' },
];

interface InstagramPost {
  video_id: string;
  username: string;
  url: string;
  created_at: string;
  views: number;
  post_caption: string;
}

interface InstagramTopPostsCardProps {
  clientId: string;
}

export default function InstagramTopPostsCard({ clientId }: InstagramTopPostsCardProps) {
  const [period, setPeriod] = useState<'today' | 'yesterday' | '3days' | '7days' | 'month' | 'all'>('today');
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/instagram/top-posts?period=${period}&clientId=${clientId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        console.log('InstagramTopPostsCard received data:', data);
        console.log('InstagramTopPostsCard posts array:', data.posts);
        setPosts(data.posts || []);
      } catch (err: any) {
        setError(err.message || 'Error fetching posts');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period, clientId]);

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Top 10 Instagram Posts</h2>
        <select
          className="bg-slate-800 text-white rounded px-3 py-1 border border-slate-600"
          value={period}
          onChange={e => setPeriod(e.target.value as any)}
        >
          {PERIODS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="text-slate-300 py-8 text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-400 py-8 text-center">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-white">
            <thead>
              <tr className="text-slate-300 text-sm uppercase">
                <th className="px-4 py-2 text-left">Username</th>
                <th className="px-4 py-2 text-left">Post Caption</th>
                <th className="px-4 py-2 text-center">Total Views</th>
                <th className="px-4 py-2 text-center">Post Date</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.video_id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-2 font-mono">
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">{post.username}</a>
                  </td>
                  <td className="px-4 py-2 max-w-xs truncate">
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">
                      {post.post_caption || 'No caption'}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-center">{post.views.toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">
                    {post.created_at ? dayjs(post.created_at).tz('America/New_York').format('MM/DD/YYYY') : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 