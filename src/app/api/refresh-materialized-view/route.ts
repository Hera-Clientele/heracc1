import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Call the refresh function
    const { data, error } = await supabase.rpc('manual_refresh_instagram_view');
    
    if (error) {
      console.error('Materialized view refresh error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Materialized view refreshed:', data);
    return Response.json({ 
      success: true, 
      message: data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint to check refresh status
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('mv_instagram_daily_totals')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    return Response.json({ 
      status: 'active',
      recordCount: data?.[0]?.count || 0,
      lastChecked: new Date().toISOString()
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 