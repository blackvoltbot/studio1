'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

/**
 * Initializes Firebase services with a fallback check.
 */
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (app && auth && firestore) {
      return { app, auth, firestore };
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
      console.warn('Firebase initialization warning:', error);
    }
  }
  return { app, auth, firestore };
}

export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
