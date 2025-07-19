import React from 'react';
import type { AccountWithViews } from '../lib/fetchAccountsWithViews';

export default function AccountsCard({ accounts }: { accounts: AccountWithViews[] }) {
  // Sort accounts by average_views descending
  const sortedAccounts = [...accounts].sort((a, b) => b.average_views - a.average_views);
  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-8">
      <h2 className="text-xl font-semibold text-white mb-4">TikTok Accounts</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-white">
          <thead>
            <tr className="text-slate-300 text-sm uppercase">
              <th className="px-4 py-2 text-left">Username</th>
              <th className="px-4 py-2 text-center">Highest View Post</th>
              <th className="px-4 py-2 text-center">Followers</th>
              <th className="px-4 py-2 text-center">Posts</th>
              <th className="px-4 py-2 text-center">Avg Views</th>
            </tr>
          </thead>
          <tbody>
            {sortedAccounts.map((account) => (
              <tr key={account.username + account.profile_url} className="hover:bg-slate-800/40 transition">
                <td className="px-4 py-2 font-mono">
                  <a href={account.profile_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">{account.username}</a>
                </td>
                <td className="px-4 py-2 text-center">{account.highest_view_post.toLocaleString()}</td>
                <td className="px-4 py-2 text-center">{account.followers.toLocaleString()}</td>
                <td className="px-4 py-2 text-center">{account.post_count}</td>
                <td className="px-4 py-2 text-center">{account.average_views.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 