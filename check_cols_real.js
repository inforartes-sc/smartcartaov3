
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkCols() {
  const { data, error } = await supabase.from('plans').select('*').limit(1);
  if (error) {
    console.error('Error:', error.message);
  } else if (data.length > 0) {
    console.log('Columns in plans table:', Object.keys(data[0]));
  } else {
    console.log('Table is empty, trying to insert test row...');
    const { error: insertError } = await supabase.from('plans').insert({ name: 'Test' }).select();
    if (insertError) console.error('Insert failed:', insertError.message);
    else {
        const { data: data2 } = await supabase.from('plans').select('*').eq('name', 'Test');
        if (data2) console.log('Columns:', Object.keys(data2[0]));
        await supabase.from('plans').delete().eq('name', 'Test');
    }
  }
}

checkCols();
