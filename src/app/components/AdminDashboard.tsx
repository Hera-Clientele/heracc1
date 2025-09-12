"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { fetchDailyAgg } from '../lib/fetchDailyAgg';
import { fetchInstagramDailyAgg } from '../lib/fetchInstagramDailyAgg';
import { fetchFacebookDailyAgg } from '../lib/fetchFacebookDailyAgg';
import { fetchMetaAnalyticsDailyAgg } from '../lib/metaAnalytics';
import { fetchAccountsWithViews } from '../lib/fetchAccountsWithViews';
import { fetchTopPosts } from '../lib/fetchTopPosts';
import AllPlatformsTotalViewsChart from './AllPlatformsTotalViewsChart';
import AllPlatformsDailyViewsChart from './AllPlatformsDailyViewsChart';
import AllPlatformsDailyPostsChart from './AllPlatformsDailyPostsChart';
import AdminStatsOverview from './AdminStatsOverview';
import DateRangeSelector, { DateRange } from './DateRangeSelector';
import MaterializedViewRefresher from './MaterializedViewRefresher';
import { useMaterializedViewRefresh } from '../hooks/useMaterializedViewRefresh';
import type { Row } from '../lib/fetchDailyAgg';
import type { FacebookRow } from '../lib/fetchFacebookDailyAgg';
import type { AccountWithViews } from '../lib/fetchAccountsWithViews';
import { getCurrentTimeInAppTimezone } from '../lib/timezone';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// DateRange interface imported from DateRangeSelector

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: '',
    period: 'last_30_days'
  });
  
  // Filter states
  const [selectedClients, setSelectedClients] = useState<string[]>(['1', '2']); // Default to all clients
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'instagram', 'facebook']); // Default to all platforms
  const [selectedInstagramAccounts, setSelectedInstagramAccounts] = useState<string[]>([]); // Default to all Instagram accounts
  
  // Account popup modal state
  const [selectedAccount, setSelectedAccount] = useState<AccountWithViews | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountDailyData, setAccountDailyData] = useState<any[]>([]);
  const [loadingAccountData, setLoadingAccountData] = useState(false);
  
  // Client ID to name mapping
  const clientNames: Record<string, string> = {
    '1': 'Katie',
    '2': 'Daisy'
  };
  
  const [tiktokData, setTiktokData] = useState<Row[]>([]);
  const [instagramData, setInstagramData] = useState<Row[]>([]);
  const [facebookData, setFacebookData] = useState<FacebookRow[]>([]);
  const [accounts, setAccounts] = useState<AccountWithViews[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [instagramAccounts, setInstagramAccounts] = useState<string[]>([]);
  const [instagramUnfilteredData, setInstagramUnfilteredData] = useState<Row[]>([]);

  const { refresh: refreshMaterializedViews } = useMaterializedViewRefresh();

  // Initialize date range to last 30 days
  useEffect(() => {
    const endDate = getCurrentTimeInAppTimezone().format('YYYY-MM-DD');
    const startDate = getCurrentTimeInAppTimezone().subtract(30, 'days').format('YYYY-MM-DD');
    
    console.log('AdminDashboard: Setting initial date range:', { startDate, endDate });
    setDateRange({ startDate, endDate, period: 'last_30_days' });
  }, []);

  // Fetch Instagram accounts for filtering
  useEffect(() => {
    const fetchInstagramAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from('meta_analytics')
          .select('account_name, platform')
          .in('client_id', selectedClients.map(id => parseInt(id)))
          .not('account_name', 'is', null)
          .order('account_name');
        
        if (error) {
          console.error('Error fetching Instagram accounts from meta_analytics:', error);
          return;
        }
        
        console.log('Raw data from meta_analytics:', data?.slice(0, 10)); // Show first 10 rows for debugging
        console.log('Total raw records:', data?.length);
        
        // Check what platforms we have
        const platforms = [...new Set(data?.map(row => row.platform).filter(Boolean) || [])];
        console.log('Platforms found:', platforms);
        
        // Filter for Instagram accounts and get unique names
        const instagramAccounts = data?.filter(row => 
          row.platform === 'instagram' || 
          !row.platform || 
          row.platform === null
        ) || [];
        
        console.log('Instagram filtered data:', instagramAccounts.slice(0, 10));
        console.log('Instagram records count:', instagramAccounts.length);
        
        const uniqueAccounts = [...new Set(instagramAccounts.map(row => row.account_name).filter(Boolean))];
        setInstagramAccounts(uniqueAccounts);
        console.log('Instagram accounts from meta_analytics:', uniqueAccounts);
        console.log('Total accounts found:', uniqueAccounts.length);
      } catch (err) {
        console.error('Error fetching Instagram accounts:', err);
      }
    };

    if (selectedClients.length > 0) {
      fetchInstagramAccounts();
    }
  }, [selectedClients]);

  // Fetch all data when date range changes
  useEffect(() => {
    const fetchAllData = async () => {
      if (!dateRange.startDate || !dateRange.endDate) {
        console.log('AdminDashboard: Date range not ready yet:', dateRange);
        return;
      }
      
      console.log('AdminDashboard: Fetching data for date range:', dateRange);
      setLoading(true);
      setError('');

      try {
        // Fetch data from selected clients and aggregate
        console.log('AdminDashboard: Fetching data for clients:', selectedClients.map(id => `${clientNames[id]} (${id})`));
        
            const [allTiktokData, allInstagramData, allFacebookData, accountsData, postsData] = await Promise.all([
              // Fetch TikTok data from selected clients
              Promise.all(selectedClients.map(clientId => 
                fetchDailyAgg(clientId, dateRange.startDate, dateRange.endDate).catch(() => [])
              )).then(results => results.flat()),
              
              // Fetch Instagram data from selected clients
              Promise.all(selectedClients.map(clientId => 
                fetchMetaAnalyticsDailyAgg(clientId, 'instagram', dateRange.startDate, dateRange.endDate, selectedInstagramAccounts.length > 0 ? selectedInstagramAccounts : undefined).catch(() => [])
              )).then(results => results.flat()),
              
              // Fetch Facebook data from selected clients using meta analytics
              Promise.all(selectedClients.map(clientId => 
                fetchMetaAnalyticsDailyAgg(clientId, 'facebook', dateRange.startDate, dateRange.endDate).catch((err) => {
                  console.error(`Failed to fetch Facebook meta analytics for client ${clientId}:`, err);
                  return [];
                })
              )).then(results => results.flat()),
              
              // Fetch accounts for all selected clients
              Promise.all(selectedClients.map(clientId => 
                fetchAccountsWithViews(undefined, clientId).catch(() => [])
              )).then(results => results.flat()),
              fetchTopPosts('7days').catch(err => {
                console.warn('Failed to fetch top posts:', err);
                return [];
              })
            ]);

        const tiktok = allTiktokData;
        
        // Map meta analytics Instagram data to match the expected interface
        const instagram = allInstagramData.map(row => ({
          day: row.day,
          posts: row.total_posts || 0,
          accounts: 0, // This might need to be calculated differently
          views: row.total_views || 0,
          likes: 0, // Not available in meta analytics
          comments: 0, // Not available in meta analytics
          shares: 0, // Not available in meta analytics
          engagement_rate: 0 // This will be calculated by the component
        }));
        
        // Map meta analytics Facebook data to match the expected interface
        const facebook = allFacebookData.map(row => ({
          day: row.day,
          video_views: row.total_views || 0,
          post_engagements: row.total_reach || 0, // Using reach as engagement proxy
        }));

        console.log('AdminDashboard: Data fetched successfully:', {
          tiktok: tiktok.length,
          instagram: instagram.length,
          facebook: facebook.length,
          accounts: accountsData.length,
          posts: postsData.length
        });
        console.log('AdminDashboard: Sample TikTok data:', tiktok.slice(0, 2));
        console.log('AdminDashboard: Sample Instagram data:', instagram.slice(0, 2));
        console.log('AdminDashboard: Raw Facebook meta analytics data:', allFacebookData.slice(0, 2));
        console.log('AdminDashboard: Mapped Facebook data:', facebook.slice(0, 2));

        setTiktokData(tiktok);
        setInstagramData(instagram);
        setFacebookData(facebook);
        setAccounts(accountsData);
        setTopPosts(postsData);

        // Fetch unfiltered Instagram data for comparison if accounts are filtered
        if (selectedInstagramAccounts.length > 0) {
          try {
            const unfilteredInstagramData = await Promise.all(selectedClients.map(clientId => 
              fetchMetaAnalyticsDailyAgg(clientId, 'instagram', dateRange.startDate, dateRange.endDate).catch(() => [])
            )).then(results => results.flat());
            
            const unfilteredInstagram = unfilteredInstagramData.map(row => ({
              day: row.day,
              posts: row.total_posts || 0,
              accounts: 0,
              views: row.total_views || 0,
              likes: 0,
              comments: 0,
              shares: 0,
              engagement_rate: 0
            }));
            
            setInstagramUnfilteredData(unfilteredInstagram);
          } catch (err) {
            console.error('Error fetching unfiltered Instagram data:', err);
            setInstagramUnfilteredData([]);
          }
        } else {
          setInstagramUnfilteredData([]);
        }
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [dateRange, selectedClients, selectedInstagramAccounts]);

  // Calculate aggregated statistics based on selected platforms
  const getAggregatedStats = () => {
    const totalTiktokViews = selectedPlatforms.includes('tiktok') ? tiktokData.reduce((sum, row) => sum + (Number(row.views) || 0), 0) : 0;
    const totalInstagramViews = selectedPlatforms.includes('instagram') ? instagramData.reduce((sum, row) => sum + (Number(row.views) || 0), 0) : 0;
    const totalFacebookViews = selectedPlatforms.includes('facebook') ? facebookData.reduce((sum, row) => sum + (Number(row.video_views) || 0), 0) : 0;
    
    const totalTiktokPosts = selectedPlatforms.includes('tiktok') ? tiktokData.reduce((sum, row) => sum + (Number(row.posts) || 0), 0) : 0;
    const totalInstagramPosts = selectedPlatforms.includes('instagram') ? instagramData.reduce((sum, row) => sum + (Number(row.posts) || 0), 0) : 0;
    
    const totalViews = totalTiktokViews + totalInstagramViews + totalFacebookViews;
    const totalPosts = totalTiktokPosts + totalInstagramPosts;
    
    const filteredAccounts = accounts.filter(acc => selectedPlatforms.includes(acc.platform));
    const totalAccounts = filteredAccounts.length;
    const tiktokAccounts = selectedPlatforms.includes('tiktok') ? accounts.filter(acc => acc.platform === 'tiktok').length : 0;
    const instagramAccounts = selectedPlatforms.includes('instagram') ? accounts.filter(acc => acc.platform === 'instagram').length : 0;
    const facebookAccounts = selectedPlatforms.includes('facebook') ? accounts.filter(acc => acc.platform === 'facebook').length : 0;

    return {
      totalViews,
      totalPosts,
      totalAccounts,
      totalClients: selectedClients.length,
      platformStats: {
        tiktok: { views: totalTiktokViews, posts: totalTiktokPosts, accounts: tiktokAccounts },
        instagram: { views: totalInstagramViews, posts: totalInstagramPosts, accounts: instagramAccounts },
        facebook: { views: totalFacebookViews, posts: 0, accounts: facebookAccounts }
      }
    };
  };

  const stats = getAggregatedStats();
  
  console.log('AdminDashboard: Current stats:', stats);

  // Format numbers with K, M, B suffixes
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Handle account click for Instagram accounts
  const handleAccountClick = async (account: AccountWithViews) => {
    if (account.platform === 'instagram' || account.platform === 'facebook') {
      setSelectedAccount(account);
      setIsModalOpen(true);
      setLoadingAccountData(true);
      
      try {
        // Calculate last 7 days date range (including today)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6); // 6 days ago + today = 7 days total
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        console.log('Fetching data from:', startDateStr, 'to:', endDateStr);
        
        // Fetch individual account daily data from meta analytics (last 7 days)
        const { data, error } = await supabase
          .from('meta_analytics')
          .select('date, views, reach, profile_visits, num_posts')
          .eq('account_name', account.username)
          .eq('platform', account.platform)
          .eq('client_id', account.client_id)
          .gte('date', startDateStr)
          .lte('date', endDateStr)
          .order('date', { ascending: true });
        
        if (error) {
          console.error('Error fetching account daily data:', error);
          setAccountDailyData([]);
        } else {
          console.log('Account daily data:', data);
          setAccountDailyData(data || []);
        }
      } catch (err) {
        console.error('Error fetching account data:', err);
        setAccountDailyData([]);
      } finally {
        setLoadingAccountData(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#18181b] to-[#23272f] flex items-center justify-center">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#18181b] to-[#23272f] flex flex-col items-center py-8 font-sans">
      <div className="w-full max-w-7xl">

        {/* Date Range Selector */}
        <div className="mb-6">
          <DateRangeSelector
            currentRange={dateRange}
            onDateRangeChange={(newRange) => setDateRange(newRange)}
          />
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Client Filter */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">Filter by Client</h3>
            <div className="space-y-2">
              {['1', '2'].map(clientId => (
                <label key={clientId} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(clientId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClients([...selectedClients, clientId]);
                      } else {
                        setSelectedClients(selectedClients.filter(id => id !== clientId));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-slate-300 font-medium">{clientNames[clientId]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Platform Filter */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">Filter by Platform</h3>
            <div className="space-y-2">
              {[
                { id: 'tiktok', name: 'TikTok', color: 'text-green-400' },
                { id: 'instagram', name: 'Instagram', color: 'text-pink-400' },
                { id: 'facebook', name: 'Facebook', color: 'text-blue-400' }
              ].map(platform => (
                <label key={platform.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPlatforms([...selectedPlatforms, platform.id]);
                      } else {
                        setSelectedPlatforms(selectedPlatforms.filter(id => id !== platform.id));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className={`${platform.color} font-medium`}>{platform.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Instagram Account Filter */}
          {selectedPlatforms.includes('instagram') && instagramAccounts.length > 0 && (
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3">Filter Instagram Accounts</h3>
              
              {/* Quick filter buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedInstagramAccounts([])}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedInstagramAccounts.length === 0
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  All Accounts
                </button>
                <button
                  onClick={() => setSelectedInstagramAccounts(instagramAccounts.filter(acc => 
                    !['angelkatiele', 'baddiekatiele', 'funwithkatiee'].includes(acc)
                  ))}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedInstagramAccounts.length > 0 && 
                    selectedInstagramAccounts.length === instagramAccounts.length - 3 &&
                    !selectedInstagramAccounts.some(acc => ['angelkatiele', 'baddiekatiele', 'funwithkatiee'].includes(acc))
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  No Meme
                </button>
                <button
                  onClick={() => setSelectedInstagramAccounts(instagramAccounts.filter(acc => 
                    ['angelkatiele', 'baddiekatiele', 'funwithkatiee'].includes(acc)
                  ))}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedInstagramAccounts.length === 3 &&
                    selectedInstagramAccounts.every(acc => ['angelkatiele', 'baddiekatiele', 'funwithkatiee'].includes(acc))
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  Meme Accounts
                </button>
              </div>

              {/* Account checkboxes in horizontal grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                {instagramAccounts.map(account => (
                  <label key={account} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-white/5 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedInstagramAccounts.includes(account)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInstagramAccounts([...selectedInstagramAccounts, account]);
                        } else {
                          setSelectedInstagramAccounts(selectedInstagramAccounts.filter(acc => acc !== account));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-pink-400 font-medium text-sm truncate" title={account}>{account}</span>
                  </label>
                ))}
              </div>
              
              {selectedInstagramAccounts.length > 0 && (
                <div className="mt-3 text-xs text-slate-400">
                  {selectedInstagramAccounts.length} account{selectedInstagramAccounts.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          )}

        </div>

        {/* Active Filters Summary */}
        <div className="mb-6 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-2">Active Filters</h3>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-slate-300">
              <strong>Clients:</strong> {selectedClients.length === 2 ? 'All (Katie, Daisy)' : selectedClients.map(id => clientNames[id]).join(', ')}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-sm text-slate-300">
              <strong>Platforms:</strong> {selectedPlatforms.length === 3 ? 'All (TikTok, Instagram, Facebook)' : selectedPlatforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}
            </span>
            {selectedPlatforms.includes('instagram') && selectedInstagramAccounts.length > 0 && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-sm text-slate-300">
                  <strong>Instagram Accounts:</strong> {selectedInstagramAccounts.length} selected ({selectedInstagramAccounts.slice(0, 2).join(', ')}{selectedInstagramAccounts.length > 2 ? ` +${selectedInstagramAccounts.length - 2} more` : ''})
                </span>
              </>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Enhanced Statistics Overview */}
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Total Views</h3>
              <p className="text-3xl font-bold text-blue-400">
                {stats.totalViews.toLocaleString()}
              </p>
              <p className="text-sm text-slate-400 mt-1">Across all platforms</p>
            </div>
            
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Total Posts</h3>
              <p className="text-3xl font-bold text-green-400">
                {stats.totalPosts.toLocaleString()}
              </p>
              <p className="text-sm text-slate-400 mt-1">TikTok + Instagram</p>
            </div>
            
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Total Accounts</h3>
              <p className="text-3xl font-bold text-purple-400">
                {stats.totalAccounts}
              </p>
              <p className="text-sm text-slate-400 mt-1">All platforms</p>
            </div>
            
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Active Clients</h3>
              <p className="text-3xl font-bold text-orange-400">
                {stats.totalClients}
              </p>
              <p className="text-sm text-slate-400 mt-1">With active accounts</p>
            </div>
          </div>
        </div>

        {/* Active Accounts Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Active Accounts Overview</h2>
            <div className="text-sm text-slate-400">
              Total: {accounts.filter(acc => selectedPlatforms.includes(acc.platform)).length} accounts
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {selectedClients.map(clientId => {
              const clientAccounts = accounts.filter(acc => 
                acc.client_id === parseInt(clientId) && selectedPlatforms.includes(acc.platform)
              );
              console.log(`AdminDashboard: Client ${clientId} (${clientNames[clientId]}) accounts:`, {
                total: accounts.length,
                filtered: clientAccounts.length,
                sample: clientAccounts[0]
              });
              
              // Debug TikTok profile picture URLs
              const tiktokAccounts = clientAccounts.filter(acc => acc.platform === 'tiktok');
              if (tiktokAccounts.length > 0) {
                console.log(`TikTok accounts for ${clientNames[clientId]}:`, tiktokAccounts.map(acc => ({
                  username: acc.username,
                  pfp_url: acc.pfp_url,
                  has_pfp: !!acc.pfp_url
                })));
              }
              const platformGroups = clientAccounts.reduce((groups, account) => {
                const platform = account.platform;
                if (!groups[platform]) {
                  groups[platform] = [];
                }
                groups[platform].push(account);
                return groups;
              }, {} as Record<string, typeof clientAccounts>);

              return (
                <div key={clientId} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">{clientNames[clientId]}</h3>
                    <span className="text-sm text-slate-400">
                      {clientAccounts.length} account{clientAccounts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {Object.keys(platformGroups).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(platformGroups).map(([platform, platformAccounts]) => (
                        <div key={platform} className="border border-white/10 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-3 h-3 rounded-full ${
                              platform === 'tiktok' ? 'bg-green-400' :
                              platform === 'instagram' ? 'bg-pink-400' :
                              'bg-blue-400'
                            }`}></div>
                            <h4 className="text-white font-medium capitalize">{platform}</h4>
                            <span className="text-sm text-slate-400">
                              ({platformAccounts.length} account{platformAccounts.length !== 1 ? 's' : ''})
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            {platformAccounts.map((account, index) => (
                              <div 
                                key={index} 
                                className={`flex items-center justify-between bg-white/5 rounded-lg p-3 ${
                                  (account.platform === 'instagram' || account.platform === 'facebook') ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''
                                }`}
                                onClick={() => handleAccountClick(account)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white/10">
                                    {account.pfp_url ? (
                                      <img 
                                        src={account.pfp_url} 
                                        alt={`${account.username} profile`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // Fallback to initial if image fails to load
                                          console.log(`Profile picture failed to load for ${account.username} (${account.platform}):`, account.pfp_url);
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.innerHTML = `<span class="text-xs font-medium text-white">${account.username?.charAt(0).toUpperCase() || '?'}</span>`;
                                          }
                                        }}
                                      />
                                    ) : (
                                      <span className="text-xs font-medium text-white">
                                        {account.username?.charAt(0).toUpperCase() || '?'}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <a 
                                        href={account.profile_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-white font-medium text-sm hover:text-blue-400 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {account.username || 'Unknown Account'}
                                      </a>
                                      <svg 
                                        className="w-3 h-3 text-slate-400 flex-shrink-0" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-white text-sm font-medium">
                                    {account.views_count_total ? account.views_count_total.toLocaleString() : '0'} views
                                  </p>
                                  <p className="text-slate-400 text-xs">
                                    {account.followers ? account.followers.toLocaleString() : '0'} followers
                                  </p>
                                  <p className="text-slate-500 text-xs">
                                    {account.post_count || 0} posts
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-400">No accounts found for selected platforms</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Combined Platform Charts */}
        <div className="space-y-8">
          {tiktokData.length > 0 || instagramData.length > 0 || facebookData.length > 0 ? (
            <>
              <AllPlatformsTotalViewsChart
                tiktokData={selectedPlatforms.includes('tiktok') ? tiktokData : []}
                instagramData={selectedPlatforms.includes('instagram') ? instagramData : []}
                facebookData={selectedPlatforms.includes('facebook') ? facebookData : []}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />

              <AllPlatformsDailyViewsChart
                tiktokData={selectedPlatforms.includes('tiktok') ? tiktokData : []}
                instagramData={selectedPlatforms.includes('instagram') ? instagramData : []}
                facebookData={selectedPlatforms.includes('facebook') ? facebookData : []}
                instagramUnfilteredData={selectedPlatforms.includes('instagram') && selectedInstagramAccounts.length > 0 ? instagramUnfilteredData : []}
                showInstagramComparison={selectedPlatforms.includes('instagram') && selectedInstagramAccounts.length > 0}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />

              <AllPlatformsDailyPostsChart
                tiktokData={selectedPlatforms.includes('tiktok') ? tiktokData : []}
                instagramData={selectedPlatforms.includes('instagram') ? instagramData : []}
                facebookData={selectedPlatforms.includes('facebook') ? facebookData : []}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />
            </>
          ) : (
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-8 text-center">
              <h3 className="text-xl font-semibold text-white mb-4">No Data Available</h3>
              <p className="text-slate-300 mb-4">
                No platform data found for the selected date range. This could mean:
              </p>
              <ul className="text-slate-400 text-left max-w-md mx-auto space-y-2">
                <li>• No accounts have been set up yet</li>
                <li>• No data has been collected for this period</li>
                <li>• The data collection system needs to be initialized</li>
              </ul>
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top Performing Posts */}
        {topPosts.length > 0 && (
          <div className="mt-8 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Top Performing Posts (Last 7 Days)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topPosts.slice(0, 6).map((post, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <img 
                      src={post.platform === 'tiktok' ? '/tiktok-1.svg' : '/ig.svg'} 
                      alt={post.platform} 
                      className="h-4 w-4" 
                    />
                    <span className="text-sm text-slate-300 capitalize">{post.platform}</span>
                  </div>
                  <p className="text-white text-sm font-semibold mb-1">
                    {post.views?.toLocaleString() || 0} views
                  </p>
                  <p className="text-slate-400 text-xs truncate">
                    {post.caption || 'No caption'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account Details Modal */}
        {isModalOpen && selectedAccount && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#18181b] to-[#23272f] rounded-xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-white/10">
                    {selectedAccount.pfp_url ? (
                      <img 
                        src={selectedAccount.pfp_url} 
                        alt={`${selectedAccount.username} profile`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<span class="text-lg font-medium text-white">${selectedAccount.username?.charAt(0).toUpperCase() || '?'}</span>`;
                          }
                        }}
                      />
                    ) : (
                      <span className="text-lg font-medium text-white">
                        {selectedAccount.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <a 
                        href={selectedAccount.profile_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-2xl font-bold text-white hover:text-blue-400 transition-colors"
                      >
                        {selectedAccount.username}
                      </a>
                      <svg 
                        className="w-4 h-4 text-slate-400 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    <p className="text-slate-400 capitalize">{selectedAccount.platform} Account</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white text-2xl transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Account Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {formatNumber(selectedAccount.views_count_total || 0)}
                  </div>
                  <div className="text-sm text-slate-400">Total Views</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {formatNumber(selectedAccount.followers || 0)}
                  </div>
                  <div className="text-sm text-slate-400">Followers</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {formatNumber(selectedAccount.post_count || 0)}
                  </div>
                  <div className="text-sm text-slate-400">Posts</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {formatNumber(selectedAccount.average_views || 0)}
                  </div>
                  <div className="text-sm text-slate-400">Avg Views</div>
                </div>
              </div>

              {/* Views Over Time Chart */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Views Over Time (Last 7 Days)</h3>
                {loadingAccountData ? (
                  <div className="bg-white/5 rounded-lg p-8 text-center">
                    <div className="text-slate-400">Loading chart data...</div>
                  </div>
                ) : accountDailyData.length > 0 ? (
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="h-48 w-full relative">
                      {/* Tooltip */}
                      <div 
                        id="chart-tooltip" 
                        className="absolute bg-black/90 text-white text-xs px-2 py-1 rounded pointer-events-none z-10 opacity-0 transition-opacity"
                        style={{ top: '10px', left: '10px' }}
                      >
                        <div id="tooltip-content"></div>
                      </div>
                      
                      <svg width="100%" height="100%" viewBox="0 0 600 180" className="overflow-visible">
                        {/* Background grid lines */}
                        <defs>
                          <pattern id="grid" width="60" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        
                        {/* Chart area */}
                        {(() => {
                          const maxViews = Math.max(...accountDailyData.map(d => d.views || 0));
                          const minViews = Math.min(...accountDailyData.map(d => d.views || 0));
                          const range = maxViews - minViews || 1;
                          const width = 600;
                          const height = 180;
                          const padding = 60;
                          
                          const points = accountDailyData.map((d, i) => {
                            const x = padding + (i / (accountDailyData.length - 1)) * (width - 2 * padding);
                            const y = height - padding - ((d.views - minViews) / range) * (height - 2 * padding);
                            return `${x},${y}`;
                          }).join(' ');
                          
                          return (
                            <>
                              {/* Area fill */}
                              <polygon
                                points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
                                fill="rgba(59, 130, 246, 0.1)"
                                stroke="none"
                              />
                              {/* Line */}
                              <polyline
                                points={points}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="3"
                              />
                              {/* Data points */}
                              {accountDailyData.map((d, i) => {
                                const x = padding + (i / (accountDailyData.length - 1)) * (width - 2 * padding);
                                const y = height - padding - ((d.views - minViews) / range) * (height - 2 * padding);
                                return (
                                  <circle
                                    key={i}
                                    cx={x}
                                    cy={y}
                                    r="5"
                                    fill="#3b82f6"
                                    stroke="white"
                                    strokeWidth="2"
                                    className="cursor-pointer hover:r-6 transition-all"
                                    onMouseEnter={(e) => {
                                      const tooltip = document.getElementById('chart-tooltip');
                                      const content = document.getElementById('tooltip-content');
                                      if (tooltip && content) {
                                        content.innerHTML = `
                                          <div class="font-semibold">${new Date(d.date).toLocaleDateString('en-US', { 
                                            weekday: 'short', 
                                            month: 'short', 
                                            day: 'numeric' 
                                          })}</div>
                                          <div>${(d.views || 0).toLocaleString()} views</div>
                                        `;
                                        tooltip.style.opacity = '1';
                                        tooltip.style.left = `${e.clientX - 100}px`;
                                        tooltip.style.top = `${e.clientY - 50}px`;
                                      }
                                    }}
                                    onMouseLeave={() => {
                                      const tooltip = document.getElementById('chart-tooltip');
                                      if (tooltip) {
                                        tooltip.style.opacity = '0';
                                      }
                                    }}
                                  />
                                );
                              })}
                            </>
                          );
                        })()}
                        
                        {/* Y-axis labels */}
                        {(() => {
                          const maxViews = Math.max(...accountDailyData.map(d => d.views || 0));
                          const minViews = Math.min(...accountDailyData.map(d => d.views || 0));
                          const range = maxViews - minViews || 1;
                          const steps = 4;
                          
                          return Array.from({ length: steps + 1 }, (_, i) => {
                            const value = minViews + (range * i) / steps;
                            const y = 180 - 60 - ((value - minViews) / range) * 60;
                            return (
                              <text
                                key={i}
                                x="10"
                                y={y + 4}
                                fill="rgba(255,255,255,0.7)"
                                fontSize="11"
                                textAnchor="start"
                              >
                                {formatNumber(value)}
                              </text>
                            );
                          });
                        })()}
                        
                        {/* X-axis labels */}
                        {accountDailyData.map((d, i) => {
                          const x = 60 + (i / (accountDailyData.length - 1)) * 480;
                          return (
                            <text
                              key={i}
                              x={x}
                              y="170"
                              fill="rgba(255,255,255,0.7)"
                              fontSize="10"
                              textAnchor="middle"
                            >
                              {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </text>
                          );
                        })}
                      </svg>
                    </div>
                    <div className="mt-2 text-center text-xs text-slate-400">
                      Hover over points to see exact numbers
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-lg p-8 text-center">
                    <div className="text-slate-400">No data available for the last 7 days</div>
                  </div>
                )}
              </div>

              {/* Account Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Account Information</h3>
                  <div className="bg-white/5 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bio:</span>
                      <span className="text-white">{selectedAccount.bio || 'No bio'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Niche:</span>
                      <span className="text-white">{selectedAccount.account_niche || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-white capitalize">{selectedAccount.account_status || 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Performance Metrics</h3>
                  <div className="bg-white/5 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Likes:</span>
                      <span className="text-white">{formatNumber(selectedAccount.likes_count_total || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Comments:</span>
                      <span className="text-white">{formatNumber(selectedAccount.comments_count_total || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Shares:</span>
                      <span className="text-white">{formatNumber(selectedAccount.shares_count_total || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Profile Views:</span>
                      <span className="text-white">{formatNumber(selectedAccount.profile_views || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Last 7 Days Views Breakdown */}
                {accountDailyData.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Last 7 Days Views</h3>
                    <div className="bg-white/5 rounded-lg p-4 space-y-2">
                      {accountDailyData.map((day, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-slate-400">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}:
                          </span>
                          <span className="text-white font-medium">{formatNumber(day.views || 0)}</span>
                        </div>
                      ))}
                      <div className="border-t border-white/10 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 font-medium">Total (7 days):</span>
                          <span className="text-white font-bold">
                            {formatNumber(accountDailyData.reduce((sum, day) => sum + (day.views || 0), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
