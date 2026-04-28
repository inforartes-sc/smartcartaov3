
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanup() {
  console.log('🔍 Iniciando limpeza de links mortos...');

  // 1. Pegar lista de arquivos no bucket
  const { data: files } = await supabase.storage.from('images').list();
  const validFiles = new Set(files?.map(f => f.name) || []);
  
  // Também checar subpasta 'system'
  const { data: systemFiles } = await supabase.storage.from('images').list('system');
  const validSystemFiles = new Set(systemFiles?.map(f => `system/${f.name}`) || []);

  const allValid = new Set([...validFiles, ...validSystemFiles]);
  console.log(`✅ ${allValid.size} arquivos encontrados no storage.`);

  // 2. Limpar system_settings
  const { data: settings } = await supabase.from('system_settings').select('*').eq('id', 1).single();
  if (settings) {
    const updates = {};
    for (const key in settings) {
      const val = settings[key];
      if (typeof val === 'string' && val.includes('supabase.co')) {
        const fileName = val.split('/').pop();
        const isSystem = val.includes('/system/');
        const fullPath = isSystem ? `system/${fileName}` : fileName;
        
        if (!allValid.has(fullPath)) {
          console.log(`🗑️ Removendo link morto: ${key} -> ${val}`);
          updates[key] = null;
        }
      }
    }
    if (Object.keys(updates).length > 0) {
      await supabase.from('system_settings').update(updates).eq('id', 1);
    }
  }

  // 3. Limpar profiles (opcional, mas bom para garantir)
  const { data: profiles } = await supabase.from('profiles').select('id, profile_image, profile_banner_image');
  if (profiles) {
    for (const p of profiles) {
      const pUpdates = {};
      if (p.profile_image?.includes('supabase.co')) {
         const fn = p.profile_image.split('/').pop();
         if (!allValid.has(fn)) pUpdates.profile_image = null;
      }
      if (p.profile_banner_image?.includes('supabase.co')) {
         const fn = p.profile_banner_image.split('/').pop();
         if (!allValid.has(fn)) pUpdates.profile_banner_image = null;
      }
      if (Object.keys(pUpdates).length > 0) {
        await supabase.from('profiles').update(pUpdates).eq('id', p.id);
      }
    }
  }

  console.log('✨ Limpeza concluída!');
}

cleanup();
