-- SINCRONIZAÇÃO TOTAL - TABELA DE ONBOARDING
-- Copie e cole este código no SQL EDITOR do seu Supabase para corrigir o "Erro de Conexão"

-- 1. Garantir que a extensão de UUID exista
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar a tabela caso ela não exista
CREATE TABLE IF NOT EXISTS onboarding_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_whatsapp TEXT,
  client_document TEXT,
  role_title TEXT,
  suggested_username TEXT,
  client_logo_url TEXT,
  suggested_password TEXT,
  business_name TEXT,
  setup_type TEXT DEFAULT 'self',
  product_estimated_count TEXT DEFAULT '1-5',
  additional_notes TEXT,
  niche TEXT DEFAULT 'vehicle',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Adicionar colunas novas de hoje (caso a tabela já existisse anteriormente)
ALTER TABLE onboarding_submissions ADD COLUMN IF NOT EXISTS client_document TEXT;
ALTER TABLE onboarding_submissions ADD COLUMN IF NOT EXISTS role_title TEXT;
ALTER TABLE onboarding_submissions ADD COLUMN IF NOT EXISTS suggested_username TEXT;
ALTER TABLE onboarding_submissions ADD COLUMN IF NOT EXISTS client_logo_url TEXT;
ALTER TABLE onboarding_submissions ADD COLUMN IF NOT EXISTS suggested_password TEXT;
ALTER TABLE onboarding_submissions ADD COLUMN IF NOT EXISTS niche TEXT DEFAULT 'vehicle';
ALTER TABLE onboarding_submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 4. Liberar permissão pública para o formulário funcionar (Crucial!)
ALTER TABLE onboarding_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can submit onboarding" ON onboarding_submissions;
CREATE POLICY "Public can submit onboarding" ON onboarding_submissions FOR INSERT WITH CHECK (true);

-- 5. Dar permissão para o Master Admin ler as submissões
DROP POLICY IF EXISTS "Admins can view onboarding" ON onboarding_submissions;
CREATE POLICY "Admins can view onboarding" ON onboarding_submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
