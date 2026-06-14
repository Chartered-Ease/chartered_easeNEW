import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const configuredAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const shouldUseConfiguredAuthDomain =
  typeof configuredAuthDomain === 'string' &&
  (configuredAuthDomain.endsWith('.firebaseapp.com') || configuredAuthDomain.endsWith('.web.app'));

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: shouldUseConfiguredAuthDomain ? configuredAuthDomain : projectId ? `${projectId}.firebaseapp.com` : configuredAuthDomain,
  projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export const firebaseApp = isFirebaseConfigured ? getApps()[0] || initializeApp(firebaseConfig) : null;
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
