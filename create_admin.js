import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function createAdmin() {
  const username = 'admin';
  const password = 'admin-password-123';
  const email = 'admin@smartcartao.com';

  console.log('--- CRIANDO USUÁRIO ADMINISTRADOR ---');

  // 1. Criar usuário no Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
        console.log('ℹ️ Conta de e-mail já existe no Auth.');
    } else {
        return console.error('❌ Erro no Auth:', authError.message);
    }
  }

  // Se o usuário já existia mas o perfil não, vamos tentar recuperar o ID
  let userId = authData.user?.id;
  if (!userId) {
     const { data: listData } = await supabase.auth.admin.listUsers();
     userId = listData.users.find(u => u.email === email)?.id;
  }

  if (!userId) return console.error('❌ Não foi possível obter o ID do usuário.');

  // 2. Criar perfil
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    username,
    display_name: 'Smart Admin',
    slug: 'admin',
    is_admin: true,
    status: 'active',
    plan_type: 'Master'
  });

  if (profileError) {
    return console.error('❌ Erro ao criar perfil:', profileError.message);
  }

  console.log('✅ Administrador configurado com sucesso no novo banco!');
  console.log(`👤 Usuário: ${username}`);
  console.log(`🔑 Senha: ${password}`);
  console.log('--------------------------------------');
}

createAdmin();
