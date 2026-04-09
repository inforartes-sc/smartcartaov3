
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkPlans() {
  const { data: plans, error } = await supabase.from('plans').select('*').order('id', { ascending: true });
  if (error) {
    console.error(error);
  } else {
    console.log('--- PLANS START ---');
    plans.forEach(p => {
      console.log(`PLAN ID: ${p.id} Name: ${p.name} Quota: ${p.quota} Agencies: ${p.agencies}`);
    });
    console.log('--- PLANS END ---');
  }
}

checkPlans();
