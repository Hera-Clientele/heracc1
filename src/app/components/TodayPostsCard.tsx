"use client";
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface TodayPost {
  video_id: string;
  username: string;
  url: string;
  profile_url: string;
  followers?: number;
  post_caption: string;
  is_slideshow: boolean;
  created_at: string;
  snapshot_date: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  client_id: string;
  platform: 'tiktok' | 'instagram';
}

interface TodayPostsCardProps {
  clientId: string;
  platform?: 'tiktok' | 'instagram';
}

export default function TodayPostsCard({ clientId, platform }: TodayPostsCardProps) {
  const [todayPosts, setTodayPosts] = useState<TodayPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'tiktok' | 'instagram'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'posted_time' | 'views' | 'likes' | 'comments' | 'shares'>('posted_time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchTodayPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        clientId,
        ...(selectedPlatform !== 'all' && { platform: selectedPlatform }),
      });

      const response = await fetch(`/api/today-posts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch today\'s posts');
      }

      const data = await response.json();
      setTodayPosts(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchTodayPosts();
    }
  }, [clientId, selectedPlatform]);

  // Set initial platform filter based on prop
  useEffect(() => {
    if (platform) {
      setSelectedPlatform(platform);
    }
  }, [platform]);

  const formatTime = (time: string) => {
    return dayjs(time).tz('America/New_York').format('MMM D, h:mm A');
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) {
      return '0';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getPlatformIcon = (platform: string) => {
    return platform === 'tiktok' ? '/tiktok-1.svg' : '/ig.svg';
  };

  const getPlatformColor = (platform: string) => {
    return platform === 'tiktok' ? 'text-pink-400' : 'text-purple-400';
  };

  const getStatusCounts = () => {
    return todayPosts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const getFilteredStatusCounts = () => {
    return filteredPosts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  // Filter posts by search query and platform
  const filteredPosts = todayPosts.filter(post => {
    // Platform filter
    if (selectedPlatform !== 'all' && post.platform !== selectedPlatform) {
      return false;
    }
    
    // Search filter
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      post.username.toLowerCase().includes(query) ||
      post.post_caption.toLowerCase().includes(query) ||
      post.platform.toLowerCase().includes(query)
    );
  });

  const statusCounts = getStatusCounts();
  const filteredStatusCounts = getFilteredStatusCounts();

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortBy) {
      case 'posted_time':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'views':
        aValue = a.views || 0;
        bValue = b.views || 0;
        break;
      case 'likes':
        aValue = a.likes || 0;
        bValue = b.likes || 0;
        break;
      case 'comments':
        aValue = a.comments || 0;
        bValue = b.comments || 0;
        break;
      case 'shares':
        aValue = a.shares || 0;
        bValue = b.shares || 0;
        break;
      default:
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Group posts by platform
  const groupedPosts = sortedPosts.reduce((acc, post) => {
    if (!acc[post.platform]) {
      acc[post.platform] = [];
    }
    acc[post.platform].push(post);
    return acc;
  }, {} as Record<string, TodayPost[]>);

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Today's Posts</h2>
          <p className="text-slate-400 text-sm">
            {dayjs().tz('America/New_York').format('MMMM D, YYYY')}
          </p>
        </div>
        
        {/* Platform Filter */}
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedPlatform === 'all'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedPlatform('tiktok')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedPlatform === 'tiktok'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            TikTok
          </button>
          <button
            onClick={() => setSelectedPlatform('instagram')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedPlatform === 'instagram'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            Instagram
          </button>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 min-w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search usernames, captions, or platforms..."
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>

        {/* Sort By */}
        <div className="flex items-center space-x-2">
          <label className="text-slate-300 text-sm">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="posted_time">Posted Time</option>
            <option value="views">Views</option>
            <option value="likes">Likes</option>
            <option value="comments">Comments</option>
            <option value="shares">Shares</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="flex items-center space-x-2">
          <label className="text-slate-300 text-sm">Order:</label>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm transition-colors flex items-center space-x-1"
          >
            <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            <svg 
              className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Results Summary */}
      {!loading && !error && (
        <div className="mb-4 text-slate-400 text-sm">
          Showing {filteredPosts.length} of {todayPosts.length} posts
          {searchQuery && (
            <span> matching "{searchQuery}"</span>
          )}
          {selectedPlatform !== 'all' && (
            <span> on {selectedPlatform}</span>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-slate-300 py-8 text-center">Loading today's posts...</div>
      ) : error ? (
        <div className="text-red-400 py-8 text-center">{error}</div>
      ) : todayPosts.length === 0 ? (
        <div className="text-slate-400 py-8 text-center">
          No posts found for today
        </div>
      ) : (
        <div className="h-[768px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {Object.entries(groupedPosts).map(([platform, posts]) => (
            <div key={platform} className="space-y-3">
              <div className="flex items-center space-x-2">
                <img 
                  src={getPlatformIcon(platform)} 
                  alt={platform} 
                  className="w-5 h-5"
                />
                <h3 className={`font-semibold ${getPlatformColor(platform)}`}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)} ({posts.length})
                </h3>
              </div>
              
              <div className="grid gap-3">
                {posts.map((post) => (
                  <div 
                    key={post.video_id} 
                    className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {/* Platform Icon */}
                      <div className="flex-shrink-0">
                        <img 
                          src={getPlatformIcon(post.platform)} 
                          alt={post.platform} 
                          className="w-5 h-5"
                        />
                      </div>
                      
                      {/* Post Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <a 
                            href={post.profile_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-white hover:text-blue-400 transition-colors text-sm"
                          >
                            @{post.username}
                          </a>
                          <span className="text-slate-400 text-xs">
                            {formatTime(post.created_at)}
                          </span>
                          {post.followers && (
                            <span className="text-slate-500 text-xs">
                              {formatNumber(post.followers)} followers
                            </span>
                          )}
                        </div>
                        
                        {/* Caption */}
                        <p className="text-slate-300 text-sm line-clamp-1">
                          {post.post_caption}
                        </p>
                      </div>
                      
                      {/* Analytics and Actions */}
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        {/* Stats */}
                        <div className="flex items-center space-x-3 text-xs text-slate-400">
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            <span>{formatNumber(post.views)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            <span>{formatNumber(post.likes)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                            <span>{formatNumber(post.comments)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            <span>{formatNumber(post.shares)}</span>
                          </div>
                        </div>
                        
                        {/* Slideshow indicator */}
                        {post.is_slideshow && (
                          <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                            Slideshow
                          </span>
                        )}
                        
                        {/* Post Link */}
                        <a 
                          href={post.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded text-xs transition-colors"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 