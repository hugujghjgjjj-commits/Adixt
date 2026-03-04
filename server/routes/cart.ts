import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const cartItems = db.prepare(`
      SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.image_url 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?
    `).all(userId);
    
    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const existingItem = db.prepare('SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?')
      .get(userId, productId) as any;

    if (existingItem) {
      db.prepare('UPDATE cart SET quantity = ? WHERE id = ?')
        .run(existingItem.quantity + quantity, existingItem.id);
    } else {
      const id = uuidv4();
      db.prepare('INSERT INTO cart (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)')
        .run(id, userId, productId, quantity);
    }

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { quantity } = req.body;
    const cartId = req.params.id;

    if (quantity <= 0) {
      db.prepare('DELETE FROM cart WHERE id = ? AND user_id = ?').run(cartId, userId);
    } else {
      db.prepare('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?').run(quantity, cartId, userId);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    db.prepare('DELETE FROM cart WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
