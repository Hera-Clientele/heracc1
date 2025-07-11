import { createClient } from '@supabase/supabase-js';

export interface AccountWithViews {
  username: string;
  profile_url: string;
  total_views: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function fetchAccountsWithViews(): Promise<AccountWithViews[]> {
  const { data, error } = await supabase
    .from('latest_snapshots')
    .select('username, profile_url, views')
    .order('username', { ascending: true });
  if (error) throw error;
  // Aggregate views by username/profile_url
  const accountMap: Record<string, AccountWithViews> = {};
  for (const row of data || []) {
    if (!row.username || !row.profile_url) continue;
    const key = row.username + '|' + row.profile_url;
    if (!accountMap[key]) {
      accountMap[key] = {
        username: row.username,
        profile_url: row.profile_url,
        total_views: 0,
      };
    }
    accountMap[key].total_views += row.views || 0;
  }
  return Object.values(accountMap).sort((a, b) => b.total_views - a.total_views);
} 