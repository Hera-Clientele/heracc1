"use client";
import React, { useEffect, useState } from 'react';
import { ContentQueueItem } from '../api/content-queue/route';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface ContentQueueCardProps {
  clientId: string;
  platform?: 'tiktok' | 'instagram';
}

const statusColors = {
  queued: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  scheduled: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  pending: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  success: 'bg-green-500/20 text-green-300 border-green-500/30',
  ERR_BAD_REQUEST: 'bg-red-500/20 text-red-300 border-red-500/30',
  too_short: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const statusLabels = {
  queued: 'Queued',
  scheduled: 'Scheduled',
  pending: 'Pending',
  success: 'Posted',
  ERR_BAD_REQUEST: 'Error',
  too_short: 'Too Short',
};

export default function ContentQueueCard({ clientId, platform }: ContentQueueCardProps) {
  const [contentQueue, setContentQueue] = useState<ContentQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'tiktok' | 'instagram'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedAccounts, setCollapsedAccounts] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchContentQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        clientId,
        ...(selectedPlatform !== 'all' && { platform: selectedPlatform }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedStatus === 'all' && { excludeStatus: 'success' }),
      });

      const response = await fetch(`/api/content-queue?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch content queue');
      }

      const data = await response.json();
      setContentQueue(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchContentQueue();
    }
  }, [clientId, selectedStatus, selectedPlatform]);

  // Auto-collapse all accounts when data changes
  useEffect(() => {
    if (contentQueue.length > 0) {
      const accountKeys = contentQueue
        .map(item => item.account_username)
        .filter((username): username is string => Boolean(username));
      setCollapsedAccounts(new Set(accountKeys));
    }
  }, [contentQueue]);

  // Set initial platform filter based on prop
  useEffect(() => {
    if (platform) {
      setSelectedPlatform(platform);
    }
  }, [platform]);

  const formatScheduleTime = (time: string) => {
    return dayjs(time).tz('America/New_York').format('MMM D h:mm A');
  };

  const isPastScheduledTime = (time: string) => {
    return dayjs(time).tz('America/New_York').isBefore(dayjs().tz('America/New_York'));
  };

  const getStatusCounts = () => {
    return contentQueue.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  // Filter content by search query
  const filteredContent = contentQueue.filter(item => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.account_username?.toLowerCase().includes(query) ||
      item.account_display_name?.toLowerCase().includes(query) ||
      item.caption.toLowerCase().includes(query) ||
      item.account_platform?.toLowerCase().includes(query)
    );
  });

  // Group content by account
  const groupedContent = filteredContent.reduce((acc, item) => {
    const accountKey = item.account_username || 'Unknown';
    if (!acc[accountKey]) {
      acc[accountKey] = {
        account: item,
        posts: []
      };
    }
    acc[accountKey].posts.push(item);
    return acc;
  }, {} as Record<string, { account: ContentQueueItem, posts: ContentQueueItem[] }>);

  // Sort accounts by platform (Instagram first) then by number of posts (descending)
  const sortedAccounts = Object.entries(groupedContent).sort(([, a], [, b]) => {
    // First sort by platform: Instagram first, then TikTok
    if (a.account.account_platform !== b.account.account_platform) {
      return a.account.account_platform === 'instagram' ? -1 : 1;
    }
    // Then sort by number of posts (descending)
    return b.posts.length - a.posts.length;
  });

  const toggleAccount = (accountKey: string) => {
    setCollapsedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountKey)) {
        newSet.delete(accountKey);
      } else {
        newSet.add(accountKey);
      }
      return newSet;
    });
  };

  const isCollapsed = (accountKey: string) => collapsedAccounts.has(accountKey);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here if you want
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const toggleSelection = (contentId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contentId)) {
        newSet.delete(contentId);
      } else {
        newSet.add(contentId);
      }
      return newSet;
    });
  };

  const exportSelectedIds = () => {
    if (selectedIds.size === 0) return;
    
    const idsArray = Array.from(selectedIds);
    const idsText = idsArray.join('\n');
    
    // Create and download a .txt file
    const blob = new Blob([idsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-content-ids-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectAll = () => {
    const allIds = filteredContent.map(item => item.content_id);
    setSelectedIds(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  if (loading) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
        <div className="text-slate-300 py-8 text-center">Loading scheduled posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
        <div className="text-red-400 py-8 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Scheduled Posts</h3>
        <div className="flex items-center space-x-4">
          {selectedIds.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-sm">{selectedIds.size} selected</span>
              <button
                onClick={exportSelectedIds}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                title="Export selected IDs to clipboard"
              >
                Export IDs
              </button>
              <button
                onClick={clearSelection}
                className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Clear
              </button>
            </div>
          )}
          <div className="text-slate-400 text-sm">
            Total: {filteredContent.length} posts
            {searchQuery && contentQueue.length !== filteredContent.length && (
              <span className="text-slate-500"> (filtered from {contentQueue.length})</span>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 min-w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts, captions, or platforms..."
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>

        {/* Platform Filter */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              selectedPlatform === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-slate-400 hover:text-white hover:bg-white/15'
            }`}
            title="All Platforms"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setSelectedPlatform('tiktok')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              selectedPlatform === 'tiktok'
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-slate-400 hover:text-white hover:bg-white/15'
            }`}
            title="TikTok"
          >
            <img src="/tiktok-1.svg" alt="TikTok" className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedPlatform('instagram')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              selectedPlatform === 'instagram'
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-slate-400 hover:text-white hover:bg-white/15'
            }`}
            title="Instagram"
          >
            <img src="/ig.svg" alt="Instagram" className="w-4 h-4" />
          </button>
        </div>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          {Object.entries(statusLabels)
            .filter(([key]) => key !== 'success') // Exclude posted items from filter
            .map(([key, label]) => (
              <option key={key} value={key}>
                {label} ({statusCounts[key] || 0})
              </option>
            ))}
        </select>
      </div>

      {/* Status Summary */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(statusLabels)
          .filter(([key]) => key !== 'success') // Exclude posted items from summary
          .map(([key, label]) => (
            <div
              key={key}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[key as keyof typeof statusColors]}`}
            >
              {label}: {statusCounts[key] || 0}
            </div>
          ))}
      </div>

      {/* Content Queue Table */}
      <div className="overflow-x-auto">
        {sortedAccounts.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No scheduled posts found
          </div>
        ) : (
                      sortedAccounts.map(([accountKey, { account, posts }]) => (
              <div key={accountKey} className="mb-4">
                {/* Account Header */}
                <div 
                  className="relative flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => toggleAccount(accountKey)}
                >
                  <div className="flex items-center space-x-4">
                    {account.account_pfp_url ? (
                      <img 
                        src={account.account_pfp_url} 
                        alt={`${account.account_username} profile`}
                        className="w-12 h-12 rounded-full object-cover border border-white/10 flex-shrink-0"
                        onError={(e) => {
                          // Fallback to initial if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 ${account.account_pfp_url ? 'hidden' : ''}`}>
                      {account.account_username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-white font-semibold text-lg truncate">{account.account_username}</h3>
                        <img
                          src={account.account_platform === 'tiktok' ? '/tiktok-1.svg' : '/ig.svg'}
                          alt={account.account_platform}
                          className="w-5 h-5 flex-shrink-0"
                        />
                      </div>
                      {account.account_display_name && (
                        <div className="text-slate-400 text-sm truncate">{account.account_display_name}</div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <svg 
                        className={`w-5 h-5 text-slate-400 transition-transform ${isCollapsed(accountKey) ? 'rotate-90' : '-rotate-90'}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 text-right">
                    <div className="text-white font-semibold text-lg">{posts.length}</div>
                    <div className="text-slate-400 text-xs">scheduled posts</div>
                  </div>
                </div>

                {/* Posts Table - Collapsible */}
                {!isCollapsed(accountKey) && (
                  <div className="mt-2">
                                    <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-2 text-slate-300 font-medium w-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === posts.length && posts.length > 0}
                          onChange={() => selectedIds.size === posts.length ? clearSelection() : selectAll()}
                          className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                        />
                      </th>
                      <th className="text-left py-3 px-2 text-slate-300 font-medium">ID</th>
                      <th className="text-left py-3 px-2 text-slate-300 font-medium">Status</th>
                      <th className="text-left py-3 px-2 text-slate-300 font-medium">Caption</th>
                      <th className="text-left py-3 px-2 text-slate-300 font-medium">Scheduled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((item) => (
                      <tr key={item.content_id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-2 w-8">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.content_id)}
                            onChange={() => toggleSelection(item.content_id)}
                            className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3 px-2 w-24">
                          <button
                            onClick={() => copyToClipboard(item.content_id)}
                            className="text-slate-400 text-xs font-mono whitespace-nowrap hover:text-white hover:bg-white/10 px-1 py-0.5 rounded transition-colors cursor-pointer"
                            title="Click to copy full ID"
                          >
                            {item.content_id.slice(0, 12)}...
                          </button>
                        </td>
                        <td className="py-3 px-2 w-20">
                          <span className={`px-1 py-0.5 rounded text-xs font-medium border ${statusColors[item.status]}`}>
                            {statusLabels[item.status]}
                          </span>
                        </td>
                        <td className="py-3 px-2 w-80">
                          <div className="max-w-sm">
                            <div className="text-white line-clamp-2">{item.caption}</div>
                          </div>
                        </td>
                        <td className="py-3 px-2 w-32">
                          <div className={`text-sm ${isPastScheduledTime(item.schedule_time) ? 'text-red-400' : 'text-slate-300'}`}>
                            {formatScheduleTime(item.schedule_time)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
} 