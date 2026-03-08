import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, db } from './db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import wishlistRoutes from './routes/wishlist.js';
import usersRoutes from './routes/users.js';
import otpRoutes from './routes/otp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

// Initialize DB
initDb();

app.get('/api/debug/db', (req, res) => {
  try {
    const products = db.prepare('SELECT COUNT(*) as count FROM products').get() as any;
    const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    res.json({ 
      products: products.count, 
      users: users.count,
      dbPath: process.env.VERCEL ? '/tmp/database.sqlite' : path.join(__dirname, '..', '..', 'database.sqlite')
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/otp', otpRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
