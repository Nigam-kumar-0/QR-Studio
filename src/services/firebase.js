import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Key for custom runtime configuration in Settings
const STORAGE_CONFIG_KEY = 'qr_studio_firebase_config';

export function getStoredFirebaseConfig() {
  try {
    const custom = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (custom) {
      return JSON.parse(custom);
    }
  } catch (e) {
    console.error('Failed to parse custom Firebase config', e);
  }

  // Fallback to import.meta.env
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
}

export function saveStoredFirebaseConfig(config) {
  try {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Firebase config', e);
  }
}

export function isFirebaseConfigured() {
  const cfg = getStoredFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.projectId && cfg.apiKey !== 'your-api-key');
}

let app = null;
let auth = null;
let db = null;

export function initFirebase() {
  const config = getStoredFirebaseConfig();
  if (!config.apiKey || !config.projectId) {
    return { app: null, auth: null, db: null, isConfigured: false };
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }

    auth = getAuth(app);
    db = getFirestore(app);

    return { app, auth, db, isConfigured: true };
  } catch (err) {
    console.warn('Firebase initialization error, running in local fallback mode:', err);
    return { app: null, auth: null, db: null, isConfigured: false };
  }
}

export const firebaseServices = initFirebase();
export { auth, db };
