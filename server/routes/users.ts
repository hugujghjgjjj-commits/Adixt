import express from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users
router.get('/', requireAdmin, (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, is_admin, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user admin status
router.put('/:id/admin', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;

    // Prevent removing own admin status
    if (id === (req as any).user.id && !isAdmin) {
      return res.status(400).json({ error: 'Cannot remove your own admin status' });
    }

    db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(isAdmin ? 1 : 0, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transfer admin rights
router.put('/:id/transfer-admin', requireAdmin, (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = (req as any).user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'You are already an admin' });
    }

    const transaction = db.transaction(() => {
      // Make target user admin
      db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(targetUserId);
      // Remove admin from current user
      db.prepare('UPDATE users SET is_admin = 0 WHERE id = ?').run(currentUserId);
    });

    transaction();
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to transfer admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
