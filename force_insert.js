
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const plans = [
  { name: 'Individual', price: '49,00', quota: '1 Cartão', agencies: 'Sem Filiais', description: 'Ideal para profissionais liberais', features: 'Link, Redes, QR', billing_cycle: 'monthly', is_popular: false, discount: 0, months: 1 },
  { name: 'Bronze', price: '249,00', quota: '5 Cartões', agencies: 'Até 2 Filiais', description: 'Plano Semestral', features: 'Tudo Individual, 15% OFF', billing_cycle: 'monthly', is_popular: false, discount: 15, months: 6 },
  { name: 'Silver', price: '299,00', quota: '15 Cartões', agencies: 'Até 5 Filiais', description: 'Empresas em expansão', features: 'Tudo Bronze, Suporte VIP', billing_cycle: 'monthly', is_popular: true, discount: 20, months: 12 },
  { name: 'Gold', price: '399,00', quota: 'Ilimitado', agencies: 'Filiais Ilimitadas', description: 'Domínio total', features: 'Tudo Silver, 30% OFF', billing_cycle: 'monthly', is_popular: false, discount: 30, months: 12 }
];

async function forceInsert() {
  console.log('Force Inserting Plans...');
  const { data, error } = await supabase.from('plans').insert(plans).select();
  if (error) {
    console.error('ERROR during force insert:', error.message);
    if (error.message.includes('agencies')) {
        console.log('Trying without agencies...');
        const { error: error2 } = await supabase.from('plans').insert(plans.map(p => { const { agencies, ...rest } = p; return rest; })).select();
        if (error2) console.error('Even without agencies failed:', error2.message);
    }
  } else {
    console.log('SUCCESS! Inserted:', data.length, 'plans');
  }
}

forceInsert();
