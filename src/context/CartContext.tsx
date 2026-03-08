import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface CartContextType {
  cart: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number, productDetails?: any) => Promise<void>;
  updateQuantity: (cartId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
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

    const cartRef = collection(db, 'users', user.uid, 'cart');
    const unsubscribe = onSnapshot(cartRef, async (snapshot) => {
      try {
        const cartItems: CartItem[] = [];
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          // Fetch product details
          const productRef = doc(db, 'products', data.productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const productData = productSnap.data();
            cartItems.push({
              id: docSnapshot.id,
              productId: data.productId,
              name: productData.name,
              price: productData.price,
              quantity: data.quantity,
              imageUrl: productData.imageUrl
            });
          }
        }
        setCart(cartItems);
      } catch (error) {
        console.error('Error fetching cart:', error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Firestore Error: ', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync local cart to backend when user logs in
  useEffect(() => {
    const syncLocalCart = async () => {
      if (user) {
        const localCart = localStorage.getItem('guest_cart');
        if (localCart) {
          try {
            const parsedCart = JSON.parse(localCart) as CartItem[];
            if (parsedCart.length > 0) {
              const batch = writeBatch(db);
              let hasValidItems = false;
              for (const item of parsedCart) {
                if (item.productId) {
                  const cartItemRef = doc(collection(db, 'users', user.uid, 'cart'));
                  batch.set(cartItemRef, {
                    productId: item.productId,
                    quantity: item.quantity || 1,
                    addedAt: new Date().toISOString()
                  });
                  hasValidItems = true;
                }
              }
              if (hasValidItems) {
                await batch.commit();
                toast.success('Guest cart synced with your account');
              }
              localStorage.removeItem('guest_cart');
            }
          } catch (e) {
            console.error('Failed to sync local cart', e);
          }
        }
      }
    };

    syncLocalCart();
  }, [user]);

  const addToCart = async (productId: string, quantity = 1, productDetails?: any) => {
    if (!user) {
      const newCart = [...cart];
      const existingItemIndex = newCart.findIndex(item => item.productId === productId);
      
      if (existingItemIndex >= 0) {
        newCart[existingItemIndex].quantity += quantity;
      } else if (productDetails) {
        newCart.push({
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId: productId,
          name: productDetails.name,
          price: productDetails.price,
          quantity: quantity,
          imageUrl: productDetails.imageUrl || productDetails.images?.[0] || 'https://picsum.photos/seed/placeholder/400/400'
        });
      } else {
        toast.error('Could not add to cart. Please login.');
        return;
      }
      
      setCart(newCart);
      localStorage.setItem('guest_cart', JSON.stringify(newCart));
      toast.success('Added to cart');
      return;
    }

    try {
      // Check if item already exists in cart
      const existingItem = cart.find(item => item.productId === productId);
      if (existingItem) {
        const cartItemRef = doc(db, 'users', user.uid, 'cart', existingItem.id);
        await updateDoc(cartItemRef, {
          quantity: existingItem.quantity + quantity
        });
      } else {
        const cartItemRef = doc(collection(db, 'users', user.uid, 'cart'));
        await setDoc(cartItemRef, {
          productId,
          quantity,
          addedAt: new Date().toISOString()
        });
      }
      toast.success('Added to cart');
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
      const cartItemRef = doc(db, 'users', user.uid, 'cart', cartId);
      await updateDoc(cartItemRef, { quantity });
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
      const cartItemRef = doc(db, 'users', user.uid, 'cart', cartId);
      await deleteDoc(cartItemRef);
      toast.success('Removed from cart');
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
      const batch = writeBatch(db);
      cart.forEach(item => {
        const cartItemRef = doc(db, 'users', user.uid, 'cart', item.id);
        batch.delete(cartItemRef);
      });
      await batch.commit();
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Failed to clear cart', error);
      toast.error('Failed to clear cart');
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeFromCart, clearCart }}>
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
