
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function addCols() {
  console.log('Adding columns via execute_sql...');
  
  const queries = [
    "ALTER TABLE plans ADD COLUMN IF NOT EXISTS agencies TEXT;",
    "ALTER TABLE plans ADD COLUMN IF NOT EXISTS quota TEXT;",
    "ALTER TABLE plans ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';",
    "ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;",
    "ALTER TABLE plans ADD COLUMN IF NOT EXISTS months INTEGER DEFAULT 1;",
    "NOTIFY pgrst, 'reload schema';"
  ];

  for(const sql of queries) {
    console.log(`Executing: ${sql}`);
    // Try both common argument names
    let { error } = await supabase.rpc('execute_sql', { sql: sql });
    if (error) {
       console.log('Retrying with sql_query argument...');
       let { error: error2 } = await supabase.rpc('execute_sql', { sql_query: sql });
       if (error2) {
         console.error('Failed both attempts:', error2.message);
       } else {
         console.log('Success with sql_query!');
       }
    } else {
      console.log('Success with sql!');
    }
  }
}

addCols();
