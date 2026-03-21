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

const app = express();
app.use(express.json());
app.use(cookieParser());

// Dynamic OG Tags for profiles
app.get('/:slug', async (req, res, next) => {
  const { slug } = req.params;
  const reserved = ['login', 'register', 'admin', 'api', 'assets', 'vite'];
  if (reserved.includes(slug) || slug.includes('.')) return next();
  
  try {
    const { data: profile } = await supabase.from('profiles').select('*').eq('slug', slug).single();
    
    // Read index.html from project root
    const indexPath = path.join(process.cwd(), 'index.html');
    if (!fs.existsSync(indexPath)) return next();
    
    let html = fs.readFileSync(indexPath, 'utf-8');
    
    if (profile) {
      const title = `${profile.display_name} - Smart Cartão`;
      const description = profile.role_title || 'Meu Cartão Digital';
      const image = profile.profile_image || 'https://smartcartao.com/og-default.png';
      
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

// API Routes
app.post('/api/auth/register', async (req, res) => {
  const { username, password, display_name, role_title, slug } = req.body;
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: username.includes('@') ? username : `${username}@smartcartao.com`,
      password: password,
      email_confirm: true
    });
    if (authError) throw authError;
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: authData.user.id, username, display_name, role_title, slug });
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
    res.json({ user: { id: data.user.id, username, slug: profile?.slug } });
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
  res.json(profile);
});

app.put('/api/me', authenticate, async (req: any, res) => {
  const fields = ['display_name', 'role_title', 'profile_image', 'card_bottom_image', 'card_background_image', 'footer_text', 'primary_color', 'background_color', 'social_links', 'marquee_text', 'show_marquee', 'marquee_speed', 'whatsapp', 'instagram', 'facebook'];
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
  const { user_id, ...data } = req.body;
  const { data: result, error } = await supabase.from('products').insert({ ...data, user_id: req.user.id }).select('id').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ id: result.id });
});

app.put('/api/products/:id', authenticate, async (req: any, res) => {
  const { user_id, ...data } = req.body;
  const { error } = await supabase.from('products').update(data).eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/products/:id', authenticate, async (req: any, res) => {
  const { error } = await supabase.from('products').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

export default app;
