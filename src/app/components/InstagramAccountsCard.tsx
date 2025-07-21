"use client";
import React, { useEffect, useState } from 'react';

interface InstagramAccount {
  id: string;
  username: string;
  full_name: string;
  profile_picture_url: string;
  followers_count: number;
  media_count: number;
  total_likes: number;
  total_comments: number;
}

export default function InstagramAccountsCard() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch('/api/instagram/accounts', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch Instagram accounts');
        const data = await response.json();
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
      {accounts.length === 0 ? (
        <div className="text-slate-400 text-center py-8">No Instagram accounts available</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={account.profile_picture_url}
                  alt={account.username}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/globe.svg';
                  }}
                />
                <div>
                  <h3 className="text-white font-medium">@{account.username}</h3>
                  <p className="text-slate-400 text-sm">{account.full_name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center">
                  <p className="text-white font-semibold">{account.followers_count.toLocaleString()}</p>
                  <p className="text-slate-400">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">{account.media_count.toLocaleString()}</p>
                  <p className="text-slate-400">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">{account.total_likes.toLocaleString()}</p>
                  <p className="text-slate-400">Total Likes</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">{account.total_comments.toLocaleString()}</p>
                  <p className="text-slate-400">Comments</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 