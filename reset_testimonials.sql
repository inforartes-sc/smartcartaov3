-- 1. APAGAR TABELA ANTIGA PARA EVITAR CONFLITOS
DROP TABLE IF EXISTS testimonials CASCADE;

-- 2. CRIAR TABELA NOVA COM ESTRUTURA COMPLETA
CREATE TABLE testimonials (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  avatar_url TEXT,
  content TEXT NOT NULL,
  rating INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HABILITAR RLS (Segurança)
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- 4. PERMITIR LEITURA PÚBLICA
CREATE POLICY "Permitir leitura pública de depoimentos" ON testimonials
  FOR SELECT USING (true);

-- 5. INSERIR DADOS DE EXEMPLO
INSERT INTO testimonials (name, role, content, rating)
VALUES 
('Ricardo Silva', 'Consultor Automotivo', 'O Smart Cartão mudou minha forma de vender. Meus clientes adoram a facilidade do catálogo no WhatsApp!', 5),
('Ana Paula', 'Corretora de Imóveis', 'Excelente ferramenta! Super prática e passa muito profissionalismo. Recomendo a todos!', 5),
('Marcos Oliveira', 'Lojista', 'Finalmente um link que realmente traz resultados. O suporte é nota 10!', 5);

-- 6. RECARREGAR O SCHEMA
NOTIFY pgrst, 'reload schema';
