import { getAnalytics } from 'firebase/analytics';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase Web configuration is public by design. Vercel environment variables take priority;
// the fallback prevents a blank Vercel build from silently disabling Auth/Firestore.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD7fMeMUnG7KhpL-1tXd8bk9_5UkxEctyQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'kitabi-f9387.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'kitabi-f9387',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'kitabi-f9387.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '387455183869',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:387455183869:web:1898ab42319001bdfa4794',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-BY17YTKJBP',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId,
);

export const app = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const db = app
  ? (() => {
      try {
        return initializeFirestore(app, { experimentalForceLongPolling: true });
      } catch {
        return getFirestore(app);
      }
    })()
  : null;
export const auth = app ? getAuth(app) : null;
export const storage = app ? getStorage(app) : null;

// Analytics remains optional so it cannot block Auth/Firestore in local or restricted browsers.
export const analytics = app && firebaseConfig.measurementId && typeof window !== 'undefined'
  ? (() => {
      try {
        return getAnalytics(app);
      } catch {
        return null;
      }
    })()
  : null;
