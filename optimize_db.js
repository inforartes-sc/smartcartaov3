const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function optimize() {
  console.log('🚀 Iniciando Otimização do Banco de Dados...');

  const sqlCommands = [
    // 1. Índices para Performance de Busca (Busca por Slug/Username é vital para o catálogo)
    'CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);',
    'CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);',
    'CREATE INDEX IF NOT EXISTS idx_profiles_root_id ON profiles(root_id);',
    
    // 2. Índices para Membros de Equipe (Busca por Slug e Hierarquia)
    'CREATE INDEX IF NOT EXISTS idx_team_members_slug ON team_members(slug);',
    'CREATE INDEX IF NOT EXISTS idx_team_members_parent_id ON team_members(parent_id);',
    'CREATE INDEX IF NOT EXISTS idx_team_members_root_id ON team_members(root_id);',
    
    // 3. Índices para Produtos (Filtragem por Usuário e Localização)
    'CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_products_niche ON products(niche);',
    'CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);',
    
    // 4. Índices para Configurações Localizadas (Filiais)
    'CREATE INDEX IF NOT EXISTS idx_branch_product_settings_ids ON branch_product_settings(branch_id, product_id);',

    // 5. Função RPC Otimizada para carregar o Catálogo em uma única chamada (Reduz latência)
    `
    CREATE OR REPLACE FUNCTION get_catalog_data_optimized(p_slug TEXT)
    RETURNS JSON AS $$
    DECLARE
      v_profile RECORD;
      v_parent RECORD;
      v_root RECORD;
      v_products JSON;
      v_branch_settings JSON;
      v_catalog_owner_id UUID;
      v_branch_id UUID;
      v_allowed_owners UUID[];
    BEGIN
      -- Busca o perfil ou membro pelo slug
      SELECT * INTO v_profile FROM (
        SELECT id, username, display_name, slug, role_title, profile_image, primary_color, background_color, social_links, marquee_text, show_marquee, marquee_speed, establishment, card_bottom_image, card_background_image, profile_banner_image, show_catalog_banner, show_profile_banner, niche, footer_text, root_id, null as parent_id, true as is_main FROM profiles WHERE slug = p_slug
        UNION ALL
        SELECT id, null as username, name as display_name, slug, role_title, photo_url as profile_image, null as primary_color, null as background_color, null as social_links, null as marquee_text, false as show_marquee, null as marquee_speed, null as establishment, null as card_bottom_image, null as card_background_image, null as profile_banner_image, false as show_catalog_banner, false as show_profile_banner, null as niche, null as footer_text, root_id, parent_id, false as is_main FROM team_members WHERE slug = p_slug
      ) AS combined LIMIT 1;

      IF v_profile IS NULL THEN
        RETURN NULL;
      END IF;

      -- Resolve Hierarquia e Branding se for membro
      IF NOT v_profile.is_main THEN
         SELECT * INTO v_parent FROM profiles WHERE id = v_profile.parent_id;
         SELECT * INTO v_root FROM profiles WHERE id = v_profile.root_id;

         -- Branding herança
         v_profile.primary_color := COALESCE(v_parent.primary_color, v_root.primary_color);
         v_profile.background_color := COALESCE(v_parent.background_color, v_root.background_color);
         v_profile.social_links := COALESCE(v_parent.social_links, v_root.social_links);
         v_profile.marquee_text := COALESCE(v_parent.marquee_text, v_root.marquee_text);
         v_profile.show_marquee := COALESCE(v_parent.show_marquee, v_root.show_marquee);
         v_profile.marquee_speed := COALESCE(v_parent.marquee_speed, v_root.marquee_speed);
         v_profile.establishment := COALESCE(v_parent.establishment, v_root.establishment);
         v_profile.card_bottom_image := COALESCE(v_parent.card_bottom_image, v_root.card_bottom_image);
         v_profile.card_background_image := COALESCE(v_parent.card_background_image, v_root.card_background_image);
         v_profile.profile_banner_image := COALESCE(v_parent.profile_banner_image, v_root.profile_banner_image);
         v_profile.show_catalog_banner := COALESCE(v_parent.show_catalog_banner, v_root.show_catalog_banner);
         v_profile.show_profile_banner := COALESCE(v_parent.show_profile_banner, v_root.show_profile_banner);
         v_profile.niche := COALESCE(v_parent.niche, v_root.niche);
         v_profile.footer_text := COALESCE(v_parent.footer_text, v_root.footer_text);
      END IF;

      v_catalog_owner_id := COALESCE(v_profile.root_id, v_profile.id);
      v_branch_id := CASE WHEN v_profile.root_id IS NOT NULL THEN COALESCE(v_profile.parent_id, v_profile.id) ELSE NULL END;
      
      v_allowed_owners := ARRAY[v_catalog_owner_id, v_branch_id, v_profile.id];

      -- Busca produtos
      SELECT json_agg(p) INTO v_products FROM products p WHERE user_id = ANY(v_allowed_owners);

      -- Busca overrides se necessário
      IF v_branch_id IS NOT NULL THEN
        SELECT json_agg(s) INTO v_branch_settings FROM branch_product_settings s WHERE branch_id = v_branch_id;
      ELSE
        v_branch_settings := '[]'::json;
      END IF;

      RETURN json_build_object(
        'user', v_profile,
        'products', COALESCE(v_products, '[]'::json),
        'overrides', COALESCE(v_branch_settings, '[]'::json)
      );
    END;
    $$ LANGUAGE plpgsql;
    `
  ];

  for (const cmd of sqlCommands) {
    const { error } = await supabase.rpc('execute_sql', { sql: cmd }).catch(e => ({ error: { message: 'RPC execute_sql not found or failed' }}));
    if (error) {
       // Se o RPC falhar, tentamos via query direta (se o supabase-js permitir ou fallbacks)
       console.warn('⚠️ SQL failed via RPC:', error.message);
       console.log('--- COMMAND ---');
       console.log(cmd);
       console.log('---------------');
    } else {
       console.log('✅ Comando executado com sucesso');
    }
  }

  console.log('🏁 Otimização Finalizada.');
}

optimize();
