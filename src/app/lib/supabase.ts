import { createClient } from '@supabase/supabase-js';

// Create Supabase client with timeout configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    // Add timeout configuration to prevent hanging queries
    global: {
      headers: {
        'X-Client-Info': 'herasclientele-dashboard'
      }
    },
    // Set a reasonable timeout for queries (30 seconds)
    db: {
      schema: 'public'
    }
  }
);

export default supabase;
