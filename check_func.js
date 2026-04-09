
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkFunction() {
  const { data, error } = await supabase.rpc('run_sql', { 
    sql_query: "SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_name = 'update_plan_direct' AND routine_schema = 'public';"
  }).catch(() => ({ data: null, error: { message: 'run_sql failed' } }));

  if (error) {
    console.log('Function check failed via RPC. Testing directly...');
    // If we can't check, we'll just try to redefine it.
  } else {
    console.log('Function info:', data);
  }
}

checkFunction();
