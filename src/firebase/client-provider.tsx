
'use client';

import React, { useMemo } from 'react';
import { initializeFirebase, FirebaseProvider } from './index';

export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { app, firestore, auth } = useMemo(() => initializeFirebase(), []);

  if (!app || !firestore || !auth) return null;

  return (
    <FirebaseProvider app={app} firestore={firestore} auth={auth}>
      {children}
    </FirebaseProvider>
  );
};
