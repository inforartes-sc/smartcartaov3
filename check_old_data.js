import { createClient } from '@supabase/supabase-js';

const OLD_URL = "https://jtakcojvidnkcyfxvogo.supabase.co";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YWtjb2p2aWRua2N5Znh2b2dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk2NzYwMSwiZXhwIjoyMDg5NTQzNjAxfQ.sb8EIiXldWjQIrmRE1OCYhQE-1A8HAlVJjF2W_rfUYw";

const oldSupabase = createClient(OLD_URL, OLD_KEY);

async function check() {
  const { data: users, error } = await oldSupabase.from('profiles').select('id, username, email');
  if (error) return console.log('Error:', error.message);
  console.log('USERS FOUND:', users.length);
  console.log(JSON.stringify(users, null, 2));
}
check();
