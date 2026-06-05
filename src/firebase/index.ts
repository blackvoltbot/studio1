'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigValid } from './config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

/**
 * Initializes Firebase services if a valid config is provided.
 * Uses a try-catch block to prevent runtime crashes if the SDK validates
 * the configuration and finds it lacking (e.g. invalid API key format).
 */
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    // If we've already successfully initialized, return the cached instances
    if (app && auth && firestore) {
      return { app, auth, firestore };
    }

    if (!isFirebaseConfigValid()) {
      console.warn('Firebase: Credentials missing or invalid. Initialization aborted.');
      return { app: null, auth: null, firestore: null };
    }

    try {
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }

      if (app) {
        auth = getAuth(app);
        firestore = getFirestore(app);
      }
    } catch (error) {
      console.error('Firebase initialization failed during service retrieval:', error);
      // Ensure we return nulls so the app can handle the "offline" state gracefully
      return { app: null, auth: null, firestore: null };
    }
  }
  return { app, auth, firestore };
}

export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
