const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setup() {
  console.log('--- Setting up Bucket ---');
  const { data: bucket, error: bErr } = await supabase.storage.createBucket('images', { public: true });
  if (bErr) console.log('Bucket "images" handled:', bErr.message);
  else console.log('Bucket "images" created.');

  console.log('--- Setting up Database ---');
  const { error: sqlErr } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        root_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        whatsapp TEXT,
        photo_url TEXT,
        slug TEXT UNIQUE NOT NULL,
        role_title TEXT DEFAULT 'Consultor de Vendas',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `
  });
  
  if (sqlErr) console.log('SQL Error (possibly RPC disabled, please run the SQL manually).');
  else console.log('Table "team_members" setup done.');
}

setup();
