
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const sql = `
    -- Enable public access to 'images' bucket
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'objects' 
            AND schemaname = 'storage' 
            AND policyname = 'Public Access Images'
        ) THEN
            CREATE POLICY "Public Access Images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
        END IF;
    END $$;
  `;

  console.log('Executing SQL to allow public storage access...');
  const { error } = await supabase.rpc('execute_sql', { sql });
  if (error) {
    console.error('❌ Error executing SQL:', error.message);
    console.log('Note: If "execute_sql" RPC is missing, you must run this in the Supabase SQL Editor manually.');
  } else {
    console.log('✅ Public access policy created/verified.');
  }
}

run();
