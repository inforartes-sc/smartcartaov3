
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addCols() {
  console.log('Adding columns...');
  const { error } = await supabase.rpc('run_sql', { 
    sql_query: "ALTER TABLE plans ADD COLUMN IF NOT EXISTS agencies TEXT; ALTER TABLE plans ADD COLUMN IF NOT EXISTS quota TEXT;" 
  });
  
  if (error) {
    console.error('Error adding columns:', error.message);
  } else {
    console.log('SUCCESS! Columns added.');
    // Force reload
    await supabase.rpc('run_sql', { sql_query: "NOTIFY pgrst, 'reload schema';" });
  }
}

addCols();
