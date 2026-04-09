import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import os from 'os';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
const authenticate = async (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  
  // DEBUG LOGS
  if (req.path === '/api/me') {
    console.log(`\n--- [DEBUG-COOKIE] Pedido para ${req.path} ---`);
    console.log(`Headers Cookie: ${req.headers.cookie || '[VAZIO]'}`);
    console.log(`Parsed Cookies: ${JSON.stringify(req.cookies)}`);
  }

  if (!token) {
    if (req.path === '/api/me') console.log('❌ Token não encontrado nos cookies');
    return res.status(401).json({ error: 'Não autorizado' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // FETCH PROFILE
    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (dbError || !profile) {
      console.log(`❌ [AUTH-ERROR] Perfil não encontrado para ID ${decoded.id}: ${dbError?.message || 'vazio'}`);
      return res.status(401).json({ error: 'Perfil não encontrado' });
    }

    req.user = { 
      ...profile,
      id: profile.id,
      is_admin: profile.is_admin || profile.username === 'admin' 
    };
    next();
  } catch (err: any) {
    console.log(`❌ [AUTH-ERROR] Falha no JWT: ${err.message}`);
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
        const externalApiUrl = process.env.OTHER_SYSTEM_API_URL || 'https://pagixypay.smartcartao.com.br/api/clients';
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
      const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL || !!process.env.VERCEL_URL;
      const cookieOptions: any = {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
      };

      res.cookie('token', token, cookieOptions);
      console.log(`✅ [DEBUG-COOKIE] Cookie 'token' Enviado para o usuário ${username}. Opções: ${JSON.stringify(cookieOptions)}`);
      res.json({ 
        user: { 
          ...profile,
          id: data.user.id, 
          username, 
          is_admin: profile?.is_admin || username === 'admin' 
        } 
      });
    } catch (err: any) {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    const cookieOptions: any = {
      httpOnly: true,
      path: '/'
    };
    if (isProduction) {
      cookieOptions.secure = true;
      cookieOptions.sameSite = 'none';
    }
    res.clearCookie('token', cookieOptions);
    res.json({ success: true });
  });

  app.get('/api/me', authenticate, async (req: any, res) => {
    // Prevent browser from caching auth status
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // REUSE CACHED USER DATA FROM MIDDLEWARE
    const profile = req.user;
    
    if (profile?.status === 'blocked') {
        res.clearCookie('token');
        return res.status(403).json({ error: 'Conta Bloqueada' });
    }

    // Expiry Check (Already performed in middleware? No, let's keep for security)
    if (profile?.expiry_date && new Date(profile.expiry_date) < new Date()) {
        await supabase.from('profiles').update({ status: 'blocked' }).eq('id', profile.id);
        res.clearCookie('token');
        return res.status(403).json({ error: 'Conta Expirada' });
    }

    // Consultants count only specifically on /me
    const { count } = await supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', profile.id);
    
    const { data: profileWithPlan } = await supabase
      .from('profiles')
      .select('*, plan:plans(*)')
      .eq('id', profile.id)
      .single();

    res.json({
      ...(profileWithPlan || profile),
      consultants_count: count || 0
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
      let user_limit = 5;
      let agency_limit = 0;
      const plan_id = req.body.plan_id;

      // Fetch plan details to get quotas
      if (plan_id) {
        const { data: plan } = await supabase.from('plans').select('*').eq('id', plan_id).single();
        if (plan) {
          // Handle "Ilimitado" or high numbers
          const quota = String(plan.quota).toLowerCase();
          const agencies = String(plan.agencies).toLowerCase();
          
          user_limit = (quota.includes('ilimitado') || quota.includes('unlimit')) ? 9999 : (parseInt(quota) || 5);
          agency_limit = (agencies.includes('ilimitado') || agencies.includes('unlimit')) ? 9999 : (parseInt(agencies) || 0);
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          display_name,
          establishment,
          role_title,
          slug,
          status,
          plan_type: req.body.plan_type || 'Standard',
          plan_id: plan_id || null,
          expiry_date: expiry_date || null,
          documento: req.body.documento || req.body.cpf || null,
          email: req.body.email || null,
          admin_message,
          admin_message_date: new Date().toISOString(),
          is_admin: req.body.is_admin === true,
          niche: req.body.niche,
          user_limit,
          agency_limit
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
      const externalApiUrl = process.env.OTHER_SYSTEM_API_URL || 'https://pagixypay.smartcartao.com.br/api/clients';
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
    const { name, months, price, description, features, billing_cycle, is_popular, quota, agencies } = req.body;
    const { data, error } = await supabase.from('plans').insert({ 
      name, 
      months, 
      price: price || '0,00', 
      description: description || '',
      features: features || '', 
      billing_cycle: billing_cycle || 'monthly',
      is_popular: is_popular === true || is_popular === 1,
      quota: quota || '',
      agencies: agencies || ''
    }).select().single();
    if (error) {
      console.error('Plan Creation Error:', error);
      return res.status(400).json({ error: error.message });
    }
    res.json(data);
  });

  app.put('/api/admin/plans/:id', authenticateMaster, async (req, res) => {
    const { name, months, price, description, features, billing_cycle, is_popular, quota, agencies } = req.body;
    console.log(`[DEBUG] Updating Plan ID: ${req.params.id}`, req.body);
    
    try {
      const { data, error } = await supabase
        .from('plans')
        .update({
          name,
          months: parseInt(String(months || 1)),
          price: price || '0,00',
          description: description || '',
          features: features || '',
          billing_cycle: billing_cycle || 'monthly',
          is_popular: is_popular === true || is_popular === 1,
          quota: quota || '',
          agencies: agencies || ''
        })
        .eq('id', parseInt(req.params.id))
        .select();

      if (error) {
        console.error('[DEBUG] Plan Update Error:', error);
        return res.status(400).json({ error: error.message });
      }
      
      console.log(`[DEBUG] Plan ${req.params.id} updated successfully:`, data?.[0]);
      res.json({ success: true, plan: data?.[0] });
    } catch (err: any) {
      console.error('Plan Update Catch Error:', err);
      res.status(500).json({ error: 'Erro interno ao atualizar plano' });
    }
  });

// PUBLIC PROFILE CACHE (Slug -> Data)
// To prevent slamming the DB on every catalog load
const publicCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to clear profile cache globally or for a specific slug
const clearPublicCache = (slug?: string) => {
  if (slug) {
    console.log(`[CACHE] Clearing cache for slug: ${slug}`);
    delete publicCache[slug];
  } else {
    console.log('[CACHE] Clearing entire public cache');
    Object.keys(publicCache).forEach(key => delete publicCache[key]);
  }
};

// Public Profile Route
app.get('/api/profile/:slug', async (req, res) => {
  const { slug } = req.params;
  const now = Date.now();

  // 1. Check Cache First
  if (publicCache[slug] && now - publicCache[slug].timestamp < CACHE_TTL) {
    return res.json(publicCache[slug].data);
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  
  try {
    // 2. Fetch Profile or Team Member in Parallel
    const [profileRes, memberRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('slug', slug).single(),
      supabase.from('team_members').select('*').eq('slug', slug).single()
    ]);

    let finalProfile = profileRes.data;
    let isTeamMember = false;

    if (!finalProfile && memberRes.data) {
      const member = memberRes.data;
      // Fetch Hierarchy Info in Parallel
      const [parentRes, rootRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', member.parent_id).single(),
        supabase.from('profiles').select('*').eq('id', member.root_id).single()
      ]);

      const parent = parentRes.data;
      const root = rootRes.data;
      const brandingSource = parent || root;

      finalProfile = {
        ...member, 
        display_name: member.name,
        profile_image: member.photo_url,
        // Inherit branding from DIRECT PARENT or ROOT
        primary_color: brandingSource?.primary_color,
        background_color: brandingSource?.background_color,
        social_links: brandingSource?.social_links,
        marquee_text: brandingSource?.marquee_text,
        show_marquee: brandingSource?.show_marquee,
        marquee_speed: brandingSource?.marquee_speed,
        establishment: brandingSource?.establishment,
        card_bottom_image: brandingSource?.card_bottom_image,
        card_background_image: brandingSource?.card_background_image,
        profile_banner_image: brandingSource?.profile_banner_image,
        show_catalog_banner: brandingSource?.show_catalog_banner,
        show_profile_banner: brandingSource?.show_profile_banner,
        niche: brandingSource?.niche,
        footer_text: brandingSource?.footer_text
      };
      isTeamMember = true;
    }

    if (!finalProfile) return res.status(404).json({ error: 'Perfil não encontrado' });

    // 3. Views Management (Non-blocking)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const viewKey = `view-${ip}-${slug}`;
    if (!viewCache[viewKey] || now - viewCache[viewKey] > VIEW_COOLDOWN) {
      if (!isTeamMember) {
        supabase.from('profiles').update({ views: (finalProfile.views || 0) + 1 }).eq('id', finalProfile.id).then();
      }
      viewCache[viewKey] = now;
    }

    // 4. Load Products & Settings in Parallel
    const catalogOwnerId = finalProfile.root_id || finalProfile.id;
    const branchToFilterId = finalProfile.root_id ? (finalProfile.parent_id || finalProfile.id) : null;
    const allowedOwners = [...new Set([catalogOwnerId, branchToFilterId, finalProfile.id])].filter(Boolean);

    const [productsRes, settingsRes] = await Promise.all([
      supabase.from('products').select('*').in('user_id', allowedOwners),
      branchToFilterId ? supabase.from('branch_product_settings').select('*').eq('branch_id', branchToFilterId) : Promise.resolve({ data: [] })
    ]);

    const activeProducts = (productsRes.data || []).map(p => {
       // MASTER KILL SWITCH: If product is inactive at matrix origin, hide everywhere
       if (p.is_active === false) return null;

       // CRITICAL: Filter matrix products for any non-matrix view (Branch or Consultant)
       const isViewingOwnCatalog = String(p.user_id) === String(finalProfile.id);
       const isSharedProduct = p.show_on_branches !== false;

       if (!isViewingOwnCatalog && !isSharedProduct) {
          return null; // Don't show matrix-exclusive products on branch/consultant catalogs
       }

       if (p.user_id === catalogOwnerId) {
         const setting = settingsRes.data?.find(s => s.product_id === p.id);
         if (setting) {
           return { 
             ...p, 
             is_active: setting.is_active !== false, 
             price: setting.price_override || p.price,
             is_highlighted: setting.is_highlighted === true
           };
         }
       }
       return p;
    }).filter(p => p !== null && p.is_active !== false);

    const responsePayload = { user: finalProfile, products: activeProducts };

    // 5. Store in Cache and Return
    publicCache[slug] = { data: responsePayload, timestamp: now };
    res.json(responsePayload);

  } catch (err: any) {
    console.error('[PUBLIC-CATALOG-ERROR]', err);
    res.status(500).json({ error: 'Erro ao carregar catálogo' });
  }
});

  // Consultants Management
  app.get('/api/consultants', authenticate, async (req: any, res) => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('parent_id', req.user.id)
      .order('name');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  app.post('/api/consultants', authenticate, async (req: any, res) => {
    const { name, display_name, whatsapp, photo_url, role_title, slug } = req.body;
    try {
      console.log(`[CONSULTANT] Creating team member: ${name} for parent: ${req.user.id}`);
      
      // 1. Check if slug exists anywhere (profiles or team_members)
      const { data: pExisting } = await supabase.from('profiles').select('id').eq('slug', slug).single();
      const { data: mExisting } = await supabase.from('team_members').select('id').eq('slug', slug).single();
      
      if (pExisting || mExisting) {
        return res.status(400).json({ error: 'Este link (slug) já está em uso.' });
      }

      // 2. Insert into team_members (NO AUTH REQUIRED)
      const { data: parentProfile } = await supabase.from('profiles').select('root_id, user_limit').eq('id', req.user.id).single();
      const actualRootId = parentProfile?.root_id || req.user.id;
      const limit = parentProfile?.user_limit || 5;

      // 3. CHECK USER LIMIT FOR THIS ACCOUNT
      const { count: currentCount } = await supabase
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', req.user.id);

      if ((currentCount || 0) >= limit) {
         return res.status(400).json({ error: `Você atingiu seu limite de ${limit} cartões. Entre em contato com a matriz para solicitar mais vagas.` });
      }

      const { data, error: insertError } = await supabase
        .from('team_members')
        .insert({
          name: display_name || name,
          slug: slug.toLowerCase(),
          whatsapp,
          photo_url: photo_url || req.body.profile_image,
          role_title: role_title || 'Consultor de Vendas',
          parent_id: req.user.id,
          root_id: actualRootId, 
          is_active: true
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('[CONSULTANT-INSERT-ERROR]', insertError);
        return res.status(400).json({ error: 'Erro ao cadastrar consultor.' });
      }

      res.json({ success: true, member: data });
    } catch (err: any) {
      console.error('[CONSULTANT-CATCH-ERROR]', err);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

  app.put('/api/consultants/:id', authenticate, async (req: any, res) => {
    const { display_name, whatsapp, photo_url, role_title, slug } = req.body;
    try {
      // 1. Check slug uniqueness (if it changed)
      const { data: current } = await supabase.from('team_members').select('slug').eq('id', req.params.id).single();
      if (current?.slug !== slug) {
        const { data: pExisting } = await supabase.from('profiles').select('id').eq('slug', slug).single();
        const { data: mExisting } = await supabase.from('team_members').select('id').eq('slug', slug).single();
        if (pExisting || mExisting) {
          return res.status(400).json({ error: 'Este link (slug) já está em uso.' });
        }
      }

      const { data, error } = await supabase
        .from('team_members')
        .update({
          name: display_name,
          slug: slug.toLowerCase(),
          whatsapp,
          photo_url,
          role_title,
          updated_at: new Date()
        })
        .eq('id', req.params.id)
        .eq('parent_id', req.user.id)
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, member: data });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/consultants/:id', authenticate, async (req: any, res) => {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', req.params.id)
      .eq('parent_id', req.user.id);
      
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  });

  // Agencies Management (Level 2: Branches)
  app.get('/api/agencies', authenticate, async (req: any, res) => {
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('root_id', req.user.id)
        .order('display_name');
      
      if (profileError) throw profileError;

      // Fetch emails from auth.users (since it's a small list)
      const { data: authData } = await supabase.auth.admin.listUsers();
      const userList = authData?.users || [];
      
      const agenciesWithEmail = (profiles || []).map(p => {
        const authUser = userList.find(u => u.id === p.id);
        return { ...p, email: authUser?.email };
      });
      
      res.json(agenciesWithEmail);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/agencies', authenticate, async (req: any, res) => {
    const { email, password, display_name, slug, whatsapp, user_limit } = req.body;
    try {
      console.log(`[AGENCY] Attempting to create branch: ${display_name} (${email}) with limit: ${user_limit || 5}`);
      
      // 1. Pre-validation: Check if email or slug exists
      const { data: existingProfile } = await supabase.from('profiles')
        .select('id')
        .or(`username.eq.${slug},slug.eq.${slug}`)
        .single();
      
      if (existingProfile) {
        return res.status(400).json({ error: 'Este link (slug) já está em uso.' });
      }

      // Check if email already has an auth account
      const { data: emailData } = await supabase.auth.admin.listUsers();
      if (emailData?.users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
      }

      // 2. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
      
      if (authError) {
        console.error('[AGENCY-AUTH-ERROR]', authError);
        return res.status(400).json({ error: authError.message });
      }

      // 3. Create Profile linked to Matriz
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: slug.toLowerCase(),
          display_name,
          slug: slug.toLowerCase(),
          whatsapp,
          root_id: req.user.id, 
          status: 'active',
          user_limit: parseInt(String(user_limit)) || 5
        });
      
      if (profileError) {
         console.error('[AGENCY-PROFILE-ERROR]', profileError);
         await supabase.auth.admin.deleteUser(authData.user.id);
         return res.status(400).json({ error: 'Erro ao criar perfil da agência.' });
      }

      console.log(`[AGENCY] Branch created successfully: ${authData.user.id}`);
      res.json({ success: true, id: authData.user.id });
    } catch (err: any) {
      console.error('[AGENCY-CATCH-ERROR]', err);
      res.status(500).json({ error: 'Erro interno no servidor ao criar agência.' });
    }
  });

  app.put('/api/agencies/:id', authenticate, async (req: any, res) => {
    const { display_name, slug, whatsapp, profile_image, password, user_limit } = req.body;
    try {
      // 1. Check slug uniqueness
      const { data: current } = await supabase.from('profiles').select('slug').eq('id', req.params.id).single();
      if (current?.slug !== slug) {
        const { data: existing } = await supabase.from('profiles').select('id').eq('slug', slug).single();
        if (existing) return res.status(400).json({ error: 'Este link (slug) já está em uso.' });
      }

      // 2. Update Password if provided
      if (password && password.trim().length > 0) {
        const { error: authError } = await supabase.auth.admin.updateUserById(req.params.id, { password });
        if (authError) throw authError;
      }

      // 3. Update Profile
      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name,
          slug: slug.toLowerCase(),
          whatsapp,
          profile_image,
          username: slug.toLowerCase(),
          user_limit: user_limit ? parseInt(String(user_limit)) : undefined,
          updated_at: new Date()
        })
        .eq('id', req.params.id)
        .eq('root_id', req.user.id)
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, member: data });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/agencies/:id', authenticate, async (req: any, res) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

// Helper to clean numeric strings (mask -> number)
const cleanNumeric = (val: any) => {
  if (!val || typeof val !== 'string') return val;
  const cleaned = val.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  return isNaN(parseFloat(cleaned)) ? null : parseFloat(cleaned);
};

  // Product Routes
  app.get('/api/products', authenticate, async (req: any, res) => {
    try {
      const isBranch = !!req.user.root_id;
      const matrixId = req.user.root_id;
      const localId = req.user.id;
      
      console.log(`[PRODUCTS-FETCH-DEBUG] User: ${localId}, isBranch: ${isBranch}, matrixId: ${matrixId}`);
      
      // 1. Fetch Inherited Matrix Products
      let matrixProducts: any[] = [];
      if (isBranch && matrixId) {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', matrixId)
          .eq('show_on_branches', true)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        matrixProducts = data || [];
      }

      // 2. Fetch Local/Own Products
      const { data: ownProducts } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', localId)
        .order('created_at', { ascending: false });
      
      const localProducts = ownProducts || [];

      // 3. Fetch Branch Settings (Overrides/Toggles)
      let branchSettings: any[] = [];
      if (isBranch) {
        const { data } = await supabase
          .from('branch_product_settings')
          .select('*')
          .eq('branch_id', localId);
        branchSettings = data || [];
      }

      // 4. Combine & Apply Overrides
      const combined = [...localProducts.map(p => ({ ...p, is_inherited: false })), 
                        ...matrixProducts.map(p => {
                          const setting = branchSettings.find(s => s.product_id === p.id);
                          return { 
                            ...p, 
                            is_inherited: true, 
                            is_active: setting ? setting.is_active : true,
                            price: setting?.price_override || p.price,
                            is_highlighted: setting ? (setting.is_highlighted === true) : (p.is_highlighted === true)
                          };
                        })];

      console.log(`[PRODUCTS-FETCH] User ${localId} fetched ${combined.length} products`);
      if (combined.length > 0) {
        console.log(`[PRODUCTS-FETCH-DEBUG] is_highlighted type: ${typeof combined[0].is_highlighted}, value: ${combined[0].is_highlighted}`);
      }
      res.json(combined);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/products/toggle', authenticate, async (req: any, res) => {
    const { productId, isActive, priceOverride, isHighlighted } = req.body;
    if (!req.user.root_id) return res.status(403).json({ error: 'Apenas filiais podem sobrescrever produtos da matriz' });
    
    try {
        const updateData: any = { 
            branch_id: req.user.id, 
            product_id: productId
        };
        if (isActive !== undefined) updateData.is_active = isActive;
        if (priceOverride !== undefined) updateData.price_override = priceOverride;
        if (isHighlighted !== undefined) updateData.is_highlighted = isHighlighted;

        const { error } = await supabase
          .from('branch_product_settings')
          .upsert(updateData, { onConflict: 'branch_id,product_id' });
        
        if (error) throw error;
        
        console.log('[PRODUCTS-TOGGLE-SUCCESS] Branch settings updated for:', req.user.id);
        clearPublicCache(); // Update catalog immediately
        res.json({ success: true });
    } catch (err: any) {
        console.error('[PRODUCTS-TOGGLE-CATCH]', err);
        res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/products', authenticate, async (req: any, res: any) => {
    const { name, image, description, colors, images, consortium_image, liberacred_image, has_liberacred, has_consortium, is_highlighted, is_new, year, price, mileage, brand, condition, fuel, transmission, color, optionals, show_consortium_plans, consortium_plans, video_url, property_status, show_on_branches } = req.body;
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
        price: cleanNumeric(price),
        mileage: cleanNumeric(mileage),
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
        cash_price: cleanNumeric(req.body.cash_price),
        card_installments: req.body.card_installments || null,
        card_interest: !!req.body.card_interest,
        is_active: req.body.is_active !== undefined ? !!req.body.is_active : true,
        niche: req.body.niche || 'vehicle',
        property_type: req.body.property_type || null,
        bedrooms: req.body.bedrooms || null,
        bathrooms: req.body.bathrooms || null,
        suites: req.body.suites || null,
        parking_spaces: req.body.parking_spaces || null,
        area: cleanNumeric(req.body.area),
        location: req.body.location || null,
        is_for_sale: req.body.is_for_sale !== undefined ? !!req.body.is_for_sale : true,
        is_for_rent: req.body.is_for_rent !== undefined ? !!req.body.is_for_rent : false,
        condo_fee: cleanNumeric(req.body.condo_fee),
        iptu: cleanNumeric(req.body.iptu),
        map_url: req.body.map_url || null,
        video_url: video_url || null,
        property_status: property_status || 'ready',
        show_on_branches: show_on_branches !== undefined ? !!show_on_branches : true
      })
      .select('id')
      .single();
    
    if (error) return res.status(400).json({ error: error.message });
    clearPublicCache(); // Force catalog refresh
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
      'condo_fee', 'iptu', 'map_url', 'video_url', 'property_status',
      'show_on_branches'
    ];

    const fieldsToClean = ['price', 'mileage', 'area', 'cash_price', 'condo_fee', 'iptu'];
    
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (fieldsToClean.includes(field)) {
          updateData[field] = cleanNumeric(req.body[field]);
        } else if (['colors', 'images', 'optionals', 'consortium_plans', 'financing_plans'].includes(field)) {
          updateData[field] = Array.isArray(req.body[field]) ? JSON.stringify(req.body[field]) : req.body[field];
        } else if (['has_liberacred', 'has_consortium', 'is_highlighted', 'is_new', 'show_consortium_plans', 'show_financing_plans', 'card_interest', 'is_active', 'is_for_sale', 'is_for_rent', 'show_on_branches'].includes(field)) {
          updateData[field] = req.body[field] === true;
        } else {
          updateData[field] = req.body[field] || null;
        }
      }
    });

    const productId = parseInt(req.params.id);
    console.log(`[PRODUCTS-UPDATE] Updating product ${productId} for user ${req.user.id}:`, updateData);

    // 1. Check if the product belongs to the user
    const { data: product } = await supabase.from('products').select('user_id').eq('id', productId).single();
    
    if (product && product.user_id !== req.user.id) {
       // If not owned by user, check if user is a branch and product is from their matrix
       if (req.user.root_id && product.user_id === req.user.root_id) {
          console.log(`[PRODUCTS-UPDATE] Product ${productId} is inherited. Saving overrides to branch_product_settings.`);
          const { error: upsertError } = await supabase
            .from('branch_product_settings')
            .upsert({
              branch_id: req.user.id,
              product_id: productId,
              is_active: updateData.is_active !== undefined ? updateData.is_active : true,
              price_override: updateData.price !== undefined ? updateData.price : undefined,
              is_highlighted: updateData.is_highlighted !== undefined ? updateData.is_highlighted : false
            }, { onConflict: 'branch_id,product_id' });
            
          if (upsertError) return res.status(400).json({ error: upsertError.message });
          return res.json({ success: true, message: 'Overrides saved' });
       }
       return res.status(403).json({ error: 'Você não tem permissão para editar este produto' });
    }

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .eq('user_id', req.user.id)
      .select();
    
    if (error) {
      console.error('[PRODUCTS-UPDATE-ERROR]', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log(`[PRODUCTS-UPDATE-SUCCESS] Updated data:`, data?.[0]);
    clearPublicCache(); // Force catalog refresh
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
  app.get(['/', '/:slug', '/:slug/catalogo'], async (req, res, next) => {
    const isCatalog = req.path.includes('/catalogo');
    const slug = req.params.slug || 'home';
    
    // Reserved keywords that should use regular site metadata
    const reserved = [
      'admin', 'login', 'dashboard', 'pricing', 'onboarding', 'register', 
      'master', 'financeiro', 'settings', 'plans', 'users', 'master-admin',
      'home', 'index', 'app'
    ];
    
    // Ignore internal files, paths with dots, or starting with @
    if (slug.includes('.') || slug.startsWith('@')) {
      return next();
    }

    const isReserved = reserved.includes(slug.toLowerCase());
    
    try {
      console.log(`🔍 [SLUG-ROUTE] Serving metadata for: ${slug}`);
      
      let html = '';
      try {
        const potentialFile = path.resolve(process.cwd(), 'index.html');
        const potentialDist = path.resolve(process.cwd(), 'dist/templ.html');
        const isVercel = !!process.env.VERCEL;
        
        console.log(`🛠️ [DEBUG] Env: ${process.env.NODE_ENV}, Vercel: ${isVercel}`);
        console.log(`📂 [DEBUG] Checking: ${potentialDist}`);
        
        // List files for debugging if not found
        if (!fs.existsSync(potentialDist)) {
          try {
            const files = fs.readdirSync(process.cwd());
            console.log(`📁 [DEBUG] Root Files: ${files.join(', ')}`);
            if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
              const distFiles = fs.readdirSync(path.join(process.cwd(), 'dist'));
              console.log(`📁 [DEBUG] Dist Files: ${distFiles.join(', ')}`);
            }
          } catch (e) {}
        }

        if (fs.existsSync(potentialDist)) {
          html = fs.readFileSync(potentialDist, 'utf-8');
        } else if (fs.existsSync(potentialFile)) {
          html = fs.readFileSync(potentialFile, 'utf-8');
        } else {
           console.log("⚠️ Using internal fallback HTML with OG Tags");
           html = `<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <meta name="description" content="{{description}}" />
    <meta property="og:title" content="{{title}}" />
    <meta property="og:description" content="{{description}}" />
    <meta property="og:image" content="{{image}}" />
    <meta property="og:image:secure_url" content="{{image}}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:type" content="website" />
    <link rel="image_src" href="{{image}}" />
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/assets/index.js"></script>
</body>
</html>`;
        }
      } catch (e) {
        html = `<!DOCTYPE html><html><head><title>Smart Cartão</title></head><body><div id="root"></div></body></html>`;
      }

      // Crucial: Injetar o Preamble do Vite usando path base '/' para garantir funcionamento local
      if (vite) {
         html = await vite.transformIndexHtml('/', html);
      }
      
      // Fallback values
      let title = 'Smart Cartão';
      let description = 'Crie seu cartão digital agora';
      let image = 'https://smartcartao.com/og-default.png';

      if (isReserved) {
        // Fetch default logo from settings for main site sharing
        try {
          const { data: settings } = await supabase.from('settings').select('default_logo, landing_hero_description').single();
          if (settings?.default_logo) {
            // Ensure absolute URL
            let logoUrl = settings.default_logo;
            if (logoUrl.startsWith('/')) {
              logoUrl = `https://${req.get('host')}${logoUrl}`;
            }
            // Add cache-buster to force WhatsApp to reload
            image = `${logoUrl}?v=${Date.now()}`;
          }
          if (settings?.landing_hero_description) description = settings.landing_hero_description;
        } catch (e) {}
      } else {
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
      
      // Global replacement to ensure all instances are swapped
      html = html.replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`)
                 .replace(/{{title}}/g, title)
                 .replace(/{{description}}/g, description)
                 .replace(/{{image}}/g, image);
      
      // Safety: If for some reason tokens still exist, clean them up
      html = html.replace(/{{title}}|{{description}}|{{image}}/g, '');
      
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
    console.log(`\n🚀 Servidor Rodando!`);
    console.log(`📡 Local:            http://localhost:${PORT}`);
    
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]!) {
        if (net.family === 'IPv4' && !net.internal) {
          console.log(`📡 Rede Local (${name}): http://${net.address}:${PORT}`);
        }
      }
    }
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
