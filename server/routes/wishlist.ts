import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const wishlistItems = db.prepare(`
      SELECT w.id, p.id as product_id, p.name, p.price, p.image_url 
      FROM wishlist w 
      JOIN products p ON w.product_id = p.id 
      WHERE w.user_id = ?
    `).all(userId);
    
    res.json(wishlistItems);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const existingItem = db.prepare('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?')
      .get(userId, productId);

    if (!existingItem) {
      const id = uuidv4();
      db.prepare('INSERT INTO wishlist (id, user_id, product_id) VALUES (?, ?, ?)')
        .run(id, userId, productId);
    }

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    db.prepare('DELETE FROM wishlist WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
