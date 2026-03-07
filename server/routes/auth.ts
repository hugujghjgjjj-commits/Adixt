import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

router.post('/register', async (req, res) => {
  try {
    let { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    email = email.trim().toLowerCase();
    password = password.trim();

    const existingUser = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(email) as any;
    if (existingUser) {
      // If user exists, try to log them in instead of failing
      let isValid = false;
      if (existingUser.password && existingUser.password.startsWith('$2')) {
        isValid = await bcrypt.compare(password, existingUser.password);
      } else {
        isValid = password === existingUser.password;
        if (isValid) {
          const hashedPassword = await bcrypt.hash(password, 10);
          db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, existingUser.id);
        }
      }

      // Master override for the admin in preview environment to prevent lockouts
      if (email === 'mkmznup12@gmail.com') {
        isValid = true;
        const hashedPassword = await bcrypt.hash(password, 10);
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, existingUser.id);
      }

      if (isValid) {
        const token = jwt.sign({ id: existingUser.id, email: existingUser.email, isAdmin: existingUser.is_admin === 1 }, JWT_SECRET, { expiresIn: '7d' });
        
        res.cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({ 
          user: { id: existingUser.id, name: existingUser.name, email: existingUser.email, isAdmin: existingUser.is_admin === 1 },
          token 
        });
      } else {
        return res.status(400).json({ error: 'Email already exists. If this is you, please use the correct password to login.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const isAdmin = email === 'mkmznup12@gmail.com' ? 1 : 0;

    db.prepare('INSERT INTO users (id, name, email, password, is_admin) VALUES (?, ?, ?, ?, ?)')
      .run(id, name, email, hashedPassword, isAdmin);

    const token = jwt.sign({ id, email, isAdmin: isAdmin === 1 }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({ 
      user: { id, name, email, isAdmin: isAdmin === 1 },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    email = email.trim().toLowerCase();
    password = password.trim();

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(email) as any;
    console.log('[Auth] Login attempt for:', email, 'User found:', !!user);
    if (!user) {
      return res.status(401).json({ error: 'Account not found with this email' });
    }

    let isValid = false;
    // Check if password is a bcrypt hash
    if (user.password && user.password.startsWith('$2')) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // Fallback for plain text passwords (if any were manually inserted)
      isValid = password === user.password;
      if (isValid) {
        // Upgrade to hashed password
        const hashedPassword = await bcrypt.hash(password, 10);
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);
      }
    }

    // Master override for the admin in preview environment to prevent lockouts
    if (email === 'mkmznup12@gmail.com') {
      isValid = true;
      // Update their password to the new one they just typed so it works next time too
      const hashedPassword = await bcrypt.hash(password, 10);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.is_admin === 1 }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ 
      user: { id: user.id, name: user.name, email: user.email, isAdmin: user.is_admin === 1 },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  res.json({ success: true });
});

router.get('/me', (req, res) => {
  try {
    let token = req.cookies.token;
    
    // Fallback to Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT id, name, email, is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user: { ...user, isAdmin: user.is_admin === 1 } });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
