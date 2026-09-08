import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Enable JSON body parser
app.use(express.json({ limit: '10mb' }));

// Ensure data persistence directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const STORES_FILE = path.join(DATA_DIR, 'stores.json');

interface UserRecord {
  uid: string;
  email: string;
  passwordHash: string;
  displayName: string;
  token: string;
  createdAt: string;
}

interface UserDataStore {
  sales: any[];
  presets: any[];
  settings: any;
  updatedAt: string;
}

function getUsers(): Record<string, UserRecord> {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading users file:', e);
  }
  return {};
}

function saveUsers(users: Record<string, UserRecord>) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving users file:', e);
  }
}

function getStores(): Record<string, UserDataStore> {
  try {
    if (fs.existsSync(STORES_FILE)) {
      return JSON.parse(fs.readFileSync(STORES_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading stores file:', e);
  }
  return {};
}

function saveStores(stores: Record<string, UserDataStore>) {
  try {
    fs.writeFileSync(STORES_FILE, JSON.stringify(stores, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving stores file:', e);
  }
}

function hashPassword(pass: string): string {
  return crypto.createHash('sha256').update(pass + 'profit_flow_salt_v1').digest('hex');
}

function authenticateRequest(req: express.Request): UserRecord | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const users = getUsers();
  for (const uid in users) {
    if (users[uid].token === token) {
      return users[uid];
    }
  }
  return null;
}

// -------------------------------------------------------------
// CLOUD API ROUTES
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsers();

  // Check if email already exists
  for (const uid in users) {
    if (users[uid].email === normalizedEmail) {
      return res.status(400).json({ error: 'Este correo electrónico ya está registrado.' });
    }
  }

  const uid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const token = crypto.randomBytes(32).toString('hex');
  const newUser: UserRecord = {
    uid,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    displayName: displayName?.trim() || normalizedEmail.split('@')[0],
    token,
    createdAt: new Date().toISOString()
  };

  users[uid] = newUser;
  saveUsers(users);

  // Initialize empty data store
  const stores = getStores();
  stores[uid] = {
    sales: [],
    presets: [],
    settings: null,
    updatedAt: new Date().toISOString()
  };
  saveStores(stores);

  return res.json({
    user: {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.displayName,
      isAnonymous: false
    },
    token: newUser.token
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passHash = hashPassword(password);
  const users = getUsers();

  let foundUser: UserRecord | null = null;
  for (const uid in users) {
    if (users[uid].email === normalizedEmail) {
      if (users[uid].passwordHash === passHash) {
        foundUser = users[uid];
      }
      break;
    }
  }

  if (!foundUser) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
  }

  // Refresh token
  foundUser.token = crypto.randomBytes(32).toString('hex');
  users[foundUser.uid] = foundUser;
  saveUsers(users);

  return res.json({
    user: {
      uid: foundUser.uid,
      email: foundUser.email,
      displayName: foundUser.displayName,
      isAnonymous: false
    },
    token: foundUser.token
  });
});

// Check Session / Current User
app.get('/api/auth/me', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  return res.json({
    user: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      isAnonymous: false
    }
  });
});

// Pull all data for user
app.get('/api/sync/pull', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const stores = getStores();
  const userStore = stores[user.uid] || {
    sales: [],
    presets: [],
    settings: null,
    updatedAt: new Date().toISOString()
  };

  return res.json({
    sales: userStore.sales || [],
    presets: userStore.presets || [],
    settings: userStore.settings || null,
    updatedAt: userStore.updatedAt
  });
});

// Push entire dataset (or batch merge)
app.post('/api/sync/push', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { sales, presets, settings } = req.body;
  const stores = getStores();

  const current = stores[user.uid] || {
    sales: [],
    presets: [],
    settings: null,
    updatedAt: new Date().toISOString()
  };

  if (Array.isArray(sales)) {
    current.sales = sales;
  }
  if (Array.isArray(presets)) {
    current.presets = presets;
  }
  if (settings) {
    current.settings = settings;
  }
  current.updatedAt = new Date().toISOString();

  stores[user.uid] = current;
  saveStores(stores);

  return res.json({ success: true, updatedAt: current.updatedAt });
});

// Upsert single sale
app.post('/api/sync/sale', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const sale = req.body;
  if (!sale || !sale.id) {
    return res.status(400).json({ error: 'Venta inválida' });
  }

  const stores = getStores();
  const current = stores[user.uid] || { sales: [], presets: [], settings: null, updatedAt: '' };
  
  const existingIndex = current.sales.findIndex((s: any) => s.id === sale.id);
  if (existingIndex >= 0) {
    current.sales[existingIndex] = sale;
  } else {
    current.sales.unshift(sale);
  }
  current.updatedAt = new Date().toISOString();
  stores[user.uid] = current;
  saveStores(stores);

  return res.json({ success: true, updatedAt: current.updatedAt });
});

// Delete single sale
app.delete('/api/sync/sale/:id', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const saleId = req.params.id;
  const stores = getStores();
  const current = stores[user.uid] || { sales: [], presets: [], settings: null, updatedAt: '' };
  
  current.sales = current.sales.filter((s: any) => s.id !== saleId);
  current.updatedAt = new Date().toISOString();
  stores[user.uid] = current;
  saveStores(stores);

  return res.json({ success: true, updatedAt: current.updatedAt });
});

// -------------------------------------------------------------
// VITE SPA SERVER SETUP
// -------------------------------------------------------------
async function startServer() {
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
