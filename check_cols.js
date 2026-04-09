
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCols() {
  const { data, error } = await supabase.rpc('run_sql', { 
    sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'plans';" 
  });
  
  if (error) {
    console.error('Error:', error.message);
    // If run_sql fails, try another way or just try to insert one by one skiping errors
  } else {
    console.log('Columns:', JSON.stringify(data, null, 2));
  }
}

checkCols();
