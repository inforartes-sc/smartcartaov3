import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const viewCache: Record<string, number> = {};
const VIEW_COOLDOWN = 60 * 60 * 1000;

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Auth & Permissions
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

const authenticateMaster = async (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', decoded.id).single();
    if (profile?.username === 'admin' || (profile as any)?.is_admin === true) {
      req.user = decoded;
      return next();
    }
    res.status(403).json({ error: 'Acesso negado' });
  } catch (err) {
    res.status(401).json({ error: 'Sessão inválida' });
  }
};

// --- ROUTES ---

// Master Users
app.get('/api/admin/users', authenticateMaster, async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').order('username');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.delete('/api/admin/users/:id', authenticateMaster, async (req, res) => {
  const { error } = await supabase.auth.admin.deleteUser(req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.put('/api/admin/users/:id/update', authenticateMaster, async (req: any, res) => {
  const { error } = await supabase.from('profiles').update({ ...req.body, updated_at: new Date() }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.put('/api/admin/users/:id/password', authenticateMaster, async (req: any, res) => {
  const { error } = await supabase.auth.admin.updateUserById(req.params.id, { password: req.body.password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Stats
app.get('/api/admin/stats', authenticateMaster, async (req, res) => {
  try {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: plans } = await supabase.from('plans').select('*');
    const userProfiles = profiles || [];
    res.json({ 
      userCount: userProfiles.length, 
      totalViews: userProfiles.reduce((acc, curr) => acc + (curr.views || 0), 0),
      adminsCount: userProfiles.filter(u => u.username === 'admin' || u.is_admin === true).length,
      membersCount: userProfiles.length - userProfiles.filter(u => u.username === 'admin' || u.is_admin === true).length,
      planStats: (plans || []).map(p => ({
        name: p.name,
        count: userProfiles.filter(u => u.plan_id && Number(u.plan_id) === Number(p.id)).length
      })),
      newUsersCount: userProfiles.filter(u => new Date(u.created_at || Date.now()) > new Date(Date.now() - 30*24*60*60*1000)).length,
      activeCount: userProfiles.filter(u => u.status === 'active').length,
      inactiveCount: userProfiles.filter(u => u.status !== 'active').length
    });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// Settings & Plans
app.get('/api/settings', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const { data, error } = await supabase.from('system_settings').select('*').eq('id', 1).single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get('/api/public/settings', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const { data } = await supabase.from('system_settings').select('*').eq('id', 1).single();
  res.json(data || {});
});

app.get('/api/admin/settings', authenticateMaster, async (req, res) => {
  const { data } = await supabase.from('system_settings').select('*').eq('id', 1).single();
  res.json(data);
});

app.put('/api/admin/settings', authenticateMaster, async (req, res) => {
  await supabase.from('system_settings').update(req.body).eq('id', 1);
  res.json({ success: true });
});

app.get('/api/admin/plans', authenticateMaster, async (req, res) => {
  const { data } = await supabase.from('plans').select('*').order('id');
  res.json(data || []);
});

app.get('/api/public/plans', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const { data: plans, error } = await supabase.from('plans').select('*').order('id', { ascending: true });
  res.json(plans || []);
});

app.put('/api/admin/plans/:id', authenticateMaster, async (req, res) => {
  const { name, months, price, description, features, billing_cycle, is_popular, discount } = req.body;
  const { error } = await supabase.rpc('update_plan_direct', { 
    p_id: parseInt(req.params.id),
    p_name: name,
    p_months: months,
    p_price: price,
    p_description: description,
    p_features: features,
    p_billing_cycle: billing_cycle,
    p_is_popular: is_popular,
    p_discount: discount || 0
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.post('/api/admin/plans', authenticateMaster, async (req, res) => {
  const { data, error } = await supabase.from('plans').insert([req.body]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Onboarding
app.get('/api/admin/onboarding', authenticateMaster, async (req, res) => {
  const { data } = await supabase.from('onboarding_submissions').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

app.post('/api/public/onboarding', async (req, res) => {
  await supabase.from('onboarding_submissions').insert([req.body]);
  res.json({ success: true });
});

app.delete('/api/admin/onboarding/:id', authenticateMaster, async (req, res) => {
  await supabase.from('onboarding_submissions').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Common Auth
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const email = username.includes('@') ? username : `${username}@smartcartao.com`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: 'Erro de login' });
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  const token = jwt.sign({ id: data.user.id, email: data.user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ user: { id: data.user.id, username, slug: profile?.slug, is_admin: profile?.is_admin || username === 'admin' } });
});

app.post('/api/auth/register', authenticateMaster, async (req, res) => {
  const { username, password, display_name, slug, profile_image } = req.body;
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: req.body.email || `${username}@smartcartao.com`, password, email_confirm: true
    });
    if (authError) throw authError;
    await supabase.from('profiles').insert({ 
      id: authData.user.id, username, display_name, slug, profile_image,
      documento: req.body.documento || req.body.cpf, niche: req.body.niche || 'vehicle', status: 'active'
    });
    res.json({ id: authData.user.id });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

app.get('/api/me', authenticate, async (req: any, res) => {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', req.user.id).single();
  res.json({ ...profile, is_admin: profile?.is_admin || profile?.username === 'admin' });
});

// Products & Profile
app.get('/api/products', authenticate, async (req: any, res) => {
  const { data } = await supabase.from('products').select('*').eq('user_id', req.user.id);
  res.json(data || []);
});

app.get('/api/profile/:slug', async (req, res) => {
  const { data: profile } = await supabase.from('profiles').select('*').eq('slug', req.params.slug).single();
  if (!profile) return res.status(404).json({ error: 'Perfil não encontrado' });
  await supabase.from('profiles').update({ views: (profile.views || 0) + 1 }).eq('id', profile.id);
  const { data: products } = await supabase.from('products').select('*').eq('user_id', profile.id);
  res.json({ user: profile, products: (products || []).filter(p => p.is_active !== false) });
});

// Vercel SPA Metadata
app.get(['/', '/login', '/register', '/admin', '/admin/*', '/dashboard', '/dashboard/*', '/plans', '/onboarding', '/:slug'], async (req, res, next) => {
  if (req.url.startsWith('/api/') || req.url.includes('.')) return next();
  try {
    const paths = [path.join(process.cwd(), 'dist', 'templ.html'), path.join(process.cwd(), 'dist', 'index.html'), path.join(process.cwd(), 'index.html')];
    let indexPath = paths.find(p => fs.existsSync(p)) || '';
    if (!indexPath) return next();
    let html = fs.readFileSync(indexPath, 'utf-8');
    const { data: profile } = req.params.slug ? await supabase.from('profiles').select('*').ilike('slug', req.params.slug).single() : { data: null };
    const { data: settings } = await supabase.from('system_settings').select('default_logo').eq('id', 1).single();
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html
      .replaceAll('{{title}}', profile?.display_name ? `${profile.display_name} - Smart Cartão` : 'Smart Cartão')
      .replaceAll('{{description}}', profile?.role_title || 'Crie seu cartão digital agora')
      .replaceAll('{{image}}', profile?.profile_image || settings?.default_logo || 'https://smartcartao.com/og-default.png'));
  } catch (err) { next(); }
});

export default app;
