import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FlyItem {
  id: number;
  x: number;
  y: number;
  imageUrl: string;
  targetX: number;
  targetY: number;
}

export default function FlyToCart() {
  const [items, setItems] = useState<FlyItem[]>([]);

  useEffect(() => {
    const handleFly = (e: CustomEvent) => {
      const { x, y, imageUrl } = e.detail;
      const id = Date.now();
      
      // Get cart icon position
      const cartIcon = document.getElementById('cart-icon');
      let targetX = window.innerWidth - 80;
      let targetY = 20;

      if (cartIcon) {
        const rect = cartIcon.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
      }

      setItems((prev) => [...prev, { id, x, y, imageUrl, targetX, targetY }]);

      // Remove item after animation
      setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, 1000);
    };

    window.addEventListener('fly-to-cart', handleFly as EventListener);
    return () => window.removeEventListener('fly-to-cart', handleFly as EventListener);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <AnimatePresence>
        {items.map((item) => (
          <motion.img
            key={item.id}
            src={item.imageUrl}
            initial={{ 
              position: 'absolute', 
              top: item.y, 
              left: item.x, 
              width: 64, 
              height: 64, 
              opacity: 1, 
              scale: 1,
              borderRadius: '8px',
              zIndex: 100
            }}
            animate={{ 
              top: item.targetY, 
              left: item.targetX, 
              width: 20, 
              height: 20, 
              opacity: 0.5, 
              scale: 0.2 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="object-cover shadow-xl border-2 border-[#CCFF00]"
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
