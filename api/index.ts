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

const authenticateMaster = async (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
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
    console.error('[AUTH] Master verification failed:', err);
    res.status(401).json({ error: 'Sessão inválida. Por favor, faça login novamente.' });
  }
};

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Public settings (Publicly accessible)
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

app.get('/api/testimonials', async (req, res) => {
  const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});



// Financial & Billing Routes
app.get('/api/admin/faturas', authenticateMaster, async (req, res) => {
  const { data, error } = await supabase.from('faturas').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post('/api/admin/faturas', authenticateMaster, async (req, res) => {
  const { user_id, amount, due_date, payment_link } = req.body;
  const { data, error } = await supabase.from('faturas').insert([{
    user_id,
    amount,
    due_date,
    payment_link,
    status: 'pending'
  }]).select().single();
  
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.put('/api/admin/faturas/:id/status', authenticateMaster, async (req, res) => {
  const { status } = req.body;
  const { error } = await supabase.from('faturas').update({ status }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/faturas', authenticate, async (req: any, res) => {
  const { data, error } = await supabase.from('faturas').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Webhook for Payment Confirmation (to be called by external system)
app.post('/api/webhooks/payments', async (req, res) => {
  const { user_id, status, months, plan_id, plan_name, event, invoice } = req.body;
  const apiKey = req.headers['x-api-key'];

  console.log(`[WEBHOOK] Received event: ${event || status} from PagiXyPay`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('[WEBHOOK-PAYLOAD]:', JSON.stringify(req.body, null, 2));
  }

  if (apiKey !== process.env.OTHER_SYSTEM_API_KEY) {
    console.warn('[WEBHOOK] Unauthorized API Key attempt');
    return res.status(401).json({ error: 'Unauthorized webhook call' });
  }

  // Handle PagixyPay new format
  if (event) {
    if (event === 'invoice.created' && invoice) {
      // Try multiple fields for user identification
      const final_user_id = invoice.smartcartao_user_id || invoice.external_reference || invoice.user_id;
      
      if (!final_user_id) {
        console.warn('[WEBHOOK-PAGIXY] No user ID found in invoice payload');
        return res.status(400).json({ error: 'User ID missing' });
      }

      console.log(`[WEBHOOK-PAGIXY] Creating invoice for user ${final_user_id}`);
      const { error } = await supabase.from('faturas').insert([{
        user_id: final_user_id,
        amount: String(invoice.amount).replace('R$', '').trim(),
        due_date: invoice.due_date,
        payment_link: invoice.payment_link || invoice.url,
        status: 'pending'
      }]);
      
      if (error) {
        console.error('[WEBHOOK] Fatura insert error:', error.message);
        return res.status(500).json({ error: 'DB Error' });
      }
      return res.json({ success: true, message: 'Invoice recorded' });
    }

    if (event === 'payment.received') {
      const final_user_id = invoice?.external_reference || invoice?.smartcartao_user_id || invoice?.user_id;
      if (!final_user_id) return res.status(400).json({ error: 'User ID not found in payload' });

      const { data: profile } = await supabase.from('profiles').select('expiry_date, plan_id').eq('id', final_user_id).single();
      if (!profile) return res.json({ error: 'User not found in local database' });

      let monthsToAdd = 1;
      if (profile.plan_id) {
          const { data: plan } = await supabase.from('plans').select('months').eq('id', profile.plan_id).single();
          if (plan) monthsToAdd = plan.months || 1;
      }

      const baseDate = profile.expiry_date && new Date(profile.expiry_date) > new Date() 
          ? new Date(profile.expiry_date) 
          : new Date();
      
      const newDate = new Date(baseDate);
      newDate.setMonth(newDate.getMonth() + monthsToAdd);
      
      await supabase.from('profiles').update({
        status: 'active',
        expiry_date: newDate.toISOString().split('T')[0]
      }).eq('id', final_user_id);

      // Update fatura status
      await supabase.from('faturas').update({ status: 'paid' }).eq('user_id', final_user_id).eq('status', 'pending');

      console.log(`[WEBHOOK] Payment confirmed for user ${final_user_id}. Access extended to ${newDate.toISOString().split('T')[0]}`);
      return res.json({ success: true, message: 'Payment confirmed and access extended' });
    }
  }

  // Legacy / Original webhook handling
  if (status === 'paid' || status === 'active') {
    const targetId = user_id || (invoice && (invoice.external_reference || invoice.smartcartao_user_id));
    if (!targetId) return res.status(400).json({ error: 'Missing user_id' });

    const { data: profile } = await supabase.from('profiles').select('expiry_date').eq('id', targetId).single();
    
    const newDate = new Date(profile?.expiry_date || new Date());
    newDate.setMonth(newDate.getMonth() + (months || 0));
    
    const { error: updateError } = await supabase.from('profiles').update({
      status: 'active',
      plan_id: plan_id || null,
      plan_type: plan_name || 'Premium',
      expiry_date: newDate.toISOString().split('T')[0]
    }).eq('id', targetId);

    if (updateError) return res.status(400).json({ error: updateError.message });
    console.log(`[WEBHOOK] Access released for user ${targetId} (+${months} months)`);
    return res.json({ success: true, message: 'Access released' });
  }

  res.json({ success: true, message: 'Event ignored' });
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
      email: req.body.email || (username.includes('@') ? username : `${username}@smartcartao.com`),
      password: password,
      email_confirm: true
    });
    if (authError) throw authError;

    // Handle Plan Expiry if plan_id provided
    let expiryDate = null;
    let planName = 'Standard';
    let planPriceValue = '49.00';
    if (req.body.plan_id) {
      const { data: plan } = await supabase.from('plans').select('*').eq('id', req.body.plan_id).single();
      if (plan) {
        const d = new Date();
        d.setMonth(d.getMonth() + plan.months);
        expiryDate = d.toISOString().split('T')[0];
        planName = plan.name;
        planPriceValue = plan.price ? plan.price.replace(',', '.') : '49.00';
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
        documento: req.body.documento || req.body.cpf || null,
        email: req.body.email || authData.user.email,
        plan_id: req.body.plan_id || null,
        expiry_date: expiryDate,
        is_admin: req.body.is_admin === true
      });
    if (profileError) throw profileError;
    
    // INTEGRATION WITH EXTERNAL SYSTEM (PagixyPay API)
    try {
      const externalApiUrl = process.env.OTHER_SYSTEM_API_URL || 'https://pagixypay.vercel.app/api/clients';
      const apiKey = process.env.OTHER_SYSTEM_API_KEY || 'sk_live_qpaoysy10eb';
      
      console.log(`[EXTERNAL-INTEGRATION] Registering user ${username} in PagixyPay...`);
      
      const extResponse = await fetch(externalApiUrl, {
         method: 'POST',
         headers: { 
           'Content-Type': 'application/json',
           'X-API-KEY': apiKey
         },
         body: JSON.stringify({
            id: authData.user.id,
            name: display_name,
            email: req.body.email || authData.user.email,
            document: req.body.documento || req.body.cpf || null,
            password: password
         })
      }).catch((err) => {
        console.error('[EXTERNAL-INTEGRATION] Network error:', err.message);
        return null;
      });

      if (extResponse && extResponse.ok) {
        const extData: any = await extResponse.json();
        console.log('[EXTERNAL-INTEGRATION] Success Response:', extData);
        
        // PagixyPay /api/clients might not return a payment link immediately as per new docs.
        // If it does (backwards compatible/future-proof), we use it.
        const finalAmount = extData.invoice?.amount || extData.amount || planPriceValue;
        const finalLink = extData.payment_link || extData.url || extData.invoice?.payment_link || null;
        const finalDate = extData.due_date || extData.invoice?.due_date || new Date(Date.now() + 10*24*60*60*1000).toISOString();

        await supabase.from('faturas').insert([{
           user_id: authData.user.id,
           amount: String(finalAmount || planPriceValue),
           due_date: finalDate,
           payment_link: finalLink,
           status: 'pending'
        }]);
      } else {
        const extErrorBody = extResponse ? await extResponse.text().catch(() => 'unknown') : 'connection-failed';
        console.warn('[EXTERNAL-INTEGRATION] Failed. Status:', extResponse?.status, 'Body:', extErrorBody);
        
        // Create fatura locally as fallback
        await supabase.from('faturas').insert([{
           user_id: authData.user.id,
           amount: planPriceValue,
           due_date: new Date(Date.now() + 10*24*60*60*1000).toISOString(),
           status: 'pending'
        }]);
      }
    } catch (extErr) {
      console.error('[EXTERNAL-INTEGRATION] Error:', extErr);
    }
    
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
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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
  const fields = ['display_name', 'establishment', 'role_title', 'profile_image', 'card_bottom_image', 'card_background_image', 'profile_banner_image', 'show_catalog_banner', 'show_profile_banner', 'footer_text', 'primary_color', 'background_color', 'social_links', 'marquee_text', 'show_marquee', 'marquee_speed', 'whatsapp', 'instagram', 'facebook'];
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
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('slug', req.params.slug).single();
  if (profileError || !profile) return res.status(404).json({ error: 'Perfil não encontrado' });
  
  // Increment views
  await supabase.from('profiles').update({ views: (profile.views || 0) + 1 }).eq('id', profile.id);

  const { data: products } = await supabase.from('products').select('*').eq('user_id', profile.id);
  // Filter active products in code to handle cases where is_active is NULL (which means active by default)
  const activeProducts = (products || []).filter(p => p.is_active !== false);
  res.json({ user: profile, products: activeProducts });
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
    consortium_plans: Array.isArray(consortium_plans) ? JSON.stringify(consortium_plans) : (consortium_plans || '[]'),
    show_financing_plans: !!req.body.show_financing_plans,
    financing_plans: Array.isArray(req.body.financing_plans) ? JSON.stringify(req.body.financing_plans) : (req.body.financing_plans || '[]'),
    cash_price: req.body.cash_price || null,
    card_installments: req.body.card_installments || null,
    card_interest: !!req.body.card_interest,
    is_active: req.body.is_active !== undefined ? !!req.body.is_active : true
  }).select('id').single();
  
  if (error) return res.status(400).json({ error: error.message });
  res.json({ id: result.id });
});

app.put('/api/products/:id', authenticate, async (req: any, res) => {
  const updateData: any = {};
  const fields = [
    'name', 'image', 'description', 'colors', 'images', 'consortium_image', 
    'liberacred_image', 'has_liberacred', 'has_consortium', 'is_highlighted', 
    'is_new', 'year', 'price', 'mileage', 'brand', 'condition', 'fuel', 
    'transmission', 'color', 'optionals', 'show_consortium_plans', 
    'consortium_plans', 'show_financing_plans', 'financing_plans',
    'cash_price', 'card_installments', 'card_interest', 'is_active'
  ];

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (['colors', 'images', 'optionals', 'consortium_plans', 'financing_plans'].includes(field)) {
        updateData[field] = Array.isArray(req.body[field]) ? JSON.stringify(req.body[field]) : req.body[field];
      } else if (['has_liberacred', 'has_consortium', 'is_highlighted', 'is_new', 'show_consortium_plans', 'show_financing_plans', 'card_interest', 'is_active'].includes(field)) {
        updateData[field] = !!req.body[field];
      } else {
        updateData[field] = req.body[field] || null;
      }
    }
  });

  const { error } = await supabase.from('products').update(updateData).eq('id', parseInt(req.params.id)).eq('user_id', req.user.id);
  
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

app.put('/api/admin/users/:id/update', authenticateMaster, async (req: any, res) => {
  const { display_name, establishment, role_title, slug, status, plan_type, expiry_date, admin_message } = req.body;
  const { error } = await supabase.from('profiles').update({ 
    display_name, establishment, role_title, slug, status, plan_type,
    plan_id: req.body.plan_id || null,
    expiry_date: expiry_date || null,
    documento: req.body.documento || req.body.cpf || null,
    email: req.body.email || null,
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

// Test External Integration
app.post('/api/admin/test-integration', authenticateMaster, async (req, res) => {
  try {
    const externalApiUrl = process.env.OTHER_SYSTEM_API_URL || 'https://pagixypay.vercel.app/api/clients';
    const apiKey = process.env.OTHER_SYSTEM_API_KEY || 'sk_live_qpaoysy10eb';
    
    const testEmail = `test-${Date.now()}@smartcartao.com`;
    console.log(`[TEST-INTEGRATION] Testing connection to: ${externalApiUrl} using email: ${testEmail}`);
    
    const response = await fetch(externalApiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey
      },
      body: JSON.stringify({
        id: 'test-connection-id',
        name: 'Teste de Conexão',
        email: testEmail,
        document: '000.000.000-00',
        password: 'test-password-123'
      })
    }).catch(err => {
      return { ok: false, status: 500, statusText: err.message };
    });

    const responseText = response && typeof (response as any).text === 'function' 
      ? await (response as any).text().catch(() => 'No body')
      : 'Connection failed';

    res.json({
      ok: response?.ok || false,
      status: response?.status || 500,
      statusText: (response as any)?.statusText || 'Error',
      body: responseText,
      url: externalApiUrl
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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

app.delete('/api/admin/plans/:id', authenticateMaster, async (req: any, res) => {
  const { error } = await supabase.from('plans').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/public/settings', async (req, res) => {
  const { data: settings } = await supabase.from('system_settings').select('*').eq('id', 1).single();
  res.json(settings || {});
});

// Handle all SPA routes and profile slugs with metadata injection
app.get(['/', '/login', '/register', '/admin', '/admin/*', '/dashboard', '/dashboard/*', '/plans', '/:slug', '/:slug/catalogo'], async (req, res, next) => {
  let { slug } = req.params;
  const isCatalog = req.path.endsWith('/catalogo');
  const originalUrl = req.originalUrl || req.url;
  
  // Skip ONLY true API requests or static assets (files with dots)
  // Note: We check originalUrl to identify what the user actually requested
  if (originalUrl.startsWith('/api/') || (originalUrl.includes('.') && !originalUrl.startsWith('/admin/'))) {
    return next();
  }

  // Reserved system paths (from server.ts)
  const reservedSlugs = ['login', 'register', 'admin', 'dashboard', 'api', 'plans', 'assets', 'vite'];
  const isProfileSlug = slug && !reservedSlugs.includes(slug.toLowerCase()) && !originalUrl.includes('/', 1);
  
  try {
    // Read index.html from dist/ (production) or project root (fallback)
    // We look for templ.html first (our renamed index to prevent Vercel static serving)
    const possiblePaths = [
      path.join(process.cwd(), 'dist', 'templ.html'),
      path.join(process.cwd(), 'dist', 'index.html'),
      path.join(process.cwd(), 'index.html')
    ];
    
    let indexPath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        indexPath = p;
        break;
      }
    }

    if (!indexPath) return next();
    
    let html = fs.readFileSync(indexPath, 'utf-8');
    
    // Default values for system pages
    let title = 'Smart Cartão';
    let description = 'Crie seu cartão digital agora';
    
    // Fetch global system settings for the default logo and footer text
    const { data: settings } = await supabase.from('system_settings').select('*').eq('id', 1).single();
    let image = settings?.default_logo || 'https://smartcartao.com/og-default.png';

    // If it looks like a profile slug, try to fetch its metadata
    if (isProfileSlug) {
      const { data: profile } = await supabase.from('profiles').select('*').ilike('slug', slug).single();
      
      if (profile) {
        title = isCatalog ? `Catálogo | ${profile.display_name}` : `${profile.display_name} - Smart Cartão`;
        description = profile.role_title || 'Meu Cartão Digital';
        image = profile.profile_image || profile.profile_banner_image || profile.card_background_image || image;
      }
    }
    
    // Perform metadata injection
    html = html.replaceAll('{{title}}', title)
               .replaceAll('{{description}}', description)
               .replaceAll('{{image}}', image);
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (err) {
    next();
  }
});

export default app;
