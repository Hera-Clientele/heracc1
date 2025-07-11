import React from 'react';
import type { TopPost } from '../lib/fetchTopPosts';

export default function TopPostsCard({ posts }: { posts: TopPost[] }) {
  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-8">
      <h2 className="text-xl font-semibold text-white mb-4">Top 10 Performing Posts</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-white">
          <thead>
            <tr className="text-slate-300 text-sm uppercase">
              <th className="px-4 py-2 text-left">Username</th>
              <th className="px-4 py-2 text-left">Post Caption</th>
              <th className="px-4 py-2 text-center">Total Views</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.video_id} className="hover:bg-slate-800/40 transition">
                <td className="px-4 py-2 font-mono">{post.username}</td>
                <td className="px-4 py-2 max-w-xs truncate">
                  <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">
                    {post.post_caption || 'No caption'}
                  </a>
                </td>
                <td className="px-4 py-2 text-center">{post.views.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 