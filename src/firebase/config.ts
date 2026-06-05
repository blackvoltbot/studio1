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
 * Also checks for common placeholder values that might pass length checks.
 */
export const isFirebaseConfigValid = () => {
  const key = firebaseConfig.apiKey;
  return (
    !!key && 
    key !== 'undefined' && 
    key !== 'null' &&
    key.length > 20 && // Firebase API keys are typically ~39 chars
    !key.includes('YOUR_') &&
    !key.includes('API_KEY')
  );
};
