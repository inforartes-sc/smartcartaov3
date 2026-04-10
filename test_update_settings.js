import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function update() {
  const { data, error } = await supabase.from('system_settings').update({
    landing_catalog_btn_link_auto: 'https://smartcartao.com.br/veiculos-demo',
    landing_catalog_btn_link_real: 'https://smartcartao.com.br/imoveis-demo'
  }).eq('id', 1).select();
  
  if (error) console.error(error);
  else console.log('Update Successful:', data);
}
update();
