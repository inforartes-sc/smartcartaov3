
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCols() {
  console.log('--- START ---');
  // Try to get one record to see columns
  const { data, error } = await supabase.from('plans').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns found from record:', Object.keys(data[0]));
  } else {
    // If empty, try to insert a dummy and see error or keys
    const dummy = { name: 'DUMMY' };
    const { data: insData, error: insError } = await supabase.from('plans').insert(dummy).select();
    if (insData) {
      console.log('Columns found from dummy insert:', Object.keys(insData[0]));
      // Clean up
      await supabase.from('plans').delete().eq('name', 'DUMMY');
    } else {
      console.error('Insert Error (might show columns):', insError.message);
    }
  }
}

checkCols();
