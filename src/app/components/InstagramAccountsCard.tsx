"use client";
import React, { useEffect, useState } from 'react';

interface InstagramAccount {
  username: string;
  profile_url: string;
  views: number;
  likes: number;
  comments: number;
  posts: number;
  highest_view_post: number;
  avg_views: number;
}

export default function InstagramAccountsCard() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/instagram/accounts', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch Instagram accounts');
        const data = await res.json();
        setAccounts(data.accounts || []);
      } catch (err: any) {
        setError(err.message || 'Error fetching Instagram accounts');
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  if (loading) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-6">
        <h2 className="text-xl font-semibold text-white mb-4">Instagram Accounts</h2>
        <div className="text-slate-300 py-8 text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-6">
        <h2 className="text-xl font-semibold text-white mb-4">Instagram Accounts</h2>
        <div className="text-red-400 py-8 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-6">
      <h2 className="text-xl font-semibold text-white mb-4">Instagram Accounts</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-white">
          <thead>
            <tr className="text-slate-300 text-sm uppercase">
              <th className="px-4 py-2 text-left">Username</th>
              <th className="px-4 py-2 text-center">Highest View Post</th>
              <th className="px-4 py-2 text-center">Posts</th>
              <th className="px-4 py-2 text-center">Avg Views</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.username} className="hover:bg-slate-800/40 transition">
                <td className="px-4 py-2 font-mono">
                  <a href={account.profile_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">{account.username}</a>
                </td>
                <td className="px-4 py-2 text-center">{account.highest_view_post.toLocaleString()}</td>
                <td className="px-4 py-2 text-center">{account.posts}</td>
                <td className="px-4 py-2 text-center">{account.avg_views.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 