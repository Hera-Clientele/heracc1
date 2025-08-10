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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const clientId = searchParams.get('clientId');
    const username = searchParams.get('username'); // Optional: for specific account

    if (!platform || !clientId) {
      return NextResponse.json(
        { error: 'Missing platform or clientId parameter' },
        { status: 400 }
      );
    }

    console.log('Fetching health data for platform:', platform, 'clientId:', clientId, 'username:', username);
    
    // Build the query - simply select from the table
    let query = supabase
      .from('hera_account_health')
      .select('*')
      .eq('platform', platform)
      .eq('client_id', BigInt(clientId));

    // If username is provided, filter by it as well
    if (username) {
      query = query.eq('username', username);
    }

    const { data, error } = await query;
    
    console.log('API response:', { data, error, count: data?.length || 0 });
    
    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      return NextResponse.json(
        { error: 'Failed to fetch account health data', details: error.message },
        { status: 500 }
      );
    }

    // Return the data as-is from the table
    return NextResponse.json({ 
      health: data || [],
      count: data?.length || 0,
      platform,
      clientId
    });
    
  } catch (error) {
    console.error('Error in account-health API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 