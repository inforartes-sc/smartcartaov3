import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function addCols() {
  const queries = [
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS landing_catalog_btn_link_auto TEXT",
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS landing_catalog_btn_link_real TEXT"
  ];
  
  for (const sql_query of queries) {
    console.log(`Executing: ${sql_query}`);
    const { error } = await supabase.rpc('run_sql', { sql_query });
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('Success!');
    }
  }
}

addCols();
