
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const allPlans = [
  { id: 1, name: 'Individual', price: '49,00', quota: '1 Cartão', agencies: 'Sem Filiais', description: 'Ideal para profissionais liberais que buscam presença digital imediata.', features: 'Link Personalizado, Redes Sociais, QR Code Único, Suporte via Ticket, Catálogo Completo', billing_cycle: 'monthly', months: 1, is_popular: false, discount: 0 },
  { id: 2, name: 'Bronze', price: '249,00', quota: '5 Cartões', agencies: 'Até 2 Filiais', description: 'Plano Semestral focado em pequenas equipes e crescimento acelerado.', features: 'Tudo do Individual, 15% de Desconto, Banner Animado, Métricas de Visitas, Suporte Prioritário', billing_cycle: 'monthly', months: 6, is_popular: false, discount: 15 },
  { id: 3, name: 'Silver', price: '299,00', quota: '15 Cartões', agencies: 'Até 5 Filiais', description: 'A escolha ideal para empresas em expansão com múltiplas unidades.', features: 'Tudo do Bronze, Gestão de Equipe, Relatórios Avançados, Selo de Verificado, Suporte VIP 24h', billing_cycle: 'monthly', months: 12, is_popular: true, discount: 20 },
  { id: 4, name: 'Gold', price: '399,00', quota: 'Ilimitado', agencies: 'Filiais Ilimitadas', description: 'Domínio total do mercado com recursos exclusivos e suporte de elite.', features: 'Tudo do Silver, 30% de Desconto, Domínio Próprio, Sem Logo SmartCartão, Consultoria de Marketing', billing_cycle: 'monthly', months: 12, is_popular: false, discount: 30 }
];

async function findValidFields() {
  const testPlan = { name: 'Probe', price: '0', description: 'probe' };
  const fields = ['quota', 'agencies', 'billing_cycle', 'is_popular', 'months', 'discount'];
  const validFields = ['name', 'price', 'description', 'features'];
  
  for (const field of fields) {
      console.log(`Checking column: ${field}`);
      const { error } = await supabase.from('plans').insert({ ...testPlan, [field]: allPlans[0][field] }).select();
      if (!error) {
          validFields.push(field);
          console.log(`Column ${field} exists!`);
          await supabase.from('plans').delete().eq('name', 'Probe');
      } else {
          console.log(`Column ${field} missing or invalid: ${error.message}`);
      }
  }
  return validFields;
}

async function runFix() {
  console.log('Probing database schema...');
  const validFields = await findValidFields();
  console.log('Valid fields identified:', validFields);

  const plansToInsert = allPlans.map(p => {
      const filtered = {};
      validFields.forEach(f => {
          if (p[f] !== undefined) filtered[f] = p[f];
      });
      // Always include id if it's bigint
      filtered.id = p.id;
      return filtered;
  });

  console.log('Cleaning up plans table...');
  await supabase.from('plans').delete().gte('id', 0);

  console.log('Inserting plans...');
  const { error } = await supabase.from('plans').insert(plansToInsert);
  
  if (error) {
    console.error('Final insert failed:', error.message);
  } else {
    console.log('SUCCESS! All 4 plans inserted using available columns.');
  }
}

runFix();
