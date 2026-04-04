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

// Webhook Debug Logger (Persisted in Supabase)
const addWebhookLog = async (data: any) => {
  try {
    await supabase.from('webhook_logs').insert([{
      event: data.event,
      payload: data.body,
      headers: data.headers
    }]);
  } catch (err) {
    console.error('[DEBUG-LOG] Failed to save webhook log:', err);
  }
};

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

  // Webhook Debug Route (Persistent)
  app.get('/api/webhooks/debug', authenticateMaster, async (req, res) => {
    const { data, error } = await supabase.from('webhook_logs').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  // Onboarding Routes
  app.get('/api/admin/onboarding', authenticateMaster, async (req, res) => {
    const { data, error } = await supabase.from('onboarding_submissions').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  app.post('/api/public/onboarding', async (req, res) => {
    const { 
      client_name, 
      client_email, 
      client_whatsapp, 
      niche, 
      setup_type, 
      product_estimated_count, 
      business_name, 
      business_location, 
      additional_notes,
      client_document,
      role_title,
      suggested_username,
      client_logo_url,
      suggested_password
    } = req.body;

    const { data, error } = await supabase.from('onboarding_submissions').insert([{
      client_name,
      client_email,
      client_whatsapp,
      niche,
      setup_type,
      product_estimated_count,
      business_name,
      business_location,
      additional_notes,
      client_document,
      role_title,
      suggested_username,
      client_logo_url,
      suggested_password,
      status: 'pending'
    }]).select().single();
    
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  app.put('/api/admin/onboarding/:id/status', authenticateMaster, async (req, res) => {
    const { status } = req.body;
    const { error } = await supabase.from('onboarding_submissions').update({ status }).eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete('/api/admin/onboarding/:id', authenticateMaster, async (req, res) => {
    const { error } = await supabase.from('onboarding_submissions').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  });

  // Webhook for Payment Confirmation (to be called by external system)
  app.post('/api/webhooks/payments', async (req, res) => {
    const { user_id, status, months, plan_id, plan_name, event, invoice, client } = req.body;
    const apiKey = req.headers['x-api-key'];

    console.log(`[WEBHOOK] Received event: ${event || status} from PagiXyPay`);
    addWebhookLog({ event: event || status, body: req.body, headers: req.headers });

    if (apiKey !== process.env.OTHER_SYSTEM_API_KEY) {
      console.warn('[WEBHOOK] Unauthorized API Key attempt');
      return res.status(401).json({ error: 'Unauthorized webhook call' });
    }

    // Handle PagixyPay new format
    if (event) {
      if (event === 'invoice.created' && invoice) {
        // Try multiple fields for user identification (Invoice level or Client level)
        const final_user_id = invoice.smartcartao_user_id || 
                            invoice.external_reference || 
                            invoice.user_id || 
                            client?.external_id || 
                            client?.id;
        
        if (!final_user_id) {
          console.warn('[WEBHOOK-PAGIXY] No user ID found in invoice payload');
          return res.status(400).json({ error: 'User ID missing' });
        }

        console.log(`[WEBHOOK-PAGIXY] Creating invoice for user ${final_user_id}`);
        // Ensure values are clean
        const amount = String(invoice.amount).replace('R$', '').replace(' ', '').replace(',', '.').trim();

        const { error } = await supabase.from('faturas').insert([{
          user_id: final_user_id,
          amount: amount,
          due_date: invoice.due_date,
          payment_link: invoice.payment_link || invoice.url || invoice.checkout_url,
          status: 'pending'
        }]);
        
        if (error) {
          console.error('[WEBHOOK] Fatura insert error:', error.message);
          return res.status(500).json({ error: 'DB Error' });
        }
        return res.json({ success: true, message: 'Invoice recorded' });
      }

      if (event === 'payment.received') {
        const final_user_id = invoice?.external_reference || 
                            invoice?.smartcartao_user_id || 
                            invoice?.user_id || 
                            client?.external_id;
                            
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

        // Update fatura status (Find by amount if reference missing?) 
        // Better: update all pending for this user to paid? Usually 1 invoice per event
        await supabase.from('faturas').update({ status: 'paid' }).eq('user_id', final_user_id).eq('status', 'pending');

        console.log(`[WEBHOOK] Payment confirmed for user ${final_user_id}. Access extended.`);
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

  // API Routes
  app.post('/api/auth/register', authenticateMaster, async (req, res) => {
    const { username, password, display_name, role_title, slug, plan_id, profile_image } = req.body;
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
      let planPriceValue = '49,00';
      if (plan_id) {
        const { data: plan } = await supabase.from('plans').select('*').eq('id', plan_id).single();
        if (plan) {
          const d = new Date();
          d.setMonth(d.getMonth() + plan.months);
          expiryDate = d.toISOString().split('T')[0];
          planName = plan.name;
          planPriceValue = plan.price || '49,00';
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
          profile_image: profile_image || default_logo,
          whatsapp: default_phone,
          documento: req.body.documento || req.body.cpf || null,
          email: req.body.email || authData.user.email,
          plan_id: plan_id || null,
          expiry_date: expiryDate,
          is_admin: req.body.is_admin === true,
          niche: req.body.niche || 'vehicle'
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
           // Fallback: Create a pending manual invoice
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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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
    const { display_name, establishment, role_title, profile_image, card_bottom_image, card_background_image, profile_banner_image, show_catalog_banner, show_profile_banner, footer_text, primary_color, background_color, social_links, marquee_text, show_marquee, marquee_speed, whatsapp, instagram, facebook } = req.body;
    const { error } = await supabase
      .from('profiles')
      .update({ display_name, establishment, role_title, profile_image, card_bottom_image, card_background_image, profile_banner_image, show_catalog_banner, show_profile_banner, footer_text, primary_color, background_color, social_links, marquee_text, show_marquee, marquee_speed, whatsapp, instagram, facebook, niche: req.body.niche })
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
          documento: req.body.documento || req.body.cpf || null,
          email: req.body.email || null,
          admin_message,
          admin_message_date: new Date().toISOString(),
          is_admin: req.body.is_admin === true,
          niche: req.body.niche
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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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

    const activeProducts = (products || []).filter(p => p.is_active !== false);
    res.json({ user: profile, products: activeProducts });
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

  app.post('/api/products', authenticate, async (req: any, res: any) => {
    const { name, image, description, colors, images, consortium_image, liberacred_image, has_liberacred, has_consortium, is_highlighted, is_new, year, price, mileage, brand, condition, fuel, transmission, color, optionals, show_consortium_plans, consortium_plans, video_url } = req.body;
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
        card_interest: !!req.body.card_interest,
        is_active: req.body.is_active !== undefined ? !!req.body.is_active : true,
        niche: req.body.niche || 'vehicle',
        property_type: req.body.property_type || null,
        bedrooms: req.body.bedrooms || null,
        bathrooms: req.body.bathrooms || null,
        suites: req.body.suites || null,
        parking_spaces: req.body.parking_spaces || null,
        area: req.body.area || null,
        location: req.body.location || null,
        is_for_sale: req.body.is_for_sale !== undefined ? !!req.body.is_for_sale : true,
        is_for_rent: req.body.is_for_rent !== undefined ? !!req.body.is_for_rent : false,
        condo_fee: req.body.condo_fee || null,
        iptu: req.body.iptu || null,
        map_url: req.body.map_url || null,
        video_url: video_url || null
      })
      .select('id')
      .single();
    
    if (error) return res.status(400).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.put('/api/products/:id', authenticate, async (req: any, res) => {
    const updateData: any = {};
    const fields = [
      'name', 'image', 'description', 'colors', 'images', 'consortium_image', 
      'liberacred_image', 'has_liberacred', 'has_consortium', 'is_highlighted', 
      'is_new', 'year', 'price', 'mileage', 'brand', 'condition', 'fuel', 
      'transmission', 'color', 'optionals', 'show_consortium_plans', 
      'consortium_plans', 'show_financing_plans', 'financing_plans',
      'cash_price', 'card_installments', 'card_interest', 'is_active',
      'niche', 'property_type', 'bedrooms', 'bathrooms', 'suites', 
      'parking_spaces', 'area', 'location', 'is_for_sale', 'is_for_rent', 
      'condo_fee', 'iptu', 'map_url', 'video_url'
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

    const { error } = await supabase
      .from('products')
      .update(updateData)
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



  // Standard SPA Routes with default metadata (Landing Page, Login, Register, etc.)
  app.get(['/', '/login', '/register', '/plans', '/admin', '/admin/*', '/dashboard', '/dashboard/*'], async (req, res, next) => {
    try {
      const indexPath = path.join(process.cwd(), 'index.html');
      if (!fs.existsSync(indexPath)) return next();
      
      let html = fs.readFileSync(indexPath, 'utf-8');
      if (vite) html = await vite.transformIndexHtml('/', html);

      html = html.replaceAll('{{title}}', 'Smart Cartão')
                 .replaceAll('{{description}}', 'Crie seu cartão digital agora')
                 .replaceAll('{{image}}', 'https://smartcartao.com/og-default.png');
      
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (e) {
      next();
    }
  });

  // Dynamic OG Tags for profiles (Must be AFTER API routes but BEFORE Vite/Prod fallbacks)
  app.get(['/:slug', '/:slug/catalogo'], async (req, res, next) => {
    const { slug } = req.params;
    const isCatalog = req.path.endsWith('/catalogo');
    
    // Reserved keywords that shouldn't match a profile slug (system paths)
    const reserved = [
      'login', 'register', 'admin', 'dashboard', 'api', 
      'assets', 'vite', '@vite', '@react-refresh', 'node_modules',
      'favicon.ico', 'robots.txt'
    ];
    
    // Ignore internal files, paths with dots, starting with @, or reserved keywords
    if (slug.includes('.') || slug.startsWith('@')) {
      return next();
    }

    const isReserved = reserved.includes(slug.toLowerCase());
    
    try {
      console.log(`🔍 [SLUG-ROUTE] Serving metadata for: ${slug}`);
      
      const indexPath = path.join(process.cwd(), 'index.html');
      if (!fs.existsSync(indexPath)) return next();
      
      let html = fs.readFileSync(indexPath, 'utf-8');

      // Crucial: Injetar o Preamble do Vite usando path base '/' para garantir funcionamento local
      if (vite) {
         html = await vite.transformIndexHtml('/', html);
      }
      
      // Fallback values
      let title = 'Smart Cartão';
      let description = 'Crie seu cartão digital agora';
      let image = 'https://smartcartao.com/og-default.png';

      if (!isReserved) {
        // Use ilike for case-insensitive slug match
        const { data: profile } = await supabase.from('profiles').select('*').ilike('slug', slug).single();
        
        if (profile) {
          console.log(`✅ Profile found: ${profile.username}`);
          title = isCatalog ? `Catálogo | ${profile.display_name}` : `${profile.display_name} - Smart Cartão`;
          description = profile.role_title || 'Meu Cartão Digital';
          image = profile.profile_image || profile.profile_banner_image || profile.card_background_image || image;
        } else {
          console.log(`🤷 Profile not found for slug: ${slug}, using fallback`);
        }
      }
      
      html = html.replaceAll('{{title}}', title)
                 .replaceAll('{{description}}', description)
                 .replaceAll('{{image}}', image);
      
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
