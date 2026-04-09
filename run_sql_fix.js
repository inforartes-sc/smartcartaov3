import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runFix() {
  const sql = fs.readFileSync('fix_products_schema.sql', 'utf8');
  console.log('Running SQL Fix...');
  
  // Try running each command separately to avoid parser issues
  const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
  
  for (const cmd of commands) {
    console.log(`Executing: ${cmd.substring(0, 50)}...`);
    const { error } = await supabase.rpc('run_sql', { sql_query: cmd });
    if (error) {
      // If RPC run_sql doesn't exist, we might need another way or it might fail
      console.error('Error executing via RPC:', error.message);
      
      // Fallback: This is a hacky way but common in some setups
      // If the above fails, it means 'run_sql' function is not defined in Postgres
    } else {
      console.log('Success!');
    }
  }
}

runFix();
