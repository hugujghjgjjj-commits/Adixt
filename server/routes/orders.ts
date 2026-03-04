import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    
    // Fetch items for each order
    const ordersWithItems = orders.map((order: any) => {
      const items = db.prepare(`
        SELECT oi.*, p.name, p.image_url 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = ?
      `).all(order.id);
      return { ...order, items };
    });

    res.json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Get cart items
    const cartItems = db.prepare(`
      SELECT c.id, c.quantity, p.id as product_id, p.price 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?
    `).all(userId) as any[];

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderId = uuidv4();

    const createOrder = db.transaction(() => {
      // Create order
      db.prepare('INSERT INTO orders (id, user_id, total_amount, status) VALUES (?, ?, ?, ?)')
        .run(orderId, userId, totalAmount, 'processing');

      // Create order items
      const insertItem = db.prepare('INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)');
      for (const item of cartItems) {
        insertItem.run(uuidv4(), orderId, item.product_id, item.quantity, item.price);
      }

      // Clear cart
      db.prepare('DELETE FROM cart WHERE user_id = ?').run(userId);
    });

    createOrder();

    res.status(201).json({ success: true, orderId });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const orderId = req.params.id;

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId) as any;
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = db.prepare(`
      SELECT oi.*, p.name, p.image_url 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = ?
    `).all(orderId);

    res.json({ ...order, items });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
