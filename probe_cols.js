
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkColumns() {
  const { data, error } = await supabase.from('plans').select('*').limit(0);
  if (error) {
    console.error('Error:', error.message);
  } else {
    // If no rows, we can't see columns this way in JS client usually unless we use RPC
  }

  // Try RPC if available or raw SQL via another method
  // Let's just try to insert one by one to see which column fails
}

async function probeColumns() {
  const testPlan = { name: 'Test', price: '0', description: 'test' };
  const { error } = await supabase.from('plans').insert(testPlan);
  if (error) {
    console.error('Core insert failed:', error.message);
  } else {
    console.log('Core insert success. Now testing months...');
    const { error: error2 } = await supabase.from('plans').insert({ ...testPlan, months: 1 });
    if (error2) console.error('Months test failed:', error2.message);
    else console.log('Months test success.');

    const { error: error3 } = await supabase.from('plans').insert({ ...testPlan, quota: '1' });
    if (error3) console.error('Quota test failed:', error3.message);
    else console.log('Quota test success.');

    const { error: error4 } = await supabase.from('plans').insert({ ...testPlan, agencies: '1' });
    if (error4) console.error('Agencies test failed:', error4.message);
    else console.log('Agencies test success.');
    
    // Cleanup
    await supabase.from('plans').delete().eq('name', 'Test');
  }
}

probeColumns();
