
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function check() {
  console.log('--- Checking Plans Table ---');
  const { data, error } = await supabase.from('plans').select('*').limit(1);
  if (error) {
    console.error('Plan table error:', error.message);
  } else {
    console.log('✅ Plan table exists. Columns:', Object.keys(data[0] || {}).join(', '));
  }

  console.log('--- Checking RPC exists ---');
  const { data: rpc, error: rpcError } = await supabase.rpc('update_plan_direct', {
    p_id: 1,
    p_name: 'TEST',
    p_months: 1,
    p_price: '0,00',
    p_description: '',
    p_features: '',
    p_billing_cycle: 'monthly',
    p_is_popular: false
  });
  if (rpcError) {
    if (rpcError.message.includes('not found')) {
      console.log('❌ RPC update_plan_direct NOT FOUND');
    } else {
      console.log('✅ RPC update_plan_direct exists (returned error but found):', rpcError.message);
    }
  } else {
    console.log('✅ RPC update_plan_direct exists and worked!');
  }
}

check();
