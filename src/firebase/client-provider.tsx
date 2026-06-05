'use client';

import React, { useMemo } from 'react';
import { initializeFirebase, FirebaseProvider } from './index';

export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { app, firestore, auth } = useMemo(() => initializeFirebase(), []);

  // We always render children so the app doesn't go blank if Firebase is missing.
  // The FirebaseProvider will just pass null context values.
  return (
    <FirebaseProvider app={app} firestore={firestore} auth={auth}>
      {children}
    </FirebaseProvider>
  );
};
