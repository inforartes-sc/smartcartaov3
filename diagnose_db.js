
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing connection to:', url);
const supabase = createClient(url, key);

async function test() {
  try {
    // 1. Test Select
    const { count: plansCount, error: plansError } = await supabase.from('plans').select('*', { count: 'exact', head: true });
    if (plansError) {
      console.error('❌ Plans table error:', plansError.message);
    } else {
      console.log('✅ Plans table accessible. Count:', plansCount);
    }

    // 2. Test Profiles
    const { count: profilesCount, error: profilesError } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError.message);
    } else {
      console.log('✅ Profiles table accessible. Count:', profilesCount);
    }

    // 3. Test Admin Auth (Requires Service Role Key)
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Auth Admin error (Check Service Role Key):', authError.message);
    } else {
      console.log('✅ Auth Admin accessible. Users:', users?.users?.length);
    }

    // 4. Test Settings
    const { data: settings, error: settingsError } = await supabase.from('system_settings').select('*').eq('id', 1).single();
    if (settingsError) {
      console.error('❌ Settings error:', settingsError.message);
    } else {
      console.log('✅ Settings accessible. Version:', settings.system_version);
    }

  } catch (err) {
    console.error('💥 Unexpected error:', err.message);
  }
}

test();
