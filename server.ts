import express from 'express';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, db } from './server/db.js';
import authRoutes from './server/routes/auth.js';
import productRoutes from './server/routes/products.js';
import cartRoutes from './server/routes/cart.js';
import orderRoutes from './server/routes/orders.js';
import wishlistRoutes from './server/routes/wishlist.js';
import usersRoutes from './server/routes/users.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

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
        dbPath: path.join(__dirname, '..', 'database.sqlite')
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

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    // SPA Fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
