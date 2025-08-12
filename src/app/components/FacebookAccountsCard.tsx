"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface FacebookAccount {
  account_id: string;
  username: string;
  display_name: string | null;
  account_status: string | null;
  followers_count: number | null;
  views_count_total: number | null;
  profile_url: string | null;
  account_niche: string | null;
}

interface FacebookAccountsCardProps {
  clientId: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FacebookAccountsCard({ clientId }: FacebookAccountsCardProps) {
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFacebookAccounts() {
      if (clientId === 'all') {
        setAccounts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('accounts')
          .select('*')
          .eq('platform', 'facebook')
          .eq('client_id', parseInt(clientId, 10))
          .order('followers_count', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setAccounts(data || []);
      } catch (err: any) {
        console.error('Error fetching Facebook accounts:', err);
        setError(err.message || 'Failed to fetch Facebook accounts');
      } finally {
        setLoading(false);
      }
    }

    fetchFacebookAccounts();
  }, [clientId]);

  if (loading) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Facebook Accounts</h3>
        <div className="text-slate-300 py-8 text-center">Loading Facebook accounts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Facebook Accounts</h3>
        <div className="text-red-400 py-8 text-center">Error: {error}</div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Facebook Accounts</h3>
        <div className="text-slate-300 py-8 text-center">No Facebook accounts found for this client.</div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Facebook Accounts ({accounts.length})</h3>
      
      <div className="grid gap-4">
        {accounts.map((account) => (
          <div
            key={account.account_id}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              {/* Account Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-white">
                    {account.display_name || account.username}
                  </h4>
                  {account.account_status && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      account.account_status === 'active' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : account.account_status === 'suspended'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {account.account_status}
                    </span>
                  )}
                </div>
                
                <p className="text-slate-400 text-sm">@{account.username}</p>
                
                {account.account_niche && (
                  <p className="text-slate-500 text-xs mt-1">
                    {account.account_niche}
                  </p>
                )}
              </div>
              
              {/* Stats and Actions */}
              <div className="flex items-center space-x-4">
                {/* Followers */}
                {account.followers_count !== null && (
                  <div className="text-center">
                    <div className="text-white font-semibold">
                      {account.followers_count.toLocaleString()}
                    </div>
                    <div className="text-slate-400 text-xs">Followers</div>
                  </div>
                )}
                
                {/* Total Views */}
                {account.views_count_total !== null && (
                  <div className="text-center">
                    <div className="text-white font-semibold">
                      {account.views_count_total.toLocaleString()}
                    </div>
                    <div className="text-slate-400 text-xs">Views</div>
                  </div>
                )}
                
                {/* Profile Link */}
                {account.profile_url && (
                  <a
                    href={account.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>View Profile</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
