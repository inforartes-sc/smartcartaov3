
-- 1. ADICIONAR COLUNAS FALTANTES NA TABELA PLANS
ALTER TABLE plans ADD COLUMN IF NOT EXISTS quota TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS agencies TEXT;

-- 2. RE-CRIAR A FUNÇÃO DE ATUALIZAÇÃO PARA SUPORTAR OS NOVOS CAMPOS
-- Primeiro removemos TOTALMENTE a versão antiga porque vamos mudar o tipo de retorno (de VOID para JSON)
DROP FUNCTION IF EXISTS update_plan_direct(INT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, INT);

CREATE OR REPLACE FUNCTION update_plan_direct(
  p_id INT,
  p_name TEXT,
  p_months INT,
  p_price TEXT,
  p_description TEXT,
  p_features TEXT,
  p_billing_cycle TEXT,
  p_is_popular BOOLEAN,
  p_quota TEXT DEFAULT '',
  p_agencies TEXT DEFAULT '',
  p_discount INT DEFAULT 0
) RETURNS JSON AS $$
DECLARE
  v_updated_row JSON;
BEGIN
  UPDATE plans 
  SET 
    name = p_name,
    months = p_months,
    price = p_price,
    description = p_description,
    features = p_features,
    billing_cycle = p_billing_cycle,
    is_popular = p_is_popular,
    quota = p_quota,
    agencies = p_agencies,
    discount = p_discount,
    updated_at = NOW()
  WHERE id = p_id
  RETURNING row_to_json(plans.*) INTO v_updated_row;
  
  RETURN v_updated_row;
END;
$$ LANGUAGE plpgsql;

-- 3. DAR PERMISSÕES PARA O SISTEMA EXECUTAR A FUNÇÃO
GRANT EXECUTE ON FUNCTION update_plan_direct TO anon;
GRANT EXECUTE ON FUNCTION update_plan_direct TO authenticated;
GRANT EXECUTE ON FUNCTION update_plan_direct TO service_role;

-- 4. RECARREGAR O CACHE PARA O POSTGREST VER AS MUDANÇAS NA HORA
NOTIFY pgrst, 'reload schema';
