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

// Transfer admin rights (Make Owner)
router.put('/:id/transfer-admin', requireAdmin, (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = (req as any).user.id;

    console.log(`[Admin Transfer] Initiating transfer from ${currentUserId} to ${targetUserId}`);

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'You are already an admin' });
    }

    // Verify target user exists
    const targetUser = db.prepare('SELECT id, email FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    const transaction = db.transaction(() => {
      // Make target user admin
      const result1 = db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(targetUserId);
      console.log(`[Admin Transfer] Set target user admin: ${result1.changes} changes`);

      // Remove admin from current user
      const result2 = db.prepare('UPDATE users SET is_admin = 0 WHERE id = ?').run(currentUserId);
      console.log(`[Admin Transfer] Removed current user admin: ${result2.changes} changes`);
    });

    transaction();
    console.log('[Admin Transfer] Transaction completed successfully');
    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to transfer admin:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

export default router;
