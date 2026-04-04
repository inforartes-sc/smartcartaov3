-- 1. APAGAR VERSÕES ANTIGAS (Lidando com a duplicidade de sobrecarga)
DROP FUNCTION IF EXISTS update_plan_direct(INT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INT);
DROP FUNCTION IF EXISTS update_plan_direct(INT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, BOOLEAN);

-- 2. CRIAR A VERSÃO DEFINITIVA COM PARÂMETROS NOMEADOS
CREATE OR REPLACE FUNCTION update_plan_direct(
  p_id INT,
  p_name TEXT,
  p_months INT,
  p_price TEXT,
  p_description TEXT,
  p_features TEXT,
  p_billing_cycle TEXT,
  p_is_popular BOOLEAN,
  p_discount INT DEFAULT 0
) RETURNS VOID AS $$
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
    discount = p_discount,
    updated_at = NOW()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- 3. PERMISSÕES EXPLÍCITAS (Usando a assinatura exata para evitar o erro de 'not unique')
GRANT EXECUTE ON FUNCTION update_plan_direct(INT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INT) TO anon;
GRANT EXECUTE ON FUNCTION update_plan_direct(INT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_plan_direct(INT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INT) TO service_role;

-- 4. ATUALIZAR SCHEMA
NOTIFY pgrst, 'reload schema';
