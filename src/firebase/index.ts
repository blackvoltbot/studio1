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
 */
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (!isFirebaseConfigValid()) {
      console.warn('Firebase: Credentials missing or invalid. Initialization aborted.');
      return { app: null, auth: null, firestore: null };
    }

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    firestore = getFirestore(app);
  }
  return { app, auth, firestore };
}

export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
