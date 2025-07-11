import { NextRequest } from 'next/server';
import { fetchAccountsWithViews } from '../../lib/fetchAccountsWithViews';

export async function GET(req: NextRequest) {
  try {
    const accounts = await fetchAccountsWithViews();
    return Response.json({ accounts });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 