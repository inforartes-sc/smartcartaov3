import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('database.db');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    display_name TEXT,
    role_title TEXT,
    profile_image TEXT,
    whatsapp TEXT,
    instagram TEXT,
    facebook TEXT,
    slug TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    image TEXT,
    description TEXT,
    colors TEXT,
    consortium_image TEXT,
    has_liberacred INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // API Routes
  app.post('/api/auth/register', async (req, res) => {
    const { username, password, display_name, role_title, slug } = req.body;
    try {
      const hash = await bcrypt.hash(password, 10);
      const stmt = db.prepare('INSERT INTO users (username, password_hash, display_name, role_title, slug) VALUES (?, ?, ?, ?, ?)');
      const info = stmt.run(username, hash, display_name, role_title, slug);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ user: { id: user.id, username: user.username, slug: user.slug } });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  app.get('/api/me', authenticate, (req: any, res) => {
    const user = db.prepare('SELECT id, username, display_name, role_title, profile_image, whatsapp, instagram, facebook, slug FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  });

  app.put('/api/me', authenticate, (req: any, res) => {
    const { display_name, role_title, profile_image, whatsapp, instagram, facebook } = req.body;
    const stmt = db.prepare(`
      UPDATE users 
      SET display_name = ?, role_title = ?, profile_image = ?, whatsapp = ?, instagram = ?, facebook = ?
      WHERE id = ?
    `);
    stmt.run(display_name, role_title, profile_image, whatsapp, instagram, facebook, req.user.id);
    res.json({ success: true });
  });

  // Public Profile Route
  app.get('/api/profile/:slug', (req, res) => {
    const user: any = db.prepare('SELECT id, display_name, role_title, profile_image, whatsapp, instagram, facebook, slug FROM users WHERE slug = ?').get(req.params.slug);
    if (!user) return res.status(404).json({ error: 'Profile not found' });
    
    const products = db.prepare('SELECT * FROM products WHERE user_id = ?').all(user.id);
    res.json({ user, products });
  });

  // Product Routes
  app.get('/api/products', authenticate, (req: any, res) => {
    const products = db.prepare('SELECT * FROM products WHERE user_id = ?').all(req.user.id);
    res.json(products);
  });

  app.post('/api/products', authenticate, (req: any, res) => {
    const { name, image, description, colors, consortium_image, has_liberacred } = req.body;
    const stmt = db.prepare(`
      INSERT INTO products (user_id, name, image, description, colors, consortium_image, has_liberacred)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(req.user.id, name, image, description, JSON.stringify(colors), consortium_image, has_liberacred ? 1 : 0);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete('/api/products/:id', authenticate, (req: any, res) => {
    const stmt = db.prepare('DELETE FROM products WHERE id = ? AND user_id = ?');
    stmt.run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
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

startServer();
