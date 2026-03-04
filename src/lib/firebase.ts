import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "dummy-app-id"
};

// Initialize Firebase only if we have a real API key, otherwise use a dummy app
// to prevent crashes, but warn the user.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const storage = getStorage(app);

export const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY;
