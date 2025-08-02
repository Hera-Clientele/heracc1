import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('username, account_status, platform')
      .order('account_status', { ascending: true });

    if (error) throw error;

    // Group by status to see what values exist
    const statusCounts: Record<string, number> = {};
    const statusExamples: Record<string, string[]> = {};
    
    data?.forEach(account => {
      const status = account.account_status || 'null';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      if (!statusExamples[status]) statusExamples[status] = [];
      if (statusExamples[status].length < 3) {
        statusExamples[status].push(account.username);
      }
    });

    return NextResponse.json({
      totalAccounts: data?.length || 0,
      statusCounts,
      statusExamples,
      allStatuses: [...new Set(data?.map(a => a.account_status).filter(Boolean))],
      sampleData: data?.slice(0, 5)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 