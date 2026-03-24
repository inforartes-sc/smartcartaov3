import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Supabase configuration missing in environment variables!');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// View Cooldown Cache
const viewCache: Record<string, number> = {};
const VIEW_COOLDOWN = 60 * 60 * 1000; // 1 hour

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const authenticateMaster = async (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', decoded.id).single();
    
    const isMaster = profile?.username === 'admin' || 
                    (profile as any)?.is_admin === true;

    if (!isMaster) {
      console.log(`[AUTH] Access Denied for user ${decoded.id} (username: ${profile?.username}, is_admin: ${profile?.is_admin})`);
      return res.status(403).json({ error: 'Acesso negado: você não tem permissão de Master Admin.' });
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[AUTH] Token verification failed:', err);
    res.status(401).json({ error: 'Sessão inválida. Por favor, faça login novamente.' });
  }
};

  app.post('/api/admin/upload-logo', authenticateMaster, async (req: any, res) => {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Nenhuma imagem enviada' });

    try {
      // Decode base64
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) return res.status(400).json({ error: 'Formato de imagem inválido' });

      const type = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const ext = type.split('/')[1] || 'png';
      const fileName = `system/logo-${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, buffer, {
          contentType: type,
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      res.json({ url: publicUrl });
    } catch (err: any) {
      console.error('Master Upload Error:', err);
      res.status(500).json({ error: err.message });
    }
  });

async function setupApp() {
  // Vite server initialization (Must be at the TOP level of setupApp)
  const isVercel = !!process.env.VERCEL;
  let vite: any;
  if (process.env.NODE_ENV !== 'production' && !isVercel) {
    try {
      const { createServer: createViteServer } = await import('vite');
      vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      console.log('✅ Vite server instance created for dev mode');
    } catch (e) {
      console.warn('❌ Vite dev server failed to start', e);
    }
  }

  // Public settings
  app.get('/api/settings', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { data, error } = await supabase.from('system_settings').select('*').eq('id', 1).single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  app.get('/api/plans-data', async (req, res) => {
    const { data: plans, error } = await supabase.from('plans').select('*').order('id', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    res.json(plans);
  });

  // API Routes
  app.post('/api/auth/register', authenticateMaster, async (req, res) => {
    const { username, password, display_name, role_title, slug } = req.body;
    try {
      // Fetch system settings for defaults
      const { data: settings } = await supabase.from('system_settings').select('*').eq('id', 1).single();
      const default_logo = settings?.default_logo;
      const default_phone = settings?.default_phone;

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: username.includes('@') ? username : `${username}@smartcartao.com`,
        password: password,
        email_confirm: true
      });
      if (authError) throw authError;

      // Handle Plan Expiry if plan_id provided
      let expiryDate = null;
      if (req.body.plan_id) {
        const { data: plan } = await supabase.from('plans').select('months').eq('id', req.body.plan_id).single();
        if (plan) {
          const d = new Date();
          d.setMonth(d.getMonth() + plan.months);
          expiryDate = d.toISOString().split('T')[0];
        }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ 
          id: authData.user.id, 
          username, 
          display_name, 
          role_title, 
          slug,
          profile_image: default_logo,
          whatsapp: default_phone,
          plan_id: req.body.plan_id || null,
          expiry_date: expiryDate,
          is_admin: req.body.is_admin === true
        });
      if (profileError) throw profileError;
      res.json({ id: authData.user.id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const email = username.includes('@') ? username : `${username}@smartcartao.com`;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profile?.status === 'blocked') {
        return res.status(403).json({ error: 'Sua conta está bloqueada ou expirada. Entre em contato com o suporte.' });
      }

      // Late Expiry Check
      if (profile?.expiry_date && new Date(profile.expiry_date) < new Date()) {
          await supabase.from('profiles').update({ status: 'blocked' }).eq('id', profile.id);
          return res.status(403).json({ error: 'Sua conta expirou. Entre em contato com o suporte.' });
      }

      const token = jwt.sign({ id: data.user.id, email: data.user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ user: { id: data.user.id, username, slug: profile?.slug, is_admin: profile?.is_admin || username === 'admin' } });
    } catch (err: any) {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  app.get('/api/me', authenticate, async (req: any, res) => {
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', req.user.id).single();
    if (error) return res.status(404).json({ error: 'Perfil não encontrado' });
    
    if (profile?.status === 'blocked') {
        res.clearCookie('token');
        return res.status(403).json({ error: 'Conta Bloqueada' });
    }

    // Expiry Check on Load
    if (profile?.expiry_date && new Date(profile.expiry_date) < new Date()) {
        await supabase.from('profiles').update({ status: 'blocked' }).eq('id', profile.id);
        res.clearCookie('token');
        return res.status(403).json({ error: 'Conta Expirada' });
    }

    res.json({
      ...profile,
      is_admin: profile.is_admin || profile.username === 'admin'
    });
  });

  app.put('/api/me', authenticate, async (req: any, res) => {
    const { display_name, establishment, role_title, profile_image, card_bottom_image, footer_text, primary_color, background_color, social_links, marquee_text, show_marquee, marquee_speed, whatsapp, instagram, facebook } = req.body;
    const { error } = await supabase
      .from('profiles')
      .update({ display_name, establishment, role_title, profile_image, card_bottom_image, footer_text, primary_color, background_color, social_links, marquee_text, show_marquee, marquee_speed, whatsapp, instagram, facebook })
      .eq('id', req.user.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  });

  app.post('/api/auth/change-password', authenticate, async (req: any, res) => {
    const { password } = req.body;
    try {
      const { error } = await supabase.auth.admin.updateUserById(req.user.id, { password });
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao alterar senha' });
    }
  });

  // Master Admin Routes
  app.get('/api/admin/users', authenticateMaster, async (req, res) => {
    const { data: profiles, error } = await supabase.from('profiles').select('*').order('username');
    if (error) return res.status(400).json({ error: error.message });
    res.json(profiles);
  });

  app.get('/api/admin/stats', authenticateMaster, async (req, res) => {
    try {
      // 1. Basic counts
      const userRes = await supabase.from('profiles').select('id, username, is_admin, plan_id, status, views', { count: 'exact' });
      const userProfiles = userRes.data || [];
      const userCount = userRes.count || userProfiles.length;
      
      // 2. Views
      const totalViews = userProfiles.reduce((acc, curr) => acc + (curr.views || 0), 0);

      // 3. Admins vs Members (Special rule for 'admin' username)
      const adminsCount = userProfiles.filter(u => u.username === 'admin' || u.is_admin === true || u.is_admin === 'true').length;
      const membersCount = userProfiles.length - adminsCount;

      // 4. Users per Plan
      const { data: plans } = await supabase.from('plans').select('*');
      const planStats = (plans || []).map(p => ({
        name: p.name,
        count: userProfiles.filter(u => u.plan_id && Number(u.plan_id) === Number(p.id)).length
      }));

      // Add "Sem Plano" if there are users with null plan_id
      const noPlanCount = userProfiles.filter(u => !u.plan_id).length;
      if (noPlanCount > 0) {
        planStats.push({ name: 'Sem Plano', count: noPlanCount });
      }

      // 5. New users in last 30 days
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newUsersCount = (authUsers?.users || []).filter(u => {
        const createdDate = new Date(u.created_at);
        return createdDate > thirtyDaysAgo;
      }).length;

      // 6. Active vs Inactive
      const activeCount = userProfiles.filter(u => u.status === 'active').length;
      const inactiveCount = userProfiles.length - activeCount;
      
      const results = { 
        userCount: Number(userCount), 
        totalViews: Number(totalViews),
        adminsCount: Number(adminsCount),
        membersCount: Number(membersCount),
        planStats,
        newUsersCount: Number(newUsersCount),
        activeCount: Number(activeCount),
        inactiveCount: Number(inactiveCount)
      };

      console.log('--- FINAL STATS SENT ---');
      console.log(JSON.stringify(results, null, 2));

      res.json(results);
    } catch (err: any) {
      console.error('[STATS] Error:', err);
      res.status(400).json({ error: `Erro nas estatísticas: ${err.message}` });
    }
  });

  app.delete('/api/admin/users/:id', authenticateMaster, async (req, res) => {
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  });

  // Admin User General Update
  app.put('/api/admin/users/:id/update', authenticateMaster, async (req: any, res) => {
    const { display_name, establishment, role_title, slug, status, plan_type, expiry_date, admin_message } = req.body;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          display_name,
          establishment,
          role_title,
          slug,
          status,
          plan_type,
          plan_id: req.body.plan_id || null,
          expiry_date: expiry_date || null,
          admin_message,
          admin_message_date: new Date().toISOString(),
          is_admin: req.body.is_admin === true
        })
        .eq('id', req.params.id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error('Update User Error:', err);
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/admin/users/:id/password', authenticateMaster, async (req: any, res) => {
    const { password } = req.body;
    try {
      const { error } = await supabase.auth.admin.updateUserById(req.params.id, { password });
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/admin/users/:id/admin', authenticateMaster, async (req: any, res) => {
    const { is_admin } = req.body;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !!is_admin })
        .eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Global Settings Routes
  app.get('/api/admin/settings', authenticateMaster, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { data: settings, error } = await supabase.from('system_settings').select('*').eq('id', 1).single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(settings);
  });

  app.put('/api/admin/settings', authenticateMaster, async (req, res) => {
    const { 
      default_logo, default_phone, footer_logo, favicon, footer_text, system_version,
      landing_hero_title, landing_hero_subtitle, landing_hero_cta,
      landing_concept_title, landing_concept_subtitle, landing_features_title,
      landing_cta_title, landing_cta_subtitle, landing_cta_button,
      landing_example1, landing_example2, landing_example3, landing_example4,
      landing_concept_item1_t, landing_concept_item1_d,
      landing_concept_item2_t, landing_concept_item2_d,
      landing_concept_item3_t, landing_concept_item3_d,
      landing_mockup_hero, landing_mockup_service, landing_mockup_features,
      landing_done_tag, landing_done_title_first, landing_done_title_last, landing_done_text,
      landing_catalog_tag, landing_catalog_title_first, landing_catalog_title_last, landing_catalog_text,
      landing_catalog_btn_text, landing_catalog_btn_link,
      landing_stats_text, landing_stats_description,
      landing_faqs
    } = req.body;
    
    const { error } = await supabase.from('system_settings').update({ 
      default_logo, default_phone, footer_logo, favicon, footer_text, system_version,
      landing_hero_title, landing_hero_subtitle, landing_hero_cta,
      landing_concept_title, landing_concept_subtitle, landing_features_title,
      landing_cta_title, landing_cta_subtitle, landing_cta_button,
      landing_example1, landing_example2, landing_example3, landing_example4,
      landing_concept_item1_t, landing_concept_item1_d,
      landing_concept_item2_t, landing_concept_item2_d,
      landing_concept_item3_t, landing_concept_item3_d,
      landing_mockup_hero, landing_mockup_service, landing_mockup_features,
      landing_done_tag, landing_done_title_first, landing_done_title_last, landing_done_text,
      landing_catalog_tag, landing_catalog_title_first, landing_catalog_title_last, landing_catalog_text,
      landing_catalog_btn_text, landing_catalog_btn_link,
      landing_stats_text, landing_stats_description,
      landing_faqs
    }).eq('id', 1);
    
    if (error) {
      console.error('Settings Update Error:', error);
      return res.status(400).json({ error: error.message });
    }
    res.json({ success: true });
  });

  // Testimonials Management
  app.get('/api/testimonials', async (req, res) => {
    const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  app.post('/api/admin/testimonials', authenticateMaster, async (req, res) => {
    const { name, content, rating } = req.body;
    const { data, error } = await supabase.from('testimonials').insert([{ 
      name, 
      content, 
      rating: parseInt(rating as any) || 5 
    }]).select();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data[0]);
  });

  app.delete('/api/admin/testimonials/:id', authenticateMaster, async (req, res) => {
    const { error } = await supabase.from('testimonials').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  });

  // Plans Management
  app.get('/api/admin/plans', authenticateMaster, async (req, res) => {
    const { data: plans, error } = await supabase.from('plans').select('*').order('id', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    res.json(plans);
  });

  app.get('/api/admin/plans/public', async (req, res) => {
    const { data: plans, error } = await supabase.from('plans').select('*').order('id', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    res.json(plans);
  });

  app.get('/api/public/plans', async (req, res) => {
    const { data: plans, error } = await supabase.from('plans').select('*').order('id', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    res.json(plans);
  });

  app.delete('/api/admin/plans/:id', authenticateMaster, async (req, res) => {
    const { error } = await supabase.from('plans').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  });

  app.get('/api/public/settings', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { data: settings } = await supabase.from('system_settings').select('*').eq('id', 1).single();
    res.json(settings || {});
  });

  app.post('/api/admin/plans', authenticateMaster, async (req, res) => {
    const { name, months, price, description, features, billing_cycle, is_popular } = req.body;
    const { data, error } = await supabase.from('plans').insert({ 
      name, months, price: price || '0,00', description: description || '',
      features: features || '', billing_cycle: billing_cycle || 'monthly',
      is_popular: is_popular === true || is_popular === 1
    }).select().single();
    if (error) {
      console.error('Plan Creation Error:', error);
      return res.status(400).json({ error: error.message });
    }
    res.json(data);
  });

  app.put('/api/admin/plans/:id', authenticateMaster, async (req, res) => {
    const { name, months, price, description, features, billing_cycle, is_popular } = req.body;
    try {
      // Use RPC to bypass potential schema cache issues (PGRST204)
      const { error } = await supabase.rpc('update_plan_direct', {
        p_id: parseInt(req.params.id),
        p_name: name,
        p_months: months,
        p_price: price || '0,00',
        p_description: description || '',
        p_features: features || '',
        p_billing_cycle: billing_cycle || 'monthly',
        p_is_popular: is_popular === true || is_popular === 1
      });

      if (error) {
        console.error('Plan Update RPC Error:', error);
        return res.status(400).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('Plan Update Catch Error:', err);
      res.status(500).json({ error: 'Erro interno ao atualizar plano' });
    }
  });

  // Public Profile Route
  app.get('/api/profile/:slug', async (req, res) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', req.params.slug)
      .single();

    if (profileError || !profile) return res.status(404).json({ error: 'Perfil não encontrado' });
    
    // Increment views with cooldown
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const cacheKey = `${ip}-${profile.id}`;
    const now = Date.now();

    if (!viewCache[cacheKey] || now - viewCache[cacheKey] > VIEW_COOLDOWN) {
      await supabase.from('profiles').update({ views: (profile.views || 0) + 1 }).eq('id', profile.id);
      viewCache[cacheKey] = now;
      
      // Cleanup cache occasionally
      if (Object.keys(viewCache).length > 1000) {
        Object.keys(viewCache).forEach(key => {
          if (now - viewCache[key] > VIEW_COOLDOWN) delete viewCache[key];
        });
      }
    }

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', profile.id);

    res.json({ user: profile, products: products || [] });
  });

  // Product Routes
  app.get('/api/products', authenticate, async (req: any, res) => {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', req.user.id);
    
    if (error) return res.status(400).json({ error: error.message });
    res.json(products);
  });

  app.post('/api/products', authenticate, async (req: any, res) => {
    const { name, image, description, colors, images, consortium_image, liberacred_image, has_liberacred, has_consortium, is_highlighted, is_new, year, price, mileage, brand, condition, fuel, transmission, color, optionals, show_consortium_plans, consortium_plans } = req.body;
    const { data, error } = await supabase
      .from('products')
      .insert({
        user_id: req.user.id,
        name,
        image,
        description,
        colors: Array.isArray(colors) ? JSON.stringify(colors) : (colors || '["#000000"]'),
        images: Array.isArray(images) ? JSON.stringify(images) : (images || '[]'),
        consortium_image,
        liberacred_image,
        has_liberacred: !!has_liberacred,
        has_consortium: has_consortium !== undefined ? !!has_consortium : true,
        is_highlighted: !!is_highlighted,
        is_new: !!is_new,
        year: year || null,
        price: price || null,
        mileage: mileage || null,
        brand,
        condition,
        fuel,
        transmission,
        color,
        optionals: Array.isArray(optionals) ? JSON.stringify(optionals) : (optionals || '[]'),
        show_consortium_plans: !!show_consortium_plans,
        consortium_plans: Array.isArray(consortium_plans) ? JSON.stringify(consortium_plans) : (consortium_plans || '[]'),
        show_financing_plans: !!req.body.show_financing_plans,
        financing_plans: Array.isArray(req.body.financing_plans) ? JSON.stringify(req.body.financing_plans) : (req.body.financing_plans || '[]'),
        cash_price: req.body.cash_price || null,
        card_installments: req.body.card_installments || null,
        card_interest: !!req.body.card_interest
      })
      .select('id')
      .single();
    
    if (error) return res.status(400).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.put('/api/products/:id', authenticate, async (req: any, res) => {
    const { name, image, description, colors, images, consortium_image, liberacred_image, has_liberacred, has_consortium, is_highlighted, is_new, year, price, mileage, brand, condition, fuel, transmission, color, optionals, show_consortium_plans, consortium_plans } = req.body;
    const { error } = await supabase
      .from('products')
      .update({
        name,
        image,
        description,
        colors: Array.isArray(colors) ? JSON.stringify(colors) : (colors || '["#000000"]'),
        images: Array.isArray(images) ? JSON.stringify(images) : (images || '[]'),
        consortium_image,
        liberacred_image,
        has_liberacred: !!has_liberacred,
        has_consortium: has_consortium !== undefined ? !!has_consortium : true,
        is_highlighted: !!is_highlighted,
        is_new: !!is_new,
        year: year || null,
        price: price || null,
        mileage: mileage || null,
        brand,
        condition,
        fuel,
        transmission,
        color,
        optionals: Array.isArray(optionals) ? JSON.stringify(optionals) : (optionals || '[]'),
        show_consortium_plans: !!show_consortium_plans,
        consortium_plans: Array.isArray(consortium_plans) ? JSON.stringify(consortium_plans) : (consortium_plans || '[]'),
        show_financing_plans: !!req.body.show_financing_plans,
        financing_plans: Array.isArray(req.body.financing_plans) ? JSON.stringify(req.body.financing_plans) : (req.body.financing_plans || '[]'),
        cash_price: req.body.cash_price || null,
        card_installments: req.body.card_installments || null,
        card_interest: !!req.body.card_interest
      })
      .eq('id', parseInt(req.params.id))
      .eq('user_id', req.user.id);
    
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete('/api/products/:id', authenticate, async (req: any, res) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', parseInt(req.params.id))
      .eq('user_id', req.user.id);
    
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  });

  app.post('/api/products/:id/view', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { data } = await supabase.from('products').select('views').eq('id', id).single();
      const views = (data?.views || 0) + 1;
      await supabase.from('products').update({ views }).eq('id', id);
      res.json({ success: true, views });
    } catch (e) {
      res.status(500).json({ error: 'Server error parsing views' });
    }
  });

  app.post('/api/products/:id/sale', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { data } = await supabase.from('products').select('sales').eq('id', id).single();
      const sales = (data?.sales || 0) + 1;
      await supabase.from('products').update({ sales }).eq('id', id);
      res.json({ success: true, sales });
    } catch (e) {
      res.status(500).json({ error: 'Server error parsing sales' });
    }
  });



  // Dynamic OG Tags for profiles (Must be AFTER API routes but BEFORE Vite/Prod fallbacks)
  app.get('/:slug', async (req, res, next) => {
    const { slug } = req.params;
    
    // Reserved keywords that shouldn't match a profile slug (system paths)
    const reserved = [
      'login', 'register', 'admin', 'dashboard', 'api', 
      'assets', 'vite', '@vite', '@react-refresh', 'node_modules',
      'favicon.ico', 'robots.txt'
    ];
    
    // Ignore internal files, paths with dots, starting with @, or reserved keywords
    if (reserved.includes(slug.toLowerCase()) || slug.includes('.') || slug.startsWith('@')) {
      return next();
    }
    
    try {
      console.log(`🔍 [SLUG-ROUTE] Serving metadata for: ${slug}`);
      // Use ilike for case-insensitive slug match
      const { data: profile } = await supabase.from('profiles').select('*').ilike('slug', slug).single();
      
      const indexPath = path.join(process.cwd(), 'index.html');
      if (!fs.existsSync(indexPath)) return next();
      
      let html = fs.readFileSync(indexPath, 'utf-8');

      // Crucial: Injetar o Preamble do Vite usando path base '/' para garantir funcionamento local
      if (vite) {
         console.log('⚡ Injecting Vite Preamble into the static HTML');
         html = await vite.transformIndexHtml('/', html);
         console.log('🔍 Preamble injection check:', html.includes('__vite_plugin_react_preamble') || html.includes('@vite/client'));
      }
      
      if (profile) {
        console.log(`✅ Profile found: ${profile.username}`);
        const title = `${profile.display_name} - Smart Cartão`;
        const description = profile.role_title || 'Meu Cartão Digital';
        const image = profile.profile_image || profile.banner_image || 'https://smartcartao.com/og-default.png';
        
        html = html.replace('{{title}}', title)
                   .replace('{{description}}', description)
                   .replace('{{image}}', image);
      } else {
        console.log(`🤷 Profile not found for slug: ${slug}, using fallback`);
        html = html.replace('{{title}}', 'Smart Cartão')
                   .replace('{{description}}', 'Crie seu cartão digital agora')
                   .replace('{{image}}', 'https://smartcartao.com/og-default.png');
      }
      
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (err) {
      console.error("❌ Error serving dynamic tags for slug:", slug, err);
      next();
    }
  });

  // AFTER Slug route, add Vite middleware (Dev fallback for system pages like /login, /dashboard)
  if (vite) {
    app.use(vite.middlewares);
    console.log('✅ Vite middleware integrated as fallback for system routes');
  }



  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Start setup for local dev
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  setupApp();
} else {
  // Prod setup (mostly for Vercel)
  setupApp();
}

// Export the app for Vercel
export default app;
