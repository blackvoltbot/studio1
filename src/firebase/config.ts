'use client';

/**
 * Firebase configuration object.
 * Values are loaded from environment variables.
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

/**
 * Checks if the Firebase configuration is potentially valid.
 */
export const isFirebaseConfigValid = () => {
  return !!firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10;
};
