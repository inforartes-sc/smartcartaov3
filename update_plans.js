
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const plans = [
  { 
    id: 1, 
    name: 'Individual', 
    price: '49,00', 
    quota: '1 Cartão', 
    agencies: 'Sem Filiais', 
    months: 1,
    description: 'Ideal para profissionais liberais que buscam presença digital imediata.', 
    features: 'Link Personalizado, Redes Sociais, QR Code Único, Suporte via Ticket, Catálogo Completo', 
    billing_cycle: 'monthly', 
    is_popular: false 
  },
  { 
    id: 2, 
    name: 'Bronze', 
    price: '249,00', 
    quota: '5 Cartões', 
    agencies: 'Até 2 Filiais', 
    months: 6,
    description: 'Plano Semestral focado em pequenas equipes e crescimento acelerado.', 
    features: 'Tudo do Individual, 15% de Desconto, Banner Animado, Métricas de Visitas, Suporte Prioritário', 
    billing_cycle: 'monthly', 
    is_popular: false 
  },
  { 
    id: 3, 
    name: 'Silver', 
    price: '299,00', 
    quota: '15 Cartões', 
    agencies: 'Até 5 Filiais', 
    months: 12,
    description: 'A escolha ideal para empresas em expansão com múltiplas unidades.', 
    features: 'Tudo do Bronze, Gestão de Equipe, Relatórios Avançados, Selo de Verificado, Suporte VIP 24h', 
    billing_cycle: 'monthly', 
    is_popular: true 
  },
  { 
    id: 4, 
    name: 'Gold', 
    price: '399,00', 
    quota: 'Ilimitado', 
    agencies: 'Filiais Ilimitadas', 
    months: 12,
    description: 'Domínio total do mercado com recursos exclusivos e suporte de elite.', 
    features: 'Tudo do Silver, 30% de Desconto, Domínio Próprio, Sem Logo SmartCartão, Consultoria de Marketing', 
    billing_cycle: 'monthly', 
    is_popular: false 
  }
];

async function updatePlans() {
  console.log('Cleaning up old plans...');
  // Delete all plans to start fresh
  const { error: deleteError } = await supabase.from('plans').delete().gte('id', 0);
  if (deleteError) {
    console.error('Error deleting plans:', deleteError.message);
    return;
  }

  console.log('Inserting official plans...');
  const { error: insertError } = await supabase.from('plans').insert(plans);
  
  if (insertError) {
    console.error('Error inserting plans:', insertError.message);
  } else {
    console.log('Successfully updated all plans to official versions!');
  }
}

updatePlans();
