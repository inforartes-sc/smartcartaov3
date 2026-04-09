import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const OLD_URL = "https://jtakcojvidnkcyfxvogo.supabase.co";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YWtjb2p2aWRua2N5Znh2b2dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk2NzYwMSwiZXhwIjoyMDg5NTQzNjAxfQ.sb8EIiXldWjQIrmRE1OCYhQE-1A8HAlVJjF2W_rfUYw";

const oldSupabase = createClient(OLD_URL, OLD_KEY);
const newSupabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function syncSchema() {
    console.log('🔍 Analisando Diferenças de Schema...');
    
    const tables = ['profiles', 'products', 'system_settings', 'plans', 'testimonials', 'faturas'];
    
    for (const t of tables) {
        console.log(`\n--- Tabela: ${t} ---`);
        
        //Pegar uma linha do antigo
        const { data: oldData } = await oldSupabase.from(t).select('*').limit(1);
        if (!oldData || oldData.length === 0) {
            console.log(`ℹ️ Tabela ${t} vazia no antigo.`);
            continue;
        }
        
        const oldCols = Object.keys(oldData[0]);
        
        //Pegar uma linha do novo (ou tentar pegar as colunas se estiver vazio)
        const { data: newData, error: newError } = await newSupabase.from(t).select('*').limit(1);
        if (newError) {
            console.log(`❌ Erro ao acessar ${t} no novo: ${newError.message}`);
            continue;
        }
        
        // Se estiver vazio, vamos tentar pegar colunas por erro ou RPC se possível, mas aqui vamos usar um hack
        // Se newData for [], Object.keys() retorna [].
        // Mas podemos tentar inserir uma linha vazia (rollbacked) ou algo do tipo. 
        // No entanto, como eu já rodei o setup, eu sei que algumas existem.
        
        // Melhor: vamos iterar sobre oldCols e tentar dar um ALTER TABLE ADD COLUMN IF NOT EXISTS para cada um!
        console.log(`🛠️ Sincronizando colunas para ${t}...`);
        
        for (const col of oldCols) {
            if (col === 'id') continue;
            
            // Determinar tipo básico
            const val = oldData[0][col];
            let type = 'TEXT';
            if (typeof val === 'number') type = (Number.isInteger(val) ? 'BIGINT' : 'NUMERIC');
            if (typeof val === 'boolean') type = 'BOOLEAN';
            if (val && typeof val === 'object') type = 'JSONB';
            if (col.includes('_at') || col.includes('_date')) type = 'TIMESTAMPTZ';
            
            // Script para adicionar coluna
            const sql = `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS ${col} ${type};`;
            
            // Como não temos RPC exec_sql por padrão, vamos sugerir ao usuário ou tentar via RPC se existir
            // Na maioria dos meus setups eu coloco exec_sql.
            // Vou tentar rodar como RPC, se falhar eu listo tudo para o usuário.
            console.log(`   + Sugerindo: ${sql}`);
        }
    }
}

syncSchema();
