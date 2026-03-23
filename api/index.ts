import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Auth Middlewares (Defined first to avoid hoisting issues)
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const authenticateMaster = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.email !== 'master@smartcartao.com' && decoded.email !== 'adm@smartcartao.com') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const app = express();
app.use(express.json());
app.use(cookieParser());

// Public settings (Publicly accessible)
app.get('/api/settings', async (req, res) => {
  const { data, error } = await supabase.from('system_settings').select('*').eq('id', 1).single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get('/api/plans-data', async (req, res) => {
  const { data: plans, error } = await supabase.from('plans').select('*').order('id', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(plans);
});

app.get('/api/testimonials', async (req, res) => {
  const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});



// Auth Middlewares moved to top

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
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    const token = jwt.sign({ id: data.user.id, email: data.user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
    
    // Return profile data including is_admin flag for frontend routing
    res.json({ 
      user: { 
        id: data.user.id, 
        username, 
        slug: profile?.slug, 
        is_admin: profile?.is_admin || (data.user.email === 'master@smartcartao.com' || data.user.email === 'adm@smartcartao.com')
      } 
    });
  } catch (err: any) {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// authenticateMaster moved to top

app.get('/api/me', authenticate, async (req: any, res) => {
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', req.user.id).single();
  if (error) return res.status(404).json({ error: 'Perfil não encontrado' });
  
  // Status check
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
  const fields = ['display_name', 'establishment', 'role_title', 'profile_image', 'card_bottom_image', 'card_background_image', 'footer_text', 'primary_color', 'background_color', 'social_links', 'marquee_text', 'show_marquee', 'marquee_speed', 'whatsapp', 'instagram', 'facebook'];
  const updateData: any = {};
  fields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });
  
  const { error } = await supabase.from('profiles').update(updateData).eq('id', req.user.id);
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

app.get('/api/profile/:slug', async (req, res) => {
  const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('slug', req.params.slug).single();
  if (profileError || !profile) return res.status(404).json({ error: 'Perfil não encontrado' });
  
  // Increment views
  await supabase.from('profiles').update({ views: (profile.views || 0) + 1 }).eq('id', profile.id);

  const { data: products } = await supabase.from('products').select('*').eq('user_id', profile.id);
  res.json({ user: profile, products: products || [] });
});

app.get('/api/products', authenticate, async (req: any, res) => {
  const { data: products, error } = await supabase.from('products').select('*').eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(products);
});

app.post('/api/products', authenticate, async (req: any, res) => {
  const { name, image, description, colors, images, consortium_image, liberacred_image, has_liberacred, has_consortium, is_highlighted, is_new, year, price, mileage, brand, condition, fuel, transmission, color, optionals, show_consortium_plans, consortium_plans } = req.body;
  const { data: result, error } = await supabase.from('products').insert({
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
    consortium_plans: Array.isArray(consortium_plans) ? JSON.stringify(consortium_plans) : (consortium_plans || '[]')
  }).select('id').single();
  
  if (error) return res.status(400).json({ error: error.message });
  res.json({ id: result.id });
});

app.put('/api/products/:id', authenticate, async (req: any, res) => {
  const { name, image, description, colors, images, consortium_image, liberacred_image, has_liberacred, has_consortium, is_highlighted, is_new, year, price, mileage, brand, condition, fuel, transmission, color, optionals, show_consortium_plans, consortium_plans } = req.body;
  const { error } = await supabase.from('products').update({
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
    consortium_plans: Array.isArray(consortium_plans) ? JSON.stringify(consortium_plans) : (consortium_plans || '[]')
  }).eq('id', parseInt(req.params.id)).eq('user_id', req.user.id);
  
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/products/:id', authenticate, async (req: any, res) => {
  const { error } = await supabase.from('products').delete().eq('id', parseInt(req.params.id)).eq('user_id', req.user.id);
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

// Admin Management Routes
app.get('/api/admin/users', authenticateMaster, async (req, res) => {
  const { data: profiles, error } = await supabase.from('profiles').select('*').order('username');
  if (error) return res.status(400).json({ error: error.message });
  res.json(profiles);
});

app.get('/api/admin/stats', authenticateMaster, async (req, res) => {
  try {
    const userRes = await supabase.from('profiles').select('id, username, is_admin, plan_id, status, views', { count: 'exact' });
    const userProfiles = userRes.data || [];
    const userCount = userRes.count || userProfiles.length;
    const totalViews = userProfiles.reduce((acc, curr) => acc + (curr.views || 0), 0);
    const adminsCount = userProfiles.filter(u => u.username === 'admin' || u.is_admin === true || u.is_admin === 'true').length;
    const membersCount = userProfiles.length - adminsCount;
    const { data: plans } = await supabase.from('plans').select('*');
    const planStats = (plans || []).map(p => ({
      name: p.name,
      count: userProfiles.filter(u => u.plan_id && Number(u.plan_id) === Number(p.id)).length
    }));
    const noPlanCount = userProfiles.filter(u => !u.plan_id).length;
    if (noPlanCount > 0) planStats.push({ name: 'Sem Plano', count: noPlanCount });
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersCount = (authUsers?.users || []).filter(u => new Date(u.created_at) > thirtyDaysAgo).length;
    const activeCount = userProfiles.filter(u => u.status === 'active').length;
    const inactiveCount = userProfiles.length - activeCount;
    res.json({ userCount, totalViews, adminsCount, membersCount, planStats, newUsersCount, activeCount, inactiveCount });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', authenticateMaster, async (req, res) => {
  const { error } = await supabase.auth.admin.deleteUser(req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.put('/api/admin/users/:id/update', authenticateMaster, async (req: any, res) => {
  const { display_name, establishment, role_title, slug, status, plan_type, expiry_date, admin_message } = req.body;
  const { error } = await supabase.from('profiles').update({ 
    display_name, establishment, role_title, slug, status, plan_type,
    plan_id: req.body.plan_id || null,
    expiry_date: expiry_date || null,
    admin_message,
    admin_message_date: new Date().toISOString(),
    is_admin: req.body.is_admin === true
  }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.post('/api/admin/testimonials', authenticateMaster, async (req, res) => {
  const { name, content, rating } = req.body;
  const { data, error } = await supabase.from('testimonials').insert([{ name, content, rating: parseInt(rating as any) || 5 }]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

app.delete('/api/admin/testimonials/:id', authenticateMaster, async (req, res) => {
  const { error } = await supabase.from('testimonials').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Admin Settings
app.get('/api/admin/settings', authenticateMaster, async (req, res) => {
  const { data: settings, error } = await supabase.from('system_settings').select('*').eq('id', 1).single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(settings);
});

app.put('/api/admin/settings', authenticateMaster, async (req, res) => {
  const { 
    default_logo, default_phone, footer_logo, favicon, footer_text, system_version,
    landing_concept_title, landing_concept_subtitle, landing_features_title,
    landing_cta_title, landing_cta_subtitle, landing_cta_button,
    landing_example1, landing_example2, landing_example3, landing_example4,
    landing_concept_item1_t, landing_concept_item1_d,
    landing_concept_item2_t, landing_concept_item2_d,
    landing_concept_item3_t, landing_concept_item3_d
  } = req.body;
  
  const { error } = await supabase.from('system_settings').update({ 
    default_logo, default_phone, footer_logo, favicon, footer_text, system_version,
    landing_concept_title, landing_concept_subtitle, landing_features_title,
    landing_cta_title, landing_cta_subtitle, landing_cta_button,
    landing_example1, landing_example2, landing_example3, landing_example4,
    landing_concept_item1_t, landing_concept_item1_d,
    landing_concept_item2_t, landing_concept_item2_d,
    landing_concept_item3_t, landing_concept_item3_d
  }).eq('id', 1);
  
  if (error) {
    console.error('Settings Update Error:', error);
    return res.status(400).json({ error: error.message });
  }
  res.json({ success: true });
});

// Admin Plans
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

app.post('/api/admin/plans', authenticateMaster, async (req, res) => {
  const { name, months, price, description, features, billing_cycle, is_popular } = req.body;
  const { data, error } = await supabase.from('plans').insert({ 
    name, months, price, description, features, billing_cycle, is_popular 
  }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.put('/api/admin/plans/:id', authenticateMaster, async (req: any, res) => {
  const { name, months, price, description, features, billing_cycle, is_popular } = req.body;
  const { error } = await supabase.from('plans').update({ 
    name, months, price, description, features, billing_cycle,
    is_popular: is_popular === true || is_popular === 1
  }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/admin/plans/:id', authenticateMaster, async (req: any, res) => {
  const { error } = await supabase.from('plans').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/public/settings', async (req, res) => {
  const { data: settings } = await supabase.from('system_settings').select('*').eq('id', 1).single();
  res.json(settings || {});
});

// Dynamic OG Tags for profiles
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
    // Use ilike for case-insensitive slug match in production
    const { data: profile } = await supabase.from('profiles').select('*').ilike('slug', slug).single();
    
    // Read index.html from project root
    const indexPath = path.join(process.cwd(), 'index.html');
    if (!fs.existsSync(indexPath)) return next();
    
    let html = fs.readFileSync(indexPath, 'utf-8');
    
    if (profile) {
      const title = `${profile.display_name} - Smart Cartão`;
      const description = profile.role_title || 'Meu Cartão Digital';
      const image = profile.profile_image || profile.banner_image || 'https://smartcartao.com/og-default.png';
      
      html = html.replace('{{title}}', title)
                 .replace('{{description}}', description)
                 .replace('{{image}}', image);
    } else {
      html = html.replace('{{title}}', 'Smart Cartão')
                 .replace('{{description}}', 'Crie seu cartão digital agora')
                 .replace('{{image}}', 'https://smartcartao.com/og-default.png');
    }
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (err) {
    next();
  }
});

export default app;
