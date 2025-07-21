"use client";
import React, { useEffect, useState } from 'react';

interface InstagramPost {
  id: string;
  caption: string;
  media_url: string;
  media_type: string;
  like_count: number;
  comment_count: number;
  timestamp: string;
  permalink: string;
}

export default function InstagramTopPostsCard() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopPosts() {
      try {
        const response = await fetch('/api/instagram/top-posts', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch Instagram top posts');
        const data = await response.json();
        setPosts(data.posts || []);
      } catch (err: any) {
        setError(err.message || 'Error fetching Instagram top posts');
      } finally {
        setLoading(false);
      }
    }

    fetchTopPosts();
  }, []);

  if (loading) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-6">
        <h2 className="text-xl font-semibold text-white mb-4">Top Instagram Posts</h2>
        <div className="text-slate-300 py-8 text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-6">
        <h2 className="text-xl font-semibold text-white mb-4">Top Instagram Posts</h2>
        <div className="text-red-400 py-8 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-6">
      <h2 className="text-xl font-semibold text-white mb-4">Top Instagram Posts</h2>
      {posts.length === 0 ? (
        <div className="text-slate-400 text-center py-8">No Instagram posts available</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.slice(0, 6).map((post) => (
            <div
              key={post.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300"
            >
              <div className="aspect-square bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                {post.media_type === 'VIDEO' ? (
                  <div className="text-slate-400 text-sm">Video Content</div>
                ) : (
                  <img
                    src={post.media_url}
                    alt="Instagram post"
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                      if (next) next.style.display = 'flex';
                    }}
                  />
                )}
                <div className="hidden text-slate-400 text-sm">Image not available</div>
              </div>
              <div className="space-y-2">
                <p className="text-white text-sm line-clamp-2">
                  {post.caption || 'No caption'}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>❤️ {post.like_count.toLocaleString()}</span>
                  <span>💬 {post.comment_count.toLocaleString()}</span>
                </div>
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-xs block"
                >
                  View on Instagram →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 