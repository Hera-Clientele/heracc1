import React from 'react';
import type { AccountWithViews } from '../lib/fetchAccountsWithViews';

export default function AccountsCard({ accounts, platform = 'tiktok' }: { accounts: AccountWithViews[], platform?: string }) {
  // Sort accounts by average_views descending
  const sortedAccounts = [...accounts].sort((a, b) => b.average_views - a.average_views);
  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-8">
      <h2 className="text-xl font-semibold text-white mb-4">{platform.charAt(0).toUpperCase() + platform.slice(1)} Accounts</h2>
      <div className="overflow-x-auto max-h-[64rem] overflow-y-auto scrollbar-hide">
        <table className="min-w-full text-white">
          <thead className="sticky top-0 bg-[#18181b] border-b border-slate-700 z-10">
            <tr className="text-slate-200 text-xs font-semibold uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Username</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Followers</th>
              <th className="px-4 py-3 text-center">Total Views</th>
              <th className="px-4 py-3 text-center">Posts</th>
              <th className="px-4 py-3 text-center">Avg Views</th>
            </tr>
          </thead>
          <tbody>
            {sortedAccounts.map((account) => (
              <tr key={account.username + account.profile_url} className="hover:bg-slate-800/40 transition">
                <td className="px-4 py-2 font-mono max-w-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {account.pfp_url && (
                      <img 
                        src={account.pfp_url} 
                        alt={`${account.username} profile`}
                        className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <a href={account.profile_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300 truncate block">
                        {account.display_name || account.username}
                      </a>
                      <div className="text-xs text-slate-400 truncate">@{account.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    account.account_status?.toLowerCase() === 'active' ? 'bg-green-500/30 text-green-300 border border-green-500/50' :
                    account.account_status?.toLowerCase() === 'shelf' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' :
                    account.account_status?.toLowerCase() === 'automated' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' :
                    account.account_status?.toLowerCase() === 'inactive' ? 'bg-red-500/30 text-red-300 border border-red-500/50' :
                    'bg-gray-500/30 text-gray-300 border border-gray-500/50'
                  }`}>
                    {account.account_status || 'unknown'}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">{account.followers.toLocaleString()}</td>
                <td className="px-4 py-2 text-center">{account.views_count_total?.toLocaleString() || 'N/A'}</td>
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