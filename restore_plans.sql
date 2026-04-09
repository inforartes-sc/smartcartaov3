
-- Limpa e insere os planos oficiais
DELETE FROM plans;

INSERT INTO plans (name, price, quota, agencies, description, features, billing_cycle, is_popular, discount, months)
VALUES 
('Individual', '49,00', '1 Cartão', 'Sem Filiais', 'Ideal para profissionais liberais que buscam presença digital imediata.', 'Link Personalizado, Redes Sociais, QR Code Único, Suporte via Ticket, Catálogo Completo', 'monthly', false, 0, 1),

('Bronze', '249,00', '5 Cartões', 'Até 2 Filiais', 'Plano Semestral focado em pequenas equipes e crescimento acelerado.', 'Tudo do Individual, 15% de Desconto, Banner Animado, Métricas de Visitas, Suporte Prioritário', 'monthly', false, 15, 6),

('Silver', '299,00', '15 Cartões', 'Até 5 Filiais', 'A escolha ideal para empresas em expansão com múltiplas unidades.', 'Tudo do Bronze, Gestão de Equipe, Relatórios Avançados, Selo de Verificado, Suporte VIP 24h', 'monthly', true, 20, 12),

('Gold', '399,00', 'Ilimitado', 'Filiais Ilimitadas', 'Domínio total do mercado com recursos exclusivos e suporte de elite.', 'Tudo do Silver, 30% de Desconto, Domínio Próprio, Sem Logo SmartCartão, Consultoria de Marketing', 'monthly', false, 30, 12);
