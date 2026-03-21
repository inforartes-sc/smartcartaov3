import express from 'express';
// import { createServer as createViteServer } from 'vite'; // Moved to dynamic import
import path from 'path';
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

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Supabase configuration missing in environment variables!');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
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

async function setupApp() {
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
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
    const { display_name, role_title, profile_image, card_bottom_image, footer_text, primary_color, background_color, social_links, marquee_text, show_marquee, marquee_speed, whatsapp, instagram, facebook } = req.body;
    const { error } = await supabase
      .from('profiles')
      .update({ display_name, role_title, profile_image, card_bottom_image, footer_text, primary_color, background_color, social_links, marquee_text, show_marquee, marquee_speed, whatsapp, instagram, facebook })
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

  // Public Profile Route
  app.get('/api/profile/:slug', async (req, res) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', req.params.slug)
      .single();

    if (profileError || !profile) return res.status(404).json({ error: 'Perfil não encontrado' });
    
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
        colors,
        images,
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
        colors,
        images,
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
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete('/api/products/:id', authenticate, async (req: any, res) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  });

  // Vite middleware for development
  const isVercel = !!process.env.VERCEL;
  if (process.env.NODE_ENV !== 'production' && !isVercel) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite dev server failed to start');
    }
  } else if (!isVercel) {
    // Only serve static files if NOT on Vercel (Vercel handles this via vercel.json)
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
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
