/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, getDocFromServer, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import localConfig from '../../firebase-applet-config.json';

// Security Note: In Firebase client-side SDKs, these identifiers are intended to be public.
// They are used by the library to identify your project (like an address), but do NOT grant
// access to your data. Security is enforced via Firestore Security Rules (see `/firestore.rules`)
// and Authentication. Even if these keys are visible in the source code, no one can access
// your documents unless they satisfy the conditions in your security rules.

// Initialize Firebase with config from local file, with env variable overrides
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || localConfig.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (localConfig as any).firestoreDatabaseId || '(default)'
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

let connectionStatus: 'idle' | 'checking' | 'connected' | 'error' = 'idle';
let connectionErrorMessage: string | null = null;
export const getConnectionStatus = () => ({ status: connectionStatus, error: connectionErrorMessage });

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection
async function testConnection() {
  if (!isFirebaseConfigured) return;
  
  connectionStatus = 'checking';
  try {
    // We try to fetch a non-existent doc to test connectivity
    // If it fails with "offline", it's a configuration/network issue
    // If it fails with "permission denied", it means keys worked but rules blocked it (which is fine for this test)
    await getDocFromServer(doc(db, 'system', 'connectivity_test'));
    connectionStatus = 'connected';
  } catch (error: any) {
    if (error?.message?.includes('the client is offline') || error?.code === 'unavailable') {
      connectionStatus = 'error';
      connectionErrorMessage = "Network connection failed. This usually indicates blocked cross-site tracking in your browser or incorrect Firebase keys. Try opening in a new tab.";
      console.warn("Firebase Connection Warning:", connectionErrorMessage);
    } else {
      // Any other error (like permission denied) means we AT LEAST reached the server, so keys are likely valid syntax
      connectionStatus = 'connected';
    }
  }
}
testConnection();
