import { NextRequest } from 'next/server';
import { syncFromGoogleSheets } from '../../../lib/googleSheetsIntegration';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sheetData } = body;
    
    if (!sheetData || !Array.isArray(sheetData)) {
      return Response.json({ error: 'sheetData array is required' }, { status: 400 });
    }
    
    console.log('Google Sheets sync API: Starting sync with', sheetData.length, 'rows');
    
    const result = await syncFromGoogleSheets(sheetData);
    
    return Response.json({ 
      success: true, 
      message: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Google Sheets sync API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const platform = searchParams.get('platform') as 'instagram' | 'facebook' | undefined;
    
    if (!clientId) {
      return Response.json({ error: 'Client ID is required' }, { status: 400 });
    }
    
    // Return sync status and last sync info
    return Response.json({
      status: 'ready',
      lastSync: new Date().toISOString(),
      clientId,
      platform,
      message: 'Google Sheets sync endpoint is ready'
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}





