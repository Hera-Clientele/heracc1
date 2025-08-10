import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables:', { 
    supabaseUrl: !!supabaseUrl, 
    supabaseKey: !!supabaseKey 
  });
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function POST(request: NextRequest) {
  try {
    console.log('Refreshing all materialized views...');
    
    // Call the database function to refresh all materialized views
    console.log('Attempting to call refresh_all_materialized_views()...');
    const { data, error } = await supabase.rpc('refresh_all_materialized_views');
    
    if (error) {
      console.error('Error calling refresh function:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Fallback: try to refresh individual views
      console.log('Falling back to fallback refresh method...');
      return await fallbackRefresh();
    }
    
    console.log('Function call successful, processing results...');
    console.log('Raw results:', data);
    
    // Process the results from the function
    const results = data || [];
    const successCount = results.filter((r: any) => r.status === 'SUCCESS').length;
    const errorCount = results.filter((r: any) => r.status === 'ERROR').length;
    const totalViews = results.length;
    
    console.log(`Refresh complete: ${successCount}/${totalViews} views refreshed successfully`);
    
    if (errorCount > 0) {
      console.warn('Some views failed to refresh:', results.filter((r: any) => r.status === 'ERROR'));
    }
    
    return NextResponse.json({ 
      success: errorCount === 0,
      message: `Refreshed ${successCount}/${totalViews} materialized views`,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in refresh-account-health API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Fallback refresh method if the function doesn't exist
async function fallbackRefresh() {
  console.log('Using fallback refresh method...');
  
  const materializedViews = [
    'hera_account_health',
    'mv_tiktok_top_posts_enhanced',
    'mv_instagram_daily_totals',
    'mv_tiktok_daily_totals',
    'mv_instagram_top_posts_enhanced'
  ];
  
  const results = [];
  const errors = [];
  
  for (const viewName of materializedViews) {
    try {
      console.log(`Simulating refresh of ${viewName}...`);
      
      // Simulate refresh since we can't execute DDL directly
      results.push({ 
        view_name: viewName,
        status: 'SIMULATED',
        message: 'Refresh simulated (function not available)',
        refresh_time: new Date().toISOString()
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (viewError) {
      console.error(`Error with ${viewName}:`, viewError);
      errors.push({ 
        view_name: viewName,
        status: 'ERROR',
        message: 'Simulation failed',
        refresh_time: new Date().toISOString()
      });
    }
  }
  
  const successCount = results.length;
  const errorCount = errors.length;
  const totalViews = materializedViews.length;
  
  return NextResponse.json({ 
    success: errorCount === 0,
    message: `Simulated refresh of ${successCount}/${totalViews} materialized views`,
    results: [...results, ...errors],
    note: 'This is a simulated refresh. Run CREATE_REFRESH_FUNCTION.sql in Supabase to enable real refresh.',
    timestamp: new Date().toISOString()
  });
}

// Also allow GET requests for easier testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to refresh all materialized views',
    endpoint: '/api/refresh-account-health',
    method: 'POST',
    views: [
      'hera_account_health',
      'mv_tiktok_top_posts_enhanced', 
      'mv_instagram_daily_totals',
      'mv_tiktok_daily_totals',
      'mv_instagram_top_posts_enhanced'
    ],
    setup: 'Run CREATE_REFRESH_FUNCTION.sql in Supabase SQL editor to enable real refresh functionality'
  });
} 