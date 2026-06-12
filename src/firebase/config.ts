import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getMessaging, Messaging } from 'firebase/messaging';

/**
 * Firebase configuration object.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyB4Xb0uEh5obLhnqbJsVVuDEEoEtmw58Qk',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'black-details.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'black-details',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'black-details.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '413937096538',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:413937096538:web:683be70a198bd95973c563',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-YZ9T8HNE9F',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let messaging: Messaging | null = null;

/**
 * Initializes Firebase services for both Client and Server environments.
 * Ensures that service instances are always returned even if app is already initialized.
 */
export function initializeFirebase() {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    if (app) {
      auth = getAuth(app);
      firestore = getFirestore(app);
      
      // Messaging only works in the browser
      if (typeof window !== 'undefined') {
        messaging = getMessaging(app);
      }
    }
  } catch (error) {
    console.error('Firebase initialization failure:', error);
  }
  
  return { app, auth, firestore, messaging };
}

/**
 * Checks if the Firebase configuration is potentially valid.
 */
export const isFirebaseConfigValid = () => {
  return !!firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10;
}
