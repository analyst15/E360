import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Connect to Firestore using the provisioned custom databaseId if configured, or default
const rawConfig = firebaseConfig as any;
export const db = rawConfig.firestoreDatabaseId && rawConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, rawConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Authenticate anonymously so security rules and presence work seamlessly
let authInitPromise: Promise<void> | null = null;

export function ensureFirebaseAuth(): Promise<void> {
  if (!authInitPromise) {
    authInitPromise = new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          resolve();
        } else {
          signInAnonymously(auth)
            .then(() => resolve())
            .catch((err) => {
              console.warn('Anonymous sign-in note:', err?.message || err);
              resolve();
            });
        }
      });
    });
  }
  return authInitPromise;
}

// Auto-trigger auth check
ensureFirebaseAuth();

export default app;
