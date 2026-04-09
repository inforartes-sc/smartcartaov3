
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'plans' });
  if (error) {
    // If RPC doesn't exist, try a simple select
    console.log('Checking columns via select...');
    const { data: sample, error: sampleError } = await supabase.from('plans').select('*').limit(1);
    if (sampleError) {
      console.error('Error:', sampleError.message);
    } else {
      console.log('Sample row / Columns:', sample);
    }
  } else {
    console.log('Columns:', data);
  }
}

checkSchema();
