import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
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
  const { user } = useAuth();

  const fetchWishlist = React.useCallback(async () => {
    if (!user) {
      setWishlist([]);
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, 'wishlist'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const wishlistData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WishlistItem[];
      setWishlist(wishlistData);
    } catch (error) {
      console.error('Failed to fetch wishlist', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (productId: string) => {
    if (!user) {
      toast.error('Please login to add items to wishlist');
      return;
    }
    try {
      // Check if already in wishlist
      const q = query(
        collection(db, 'wishlist'),
        where('userId', '==', user.uid),
        where('productId', '==', productId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast('Item already in wishlist', { icon: 'ℹ️' });
        return;
      }

      // Fetch product details to store in wishlist
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (!productDoc.exists()) {
        toast.error('Product not found');
        return;
      }
      const productData = productDoc.data();

      await addDoc(collection(db, 'wishlist'), {
        userId: user.uid,
        productId,
        name: productData.name,
        price: productData.price,
        imageUrl: productData.imageUrl || (productData.images && productData.images[0]) || '',
        createdAt: new Date().toISOString()
      });

      await fetchWishlist();
      toast.success('Added to wishlist');
    } catch (error) {
      console.error('Failed to add to wishlist', error);
      toast.error('Failed to add to wishlist');
    }
  };

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      await deleteDoc(doc(db, 'wishlist', wishlistId));
      await fetchWishlist();
      toast.success('Removed from wishlist');
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
