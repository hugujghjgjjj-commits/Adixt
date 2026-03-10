import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

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
      const q = query(collection(db, 'users', user.uid, 'wishlist'));
      const querySnapshot = await getDocs(q).catch(err => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/wishlist`));
      
      const wishlistItems: WishlistItem[] = [];
      if (querySnapshot) {
        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();
          // Fetch product details
          const productRef = doc(db, 'products', data.productId);
          const productSnap = await getDoc(productRef).catch(err => handleFirestoreError(err, OperationType.GET, `products/${data.productId}`));
          if (productSnap && productSnap.exists()) {
            const productData = productSnap.data();
            wishlistItems.push({
              id: docSnapshot.id,
              productId: data.productId,
              name: productData.name,
              price: productData.price,
              imageUrl: productData.imageUrl
            });
          }
        }
      }
      setWishlist(wishlistItems);
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
        collection(db, 'users', user.uid, 'wishlist'),
        where('productId', '==', productId)
      );
      const querySnapshot = await getDocs(q).catch(err => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/wishlist`));
      
      if (querySnapshot && !querySnapshot.empty) {
        toast('Item already in wishlist', { icon: 'ℹ️' });
        return;
      }

      await addDoc(collection(db, 'users', user.uid, 'wishlist'), {
        productId,
        addedAt: new Date().toISOString()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/wishlist`));

      await fetchWishlist();
      toast.success('Added to wishlist');
    } catch (error) {
      console.error('Failed to add to wishlist', error);
      toast.error('Failed to add to wishlist');
    }
  };

  const removeFromWishlist = async (wishlistId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'wishlist', wishlistId)).catch(err => handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/wishlist/${wishlistId}`));
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
