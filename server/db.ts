import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'database.sqlite');

export const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      discount_percentage INTEGER,
      category TEXT NOT NULL,
      image_url TEXT,
      images TEXT DEFAULT '[]',
      rating REAL DEFAULT 0,
      reviews_count INTEGER DEFAULT 0,
      colors_count INTEGER DEFAULT 1,
      sizes_count INTEGER DEFAULT 1,
      bought_count INTEGER DEFAULT 0,
      is_wish_pick BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  try {
    db.exec('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0');
  } catch (e) {
    // Column might already exist
  }

  try {
    db.exec("ALTER TABLE products ADD COLUMN images TEXT DEFAULT '[]'");
  } catch (e) {
    // Column might already exist
  }

  // Seed products if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  console.log(`[DB] Current product count: ${count.count}`);
  if (count.count === 0) {
    console.log('[DB] Seeding products...');
    const insertProduct = db.prepare(`
      INSERT INTO products (id, name, description, price, original_price, discount_percentage, category, image_url, rating, reviews_count, colors_count, sizes_count, bought_count, is_wish_pick)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const products = [
      { id: 'p1', name: 'Space-Saving Shoe Rack Organizer', description: 'Keep your shoes organized with this space-saving rack. Durable and lightweight.', price: 111.48, original_price: 557.41, discount_percentage: 80, category: 'home', image_url: 'https://picsum.photos/seed/shoe/400/400', rating: 4.5, reviews_count: 120, colors_count: 9, sizes_count: 1, bought_count: 850, is_wish_pick: 0 },
      { id: 'p2', name: 'Exquisite Zircon Necklace', description: 'Beautiful necklace for special occasions. High-quality zircon stones.', price: 399.59, original_price: 696.70, discount_percentage: 42, category: 'jewelry', image_url: 'https://picsum.photos/seed/necklace/400/400', rating: 4.8, reviews_count: 85, colors_count: 4, sizes_count: 1, bought_count: 120, is_wish_pick: 0 },
      { id: 'p3', name: 'No-Drill Bathroom Shelf', description: 'Easy to install bathroom shelf without drilling. Perfect for rentals.', price: 36.07, original_price: 90.17, discount_percentage: 60, category: 'home', image_url: 'https://picsum.photos/seed/shelf/400/400', rating: 4.2, reviews_count: 200, colors_count: 4, sizes_count: 1, bought_count: 450, is_wish_pick: 0 },
      { id: 'p4', name: 'Air Cushion Basketball Shoes', description: 'Comfortable and stylish basketball shoes with air cushion technology.', price: 1048.05, original_price: 1701.39, discount_percentage: 38, category: 'shoes', image_url: 'https://picsum.photos/seed/shoes1/400/400', rating: 4.6, reviews_count: 45, colors_count: 9, sizes_count: 9, bought_count: 920, is_wish_pick: 0 },
      { id: 'p5', name: 'Durable Nylon Backpack', description: 'High quality backpack for daily use. Water-resistant and spacious.', price: 639.10, original_price: 1084.00, discount_percentage: 41, category: 'bags', image_url: 'https://picsum.photos/seed/bag1/400/400', rating: 4.3, reviews_count: 150, colors_count: 9, sizes_count: 3, bought_count: 340, is_wish_pick: 1 },
      { id: 'p6', name: 'Men\'s High Neck Sweater', description: 'Warm and cozy sweater for winter. Premium wool blend.', price: 562.99, original_price: 962.70, discount_percentage: 41, category: 'clothing', image_url: 'https://picsum.photos/seed/sweater/400/400', rating: 4.7, reviews_count: 90, colors_count: 5, sizes_count: 5, bought_count: 150, is_wish_pick: 1 },
      { id: 'p7', name: 'Men\'s Casual Boots', description: 'Stylish boots for casual wear. Genuine leather finish.', price: 761.90, original_price: 1249.00, discount_percentage: 39, category: 'shoes', image_url: 'https://picsum.photos/seed/boots/400/400', rating: 4.4, reviews_count: 110, colors_count: 5, sizes_count: 8, bought_count: 670, is_wish_pick: 0 },
      { id: 'p8', name: 'Large Capacity Storage Box', description: 'Organize your home with these large storage boxes. Stackable design.', price: 371.00, original_price: 500.00, discount_percentage: 25, category: 'home', image_url: 'https://picsum.photos/seed/box/400/400', rating: 4.1, reviews_count: 474, colors_count: 5, sizes_count: 5, bought_count: 890, is_wish_pick: 0 },
      { id: 'p9', name: 'Eco-Friendly Reusable Bags', description: 'Help the environment with these reusable bags. Strong and foldable.', price: 167.00, original_price: 250.00, discount_percentage: 33, category: 'home', image_url: 'https://picsum.photos/seed/reusable/400/400', rating: 4.9, reviews_count: 8, colors_count: 4, sizes_count: 9, bought_count: 1200, is_wish_pick: 0 },
      { id: 'p10', name: 'Digital Kitchen Scale', description: 'Accurate digital scale for your kitchen. Sleek stainless steel design.', price: 333.00, original_price: 500.00, discount_percentage: 33, category: 'home', image_url: 'https://picsum.photos/seed/scale/400/400', rating: 4.5, reviews_count: 100, colors_count: 6, sizes_count: 1, bought_count: 450, is_wish_pick: 0 },
      { id: 'p11', name: 'USB Rechargeable Lighter', description: 'Windproof and flameless lighter. Perfect for outdoors.', price: 2637.96, original_price: 3939.25, discount_percentage: 33, category: 'accessories', image_url: 'https://picsum.photos/seed/lighter/400/400', rating: 4.2, reviews_count: 50, colors_count: 3, sizes_count: 8, bought_count: 230, is_wish_pick: 0 },
      { id: 'p12', name: 'Men\'s British Style Trousers', description: 'Elegant trousers for a sharp look. Slim fit design.', price: 916.97, original_price: 1593.00, discount_percentage: 42, category: 'clothing', image_url: 'https://picsum.photos/seed/trousers2/400/400', rating: 4.6, reviews_count: 75, colors_count: 2, sizes_count: 9, bought_count: 180, is_wish_pick: 0 },
      { id: 'p13', name: 'Wireless Noise Cancelling Headphones', description: 'Immersive sound experience with active noise cancellation.', price: 2499.00, original_price: 4999.00, discount_percentage: 50, category: 'accessories', image_url: 'https://picsum.photos/seed/headphones/400/400', rating: 4.8, reviews_count: 320, colors_count: 3, sizes_count: 1, bought_count: 1500, is_wish_pick: 1 },
      { id: 'p14', name: 'Smart Fitness Tracker', description: 'Track your steps, heart rate, and sleep with this sleek tracker.', price: 1299.00, original_price: 2499.00, discount_percentage: 48, category: 'accessories', image_url: 'https://picsum.photos/seed/tracker/400/400', rating: 4.4, reviews_count: 150, colors_count: 5, sizes_count: 1, bought_count: 2000, is_wish_pick: 0 },
      { id: 'p15', name: 'Vintage Oversized Hoodie', description: 'Comfortable and stylish oversized hoodie with a vintage wash.', price: 899.00, original_price: 1499.00, discount_percentage: 40, category: 'clothing', image_url: 'https://picsum.photos/seed/hoodie/400/400', rating: 4.7, reviews_count: 210, colors_count: 6, sizes_count: 5, bought_count: 1200, is_wish_pick: 1 },
    ];

    const insertMany = db.transaction((prods) => {
      for (const p of prods) {
        insertProduct.run(p.id, p.name, p.description, p.price, p.original_price, p.discount_percentage, p.category, p.image_url, p.rating, p.reviews_count, p.colors_count, p.sizes_count, p.bought_count, p.is_wish_pick);
      }
    });

    insertMany(products);
    console.log('[DB] Seeding complete.');
  }
}
