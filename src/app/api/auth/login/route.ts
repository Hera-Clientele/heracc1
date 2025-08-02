import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    if (!username || !password) {
      return Response.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Convert username to bigint (client_id)
    const clientId = BigInt(username);
    
    // Query the clients table to verify credentials
    const { data, error } = await supabase
      .from('clients')
      .select('client_id, model')
      .eq('client_id', clientId.toString())
      .eq('password', password)
      .single();

    if (error || !data) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Return client information (without password)
    return Response.json({ 
      success: true, 
      client_id: data.client_id,
      model: data.model 
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return Response.json({ error: 'Authentication failed' }, { status: 500 });
  }
} 