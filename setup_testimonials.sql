-- 1. CRIAR TABELA DE DEPOIMENTOS
CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  avatar_url TEXT,
  content TEXT NOT NULL,
  rating INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HABILITAR RLS (Segurança)
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- 3. PERMITIR LEITURA PÚBLICA
DROP POLICY IF EXISTS "Permitir leitura pública de depoimentos" ON testimonials;
CREATE POLICY "Permitir leitura pública de depoimentos" ON testimonials
  FOR SELECT USING (true);

-- 4. ADICIONAR ALGUNS EXEMPLOS PARA NÃO FICAR VAZIO
INSERT INTO testimonials (name, role, content, rating)
VALUES 
('Ricardo Silva', 'Consultor Automotivo', 'O Smart Cartão mudou minha forma de vender. Meus clientes adoram a facilidade do catálogo no WhatsApp!', 5),
('Ana Paula', 'Corretora de Imóveis', 'Excelente ferramenta! Super prática e passa muito profissionalismo. Recomendo a todos!', 5),
('Marcos Oliveira', 'Lojista', 'Finalmente um link que realmente traz resultados. O suporte é nota 10!', 5)
ON CONFLICT DO NOTHING;

-- 5. RECARREGAR O SCHEMA
NOTIFY pgrst, 'reload schema';
