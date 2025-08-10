"use client";
import React, { useState, useEffect } from 'react';
import type { AccountWithViews } from '../lib/fetchAccountsWithViews';
import AccountAnalyticsModal from './AccountAnalyticsModal';

interface UnifiedAccountsCardProps {
  platform: string;
  clientId: string;
}

export default function UnifiedAccountsCard({ platform, clientId }: UnifiedAccountsCardProps) {
  const [accounts, setAccounts] = useState<AccountWithViews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('average_views');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  // Filter and sort accounts
  const filteredAndSortedAccounts = React.useMemo(() => {
    let filtered = accounts.filter(account => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.display_name && account.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (account.account_niche && account.account_niche.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || account.account_status === statusFilter;
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || account.account_niche === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });

    // Sort accounts
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case 'followers':
          aValue = a.followers;
          bValue = b.followers;
          break;
        case 'total_views':
          aValue = a.views_count_total || 0;
          bValue = b.views_count_total || 0;
          break;
        case 'posts':
          aValue = a.post_count;
          bValue = b.post_count;
          break;
        case 'average_views':
        default:
          aValue = a.average_views;
          bValue = b.average_views;
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [accounts, searchTerm, statusFilter, categoryFilter, sortBy, sortOrder]);

  // Get unique statuses and categories for filter options
  const uniqueStatuses = React.useMemo(() => {
    const statuses = [...new Set(accounts.map(acc => acc.account_status).filter(Boolean))];
    return statuses.sort();
  }, [accounts]);

  const uniqueCategories = React.useMemo(() => {
    const categories = [...new Set(accounts.map(acc => acc.account_niche).filter(Boolean))];
    return categories.sort();
  }, [accounts]);

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

  return (
    <>
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-6">
        <h2 className="text-xl font-semibold text-white mb-4">{platform.charAt(0).toUpperCase() + platform.slice(1)} Accounts</h2>
        
        {/* Search, Filter, and Sort Controls */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search accounts, names, or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              {/* Clear Filters Button */}
              {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="px-3 py-2 bg-red-600/20 border border-red-500/50 rounded-lg text-red-300 hover:bg-red-600/30 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          
          {/* Sort Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-300 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="average_views">Average Views</option>
                <option value="followers">Followers</option>
                <option value="total_views">Total Views</option>
                <option value="posts">Posts</option>
                <option value="username">Username</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
              >
                {sortOrder === 'asc' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Results Count */}
            <div className="text-slate-400 text-sm">
              Showing {filteredAndSortedAccounts.length} of {accounts.length} accounts
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto max-h-[64rem] overflow-y-auto scrollbar-hide">
          <table className="min-w-full text-white">
            <thead className="sticky top-0 bg-[#18181b] border-b border-slate-700 z-10">
              <tr className="border-b border-slate-700 text-slate-300 text-sm">
                <th className="px-4 py-3 text-left font-medium">Account</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Followers</th>
                <th className="px-4 py-3 text-center font-medium">Total Views</th>
                <th className="px-4 py-3 text-center font-medium">Posts</th>
                <th className="px-4 py-3 text-center font-medium">Avg Views</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="text-slate-400">
                      <svg className="w-12 h-12 mx-auto mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-lg font-medium mb-2">No accounts found</p>
                      <p className="text-sm">Try adjusting your search terms or filters</p>
                      {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            setCategoryFilter('all');
                          }}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedAccounts.map((account) => (
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
                ))
              )}
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