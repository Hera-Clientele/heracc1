const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateMaterializedView() {
  try {
    console.log('🔄 Updating materialized view...');
    
    // Read the SQL file
    const sql = fs.readFileSync('UPDATE_MATERIALIZED_VIEW.sql', 'utf8');
    
    // Split into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          console.error('❌ Error executing statement:', error);
          return;
        }
      }
    }
    
    console.log('✅ Materialized view updated successfully!');
    console.log('📊 The view now includes TikTok and YouTube specific fields');
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

updateMaterializedView();
