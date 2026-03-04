import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WishlistItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  image_url: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  loading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (wishlistId: string) => Promise<void>;
  fetchWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();

  const fetchWishlist = async () => {
    if (!user) {
      setWishlist([]);
      setLoading(false);
      return;
    }
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/wishlist', { headers });
      if (res.ok) {
        const data = await res.json();
        setWishlist(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user, token]);

  const addToWishlist = async (productId: string) => {
    if (!user) {
      toast.error('Please login to add items to wishlist');
      return;
    }
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        await fetchWishlist();
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Failed to add to wishlist', error);
      toast.error('Failed to add to wishlist');
    }
  };

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/wishlist/${wishlistId}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        await fetchWishlist();
        toast.success('Removed from wishlist');
      }
    } catch (error) {
      console.error('Failed to remove from wishlist', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, loading, addToWishlist, removeFromWishlist, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
