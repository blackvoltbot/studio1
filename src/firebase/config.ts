import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getMessaging, Messaging } from 'firebase/messaging';

/**
 * Firebase configuration object.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyB4Xb0uEh5obLhnqbJsVVuDEEoEtmw58Qk",
  authDomain: "black-details.firebaseapp.com",
  projectId: "black-details",
  storageBucket: "black-details.firebasestorage.app",
  messagingSenderId: "413937096538",
  appId: "1:413937096538:web:683be70a198bd95973c563",
  measurementId: "G-YZ9T8HNE9F"
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
