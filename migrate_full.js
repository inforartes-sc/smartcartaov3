import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// CHAVES DO PROJETO ANTIGO (jtakcojvidnkcyfxvogo)
const OLD_URL = "https://jtakcojvidnkcyfxvogo.supabase.co";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YWtjb2p2aWRua2N5Znh2b2dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk2NzYwMSwiZXhwIjoyMDg5NTQzNjAxfQ.sb8EIiXldWjQIrmRE1OCYhQE-1A8HAlVJjF2W_rfUYw";

// CHAVES DO PROJETO NOVO (gfqlyhnrpiwbfpiecskj)
const NEW_URL = process.env.VITE_SUPABASE_URL;
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const oldSupabase = createClient(OLD_URL, OLD_KEY);
const newSupabase = createClient(NEW_URL, NEW_KEY);

async function migrate() {
    console.log('🚀 Iniciando Migração Total...');
    console.log('🔗 De:', OLD_URL);
    console.log('🔗 Para:', NEW_URL);

    const tables = ['system_settings', 'plans', 'testimonials', 'onboarding_submissions', 'profiles', 'products', 'faturas'];

    const data = {};
    for (const t of tables) {
        console.log(`📥 Coletando dados de: ${t}...`);
        const { data: records, error } = await oldSupabase.from(t).select('*');
        if (error) {
            console.error(`❌ Erro ao coletar ${t}:`, error.message);
            data[t] = [];
        } else {
            console.log(`✅ ${records.length} registros coletados.`);
            data[t] = records;
        }
    }

    console.log('\n👤 Recriando contas de usuários no Auth...');
    const profiles = data['profiles'] || [];
    for (const p of profiles) {
        const email = p.email || (p.username.includes('@') ? p.username : `${p.username}@smartcartao.com`);
        
        // Upsert no Auth (como o admin.createUser não faz upsert real, vamos tentar listar e deletar se necessário, ou só tentar criar)
        const { data: authData, error: authError } = await newSupabase.auth.admin.createUser({
            id: p.id,
            email: email,
            password: 'mudar-senha-123',
            email_confirm: true
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                console.log(`ℹ️ [Auth] Usuário ${email} já existe.`);
            } else {
                console.error(`❌ [Auth] Erro ao criar ${email}:`, authError.message);
            }
        } else {
            console.log(`✅ [Auth] Usuário recriado: ${email}`);
        }
    }

    console.log('\n📑 Migrando Perfis...');
    if (profiles.length > 0) {
        const { error: profError } = await newSupabase.from('profiles').upsert(profiles);
        if (profError) console.error('❌ Erro no Profiles:', profError.message);
        else console.log('✅ Perfis migrados.');
    }

    for (const t of ['system_settings', 'plans', 'testimonials', 'onboarding_submissions', 'products', 'faturas']) {
        console.log(`📑 Migrando ${t}...`);
        const records = data[t];
        if (records && records.length > 0) {
            if (t === 'system_settings') {
                const { error: ssError } = await newSupabase.from('system_settings').upsert(records[0]);
                if (ssError) console.error('❌ Erro Settings:', ssError.message);
            } else {
                let recordsToInsert = [];
                for (let r of records) {
                    const row = { ...r };
                    
                    // LIMPEZA DE TODOS OS CAMPOS QUE PODERIAM SER NUMERICOS
                    if (t === 'products') {
                        // Limpar os campos: price, cash_price, condo_fee, iptu
                        const numericFields = ['price', 'cash_price', 'condo_fee', 'iptu', 'mileage', 'area'];
                        for (let f of numericFields) {
                            if (row[f] && typeof row[f] === 'string') {
                                const original = row[f];
                                // Converte "39.000,00" -> "39000.00"
                                let cleanValue = original.replace(/\./g, '').replace(',', '.');
                                // Remove qualquer caractere que não seja número ou ponto
                                cleanValue = cleanValue.replace(/[^\d.]/g, '');
                                
                                if (original !== cleanValue) {
                                   // console.log(`   [Clean] ${f}: "${original}" -> "${cleanValue}"`);
                                }
                                row[f] = cleanValue;
                            }
                        }
                    }
                    
                    if (t === 'faturas' || t === 'testimonials') {
                        delete row.id;
                    }
                    
                    recordsToInsert.push(row);
                }

                if (t === 'products' && recordsToInsert.length > 0) {
                   console.log(`📊 Limpeza para ${recordsToInsert.length} produtos preparada.`);
                }

                const { error: insertError } = await newSupabase.from(t).upsert(recordsToInsert);
                if (insertError) console.error(`❌ Erro ${t}:`, insertError.message);
                else console.log(`✅ ${t} migrados.`);
            }
        }
    }

    console.log('\n✨ MIGRAÇÃO CONCLUÍDA! ✨');
}

migrate();
