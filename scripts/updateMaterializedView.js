const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateMaterializedView() {
  try {
    console.log('🔄 Updating materialized view...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'UPDATE_MATERIALIZED_VIEW.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error updating materialized view:', error);
      process.exit(1);
    }
    
    console.log('✅ Materialized view updated successfully!');
    console.log('📊 The view now includes TikTok and YouTube specific fields');
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

updateMaterializedView();
