'use client';

/**
 * Firebase configuration object.
 * Values are loaded from environment variables.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

/**
 * Checks if the Firebase configuration is potentially valid.
 */
export const isFirebaseConfigValid = () => {
  return (
    !!firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== 'undefined' && 
    firebaseConfig.apiKey.length > 10
  );
};
