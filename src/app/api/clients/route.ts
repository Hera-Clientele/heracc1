import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Client {
  client_id: string;
  model?: string;
}

export async function GET(req: NextRequest) {
  try {
    // Fetch unique client IDs from the clients table
    const { data, error } = await supabase
      .from('clients')
      .select('client_id, model')
      .not('client_id', 'is', null);

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    // Get unique clients and sort them
    const uniqueClients = (data || []).reduce((acc: Client[], item) => {
      const existingClient = acc.find(client => client.client_id === item.client_id);
      if (!existingClient) {
        acc.push({
          client_id: item.client_id.toString(),
          model: item.model
        });
      }
      return acc;
    }, []);

    // Sort by client_id
    uniqueClients.sort((a, b) => parseInt(a.client_id) - parseInt(b.client_id));

    return Response.json({ 
      clients: uniqueClients,
      total: uniqueClients.length
    });
  } catch (error: any) {
    console.error('API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
} 