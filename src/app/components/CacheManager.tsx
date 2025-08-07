"use client";
import React, { useState } from 'react';

interface CachePattern {
  pattern: string;
  description: string;
}

export default function CacheManager() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const cachePatterns: CachePattern[] = [
    { pattern: 'daily_agg:*', description: 'All daily aggregation data' },
    { pattern: 'top_posts:*', description: 'All top posts data' },
    { pattern: 'today_posts:*', description: 'Today\'s posts data' },
    { pattern: 'accounts:*', description: 'All accounts data' },
    { pattern: 'daily_agg:1:*', description: 'Daily aggregation for Katie Le' },
    { pattern: 'top_posts:1:*', description: 'Top posts for Katie Le' },
  ];

  const invalidateCache = async (pattern: string) => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pattern }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 mt-8">
      <h2 className="text-xl font-semibold text-white mb-4">Cache Management</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes('✅') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
        }`}>
          {message}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cachePatterns.map(({ pattern, description }) => (
          <div key={pattern} className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium text-sm">{description}</h3>
                <p className="text-slate-400 text-xs font-mono">{pattern}</p>
              </div>
              <button
                onClick={() => invalidateCache(pattern)}
                disabled={loading}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1 rounded text-xs transition-colors disabled:opacity-50"
              >
                {loading ? 'Clearing...' : 'Clear Cache'}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-slate-400">
        <p>💡 Cache automatically expires based on data type:</p>
        <ul className="mt-2 space-y-1">
          <li>• Daily aggregation: 1 hour</li>
          <li>• Top posts: 30 minutes</li>
          <li>• Today's posts: 15 minutes</li>
          <li>• Accounts: 2 hours</li>
        </ul>
      </div>
    </div>
  );
} 