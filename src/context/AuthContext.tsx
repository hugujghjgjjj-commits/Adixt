import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef).catch(err => handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`));
          
          if (userDoc && userDoc.exists()) {
            const data = userDoc.data() as User;
            // Force admin for the specific email
            if (firebaseUser.email === 'mkmznup12@gmail.com' && data.role !== 'admin') {
              data.role = 'admin';
              try {
                await setDoc(userDocRef, { ...data, role: 'admin' }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`));
              } catch (e) {
                console.error("Failed to update admin role", e);
              }
            }
            setUser({ ...data, isAdmin: data.role === 'admin' });
          } else {
            // Create user document if it doesn't exist
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              role: firebaseUser.email === 'mkmznup12@gmail.com' ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
            };
            // We don't save isAdmin to Firestore, it's derived from role
            await setDoc(userDocRef, newUser).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`));
            setUser({ ...newUser, isAdmin: newUser.role === 'admin' });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
