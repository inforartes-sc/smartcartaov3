
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const OLD_REF = 'jtakcojvidnkcyfxvogo';
const NEW_REF = 'gfqlyhnrpiwbfpiecskj';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixUrls() {
  console.log(`🚀 Iniciando correção de URLs: ${OLD_REF} -> ${NEW_REF}`);

  // 1. SYSTEM SETTINGS
  console.log('📑 Corrigindo system_settings...');
  const { data: settings } = await supabase.from('system_settings').select('*').eq('id', 1).single();
  if (settings) {
    const updatedSettings = {};
    for (const key in settings) {
      if (typeof settings[key] === 'string' && settings[key].includes(OLD_REF)) {
        updatedSettings[key] = settings[key].replace(new RegExp(OLD_REF, 'g'), NEW_REF);
      }
    }
    if (Object.keys(updatedSettings).length > 0) {
      const { error } = await supabase.from('system_settings').update(updatedSettings).eq('id', 1);
      if (error) console.error('❌ Erro ao atualizar system_settings:', error.message);
      else console.log('✅ system_settings atualizado.');
    } else {
      console.log('ℹ️ Nenhuma URL antiga encontrada em system_settings.');
    }
  }

  // 2. PROFILES
  console.log('📑 Corrigindo profiles...');
  const { data: profiles } = await supabase.from('profiles').select('*');
  if (profiles) {
    for (const p of profiles) {
      const updatedProfile = {};
      for (const key in p) {
        if (typeof p[key] === 'string' && p[key].includes(OLD_REF)) {
          updatedProfile[key] = p[key].replace(new RegExp(OLD_REF, 'g'), NEW_REF);
        }
      }
      if (Object.keys(updatedProfile).length > 0) {
        await supabase.from('profiles').update(updatedProfile).eq('id', p.id);
        console.log(`✅ Profile ${p.username} atualizado.`);
      }
    }
  }

  // 3. PRODUCTS
  console.log('📑 Corrigindo products...');
  const { data: products } = await supabase.from('products').select('*');
  if (products) {
    for (const p of products) {
      const updatedProduct = {};
      for (const key in p) {
        if (typeof p[key] === 'string' && p[key].includes(OLD_REF)) {
          updatedProduct[key] = p[key].replace(new RegExp(OLD_REF, 'g'), NEW_REF);
        } else if (p[key] && typeof p[key] === 'object') {
          // Tratar JSONB (como 'images' ou 'consortium_plans')
          const jsonStr = JSON.stringify(p[key]);
          if (jsonStr.includes(OLD_REF)) {
            updatedProduct[key] = JSON.parse(jsonStr.replace(new RegExp(OLD_REF, 'g'), NEW_REF));
          }
        }
      }
      if (Object.keys(updatedProduct).length > 0) {
        await supabase.from('products').update(updatedProduct).eq('id', p.id);
        console.log(`✅ Produto ${p.name} atualizado.`);
      }
    }
  }

  console.log('\n✨ CORREÇÃO CONCLUÍDA! ✨');
}

fixUrls();
