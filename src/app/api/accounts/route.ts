import { NextRequest } from 'next/server';
import { fetchAccountsWithViews } from '../../lib/fetchAccountsWithViews';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform') as 'tiktok' | 'instagram' | undefined;
    const clientId = searchParams.get('clientId');
    
    console.log('accounts API called with platform:', platform, 'clientId:', clientId);
    
    if (!clientId) {
      console.error('accounts API: Client ID is required');
      return Response.json({ error: 'Client ID is required' }, { status: 400 });
    }
    
    // If clientId is 'all', don't filter by client_id
    const actualClientId = clientId === 'all' ? undefined : clientId;
    
    console.log('accounts API: Calling fetchAccountsWithViews...');
    const accounts = await fetchAccountsWithViews(platform, actualClientId);
    console.log('accounts API returning:', { count: accounts?.length || 0, sample: accounts?.[0] });
    return Response.json({ accounts });
  } catch (error: any) {
    console.error('accounts API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
} 