import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

interface CartContextType {
  cart: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number, productDetails?: any) => Promise<void>;
  updateQuantity: (cartId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartId: string) => Promise<void>;
  fetchCart: () => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();

  const fetchCart = React.useCallback(async () => {
    if (!user) {
      // Load from local storage
      const localCart = localStorage.getItem('guest_cart');
      if (localCart) {
        try {
          setCart(JSON.parse(localCart));
        } catch (e) {
          setCart([]);
        }
      } else {
        setCart([]);
      }
      setLoading(false);
      return;
    }
    
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/cart', { headers });
      if (res.ok) {
        const data = await res.json();
        setCart(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch cart', error);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  // Sync local cart to backend when user logs in
  useEffect(() => {
    const syncLocalCart = async () => {
      if (user && token) {
        const localCart = localStorage.getItem('guest_cart');
        if (localCart) {
          try {
            const parsedCart = JSON.parse(localCart) as CartItem[];
            if (parsedCart.length > 0) {
              // Send all items to backend
              for (const item of parsedCart) {
                await fetch('/api/cart', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ productId: item.product_id, quantity: item.quantity }),
                });
              }
              localStorage.removeItem('guest_cart');
              toast.success('Guest cart synced with your account');
            }
          } catch (e) {
            console.error('Failed to sync local cart', e);
          }
        }
        fetchCart();
      } else if (!user) {
        fetchCart();
      }
    };

    syncLocalCart();
  }, [user, token, fetchCart]);

  const addToCart = async (productId: string, quantity = 1, productDetails?: any) => {
    if (!user) {
      // Add to local storage
      const newCart = [...cart];
      const existingItemIndex = newCart.findIndex(item => item.product_id === productId);
      
      if (existingItemIndex >= 0) {
        newCart[existingItemIndex].quantity += quantity;
      } else if (productDetails) {
        newCart.push({
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          product_id: productId,
          name: productDetails.name,
          price: productDetails.price,
          quantity: quantity,
          image_url: productDetails.image_url || productDetails.images?.[0] || 'https://picsum.photos/seed/placeholder/400/400'
        });
      } else {
        // If we don't have product details, we can't add to local cart properly
        // This shouldn't happen if we pass details from ProductDetails or Home
        toast.error('Could not add to cart. Please login.');
        return;
      }
      
      setCart(newCart);
      localStorage.setItem('guest_cart', JSON.stringify(newCart));
      toast.success('Added to cart');
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId, quantity }),
      });
      if (res.ok) {
        await fetchCart();
        toast.success('Added to cart');
      }
    } catch (error) {
      console.error('Failed to add to cart', error);
      toast.error('Failed to add to cart');
    }
  };

  const updateQuantity = async (cartId: string, quantity: number) => {
    if (!user) {
      const newCart = cart.map(item => {
        if (item.id === cartId) {
          return { ...item, quantity };
        }
        return item;
      }).filter(item => item.quantity > 0);
      
      setCart(newCart);
      localStorage.setItem('guest_cart', JSON.stringify(newCart));
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/cart/${cartId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error('Failed to update quantity', error);
      toast.error('Failed to update quantity');
    }
  };

  const removeFromCart = async (cartId: string) => {
    if (!user) {
      const newCart = cart.filter(item => item.id !== cartId);
      setCart(newCart);
      localStorage.setItem('guest_cart', JSON.stringify(newCart));
      toast.success('Removed from cart');
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/cart/${cartId}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        await fetchCart();
        toast.success('Removed from cart');
      }
    } catch (error) {
      console.error('Failed to remove from cart', error);
      toast.error('Failed to remove from cart');
    }
  };

  const clearCart = async () => {
    if (!user) {
      setCart([]);
      localStorage.removeItem('guest_cart');
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setCart([]);
        toast.success('Cart cleared');
      }
    } catch (error) {
      console.error('Failed to clear cart', error);
      toast.error('Failed to clear cart');
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeFromCart, fetchCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
