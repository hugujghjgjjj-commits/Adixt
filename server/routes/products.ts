import express from 'express';
import { db } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAdmin, (req, res) => {
  try {
    const { name, description, price, original_price, discount_percentage, category, image_url, images } = req.body;
    
    if (!name || !price || !category || !image_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const imagesJson = JSON.stringify(images || [image_url]);
    
    db.prepare(`
      INSERT INTO products (id, name, description, price, original_price, discount_percentage, category, image_url, images, rating, reviews_count, colors_count, sizes_count, bought_count, is_wish_pick)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, description || '', Number(price), original_price ? Number(original_price) : null, 
      discount_percentage ? Number(discount_percentage) : 0, category, image_url, imagesJson,
      5.0, 0, 1, 1, 0, 0
    );

    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', (req, res) => {
  try {
    const { category, maxPrice, search } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(Number(maxPrice));
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/suggestions', (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json([]);
    }

    const suggestions = db.prepare('SELECT id, name FROM products WHERE name LIKE ? LIMIT 5')
      .all(`%${q}%`);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  try {
    const { name, description, price, original_price, discount_percentage, category, image_url, images } = req.body;
    const { id } = req.params;

    if (!name || !price || !category || !image_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const imagesJson = JSON.stringify(images || [image_url]);

    db.prepare(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, original_price = ?, discount_percentage = ?, category = ?, image_url = ?, images = ?
      WHERE id = ?
    `).run(
      name, description || '', Number(price), original_price ? Number(original_price) : null, 
      discount_percentage ? Number(discount_percentage) : 0, category, image_url, imagesJson, id
    );

    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const existingProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
