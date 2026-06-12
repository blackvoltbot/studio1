'use client';

/**
 * Barrel file for Firebase functionality.
 * Note: Re-exporting from 'use client' files makes these exports client-only.
 * Server-side code should import initializeFirebase directly from @/firebase/config.
 */

export { initializeFirebase } from './config';
export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
