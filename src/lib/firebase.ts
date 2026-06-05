'use client';

/**
 * DEPRECATED: Use hooks from '@/firebase' instead.
 * This file is kept as a transitionary shim to avoid broken imports.
 */
import { initializeFirebase } from '@/firebase';

const { auth: _auth, firestore: _db } = typeof window !== 'undefined' 
  ? initializeFirebase() 
  : { auth: null, firestore: null };

export const auth = _auth as any;
export const db = _db as any;
