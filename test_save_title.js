import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function testUpdate() {
  const { data, error } = await supabase.from('system_settings').update({
    landing_features_title: 'TESTE DE SALVAMENTO'
  }).eq('id', 1).select();
  
  if (error) console.error(error);
  else console.log('Update Success:', data);
}
testUpdate();
