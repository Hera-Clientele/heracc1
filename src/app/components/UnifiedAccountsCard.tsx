"use client";
import React, { useEffect, useState } from 'react';
import type { AccountWithViews } from '../lib/fetchAccountsWithViews';
import AccountAnalyticsModal from './AccountAnalyticsModal';

interface UnifiedAccountsCardProps {
  platform: 'tiktok' | 'instagram';
  clientId: string;
}

export default function UnifiedAccountsCard({ platform, clientId }: UnifiedAccountsCardProps) {
  const [accounts, setAccounts] = useState<AccountWithViews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch(`/api/accounts?platform=${platform}&clientId=${clientId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to fetch ${platform} accounts`);
        const data = await res.json();
        setAccounts(data.accounts || []);
        
        // Debug: Log status values
        console.log(`${platform} accounts status values:`, data.accounts?.map((acc: any) => acc.account_status));
      } catch (err: any) {
        setError(err.message || `Error fetching ${platform} accounts`);
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, [platform, clientId]);

  const openAnalytics = (account: any) => {
    setSelectedAccount({
      username: account.username,
      platform: platform,
      client_id: parseInt(clientId, 10)
    });
    setIsAnalyticsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-6">
        <h2 className="text-xl font-semibold text-white mb-4">{platform.charAt(0).toUpperCase() + platform.slice(1)} Accounts</h2>
        <div className="text-slate-300 py-8 text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-6">
        <h2 className="text-xl font-semibold text-white mb-4">{platform.charAt(0).toUpperCase() + platform.slice(1)} Accounts</h2>
        <div className="text-red-400 py-8 text-center">{error}</div>
      </div>
    );
  }

  // Sort accounts by average_views descending
  const sortedAccounts = [...accounts].sort((a, b) => b.average_views - a.average_views);

  return (
    <>
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-6">
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
                        <div className="flex items-center gap-2">
                          <a href={account.profile_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300 truncate block">
                            {account.display_name || account.username}
                          </a>
                          <button
                            onClick={() => openAnalytics(account)}
                            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex-shrink-0"
                            title="View Analytics"
                          >
                            Analytics
                          </button>
                        </div>
                        <div className="text-xs text-slate-400 truncate">@{account.username}</div>
                        {account.account_niche && (
                          <div className="text-xs text-slate-500 truncate">{account.account_niche}</div>
                        )}
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

      {/* Analytics Modal */}
      {selectedAccount && (
        <AccountAnalyticsModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => {
            setIsAnalyticsModalOpen(false);
            setSelectedAccount(null);
          }}
          account={selectedAccount}
        />
      )}
    </>
  );
} 