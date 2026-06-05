'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase, FirebaseProvider } from './index';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [instances, setInstances] = useState<{
    app: FirebaseApp | null;
    firestore: Firestore | null;
    auth: Auth | null;
  }>({ app: null, firestore: null, auth: null });

  useEffect(() => {
    // Only initialize on the client after mounting to ensure hydration consistency
    const initialized = initializeFirebase();
    setInstances(initialized);
  }, []);

  return (
    <FirebaseProvider 
      app={instances.app} 
      firestore={instances.firestore} 
      auth={instances.auth}
    >
      {children}
    </FirebaseProvider>
  );
};
