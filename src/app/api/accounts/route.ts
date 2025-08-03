import { NextRequest } from 'next/server';
import { fetchAccountsWithViews } from '../../lib/fetchAccountsWithViews';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform') as 'tiktok' | 'instagram' | undefined;
    const clientId = searchParams.get('clientId');
    
    if (!clientId) {
      return Response.json({ error: 'Client ID is required' }, { status: 400 });
    }
    
    // If clientId is 'all', don't filter by client_id
    const actualClientId = clientId === 'all' ? undefined : clientId;
    
    const accounts = await fetchAccountsWithViews(platform, actualClientId);
    return Response.json({ accounts });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 