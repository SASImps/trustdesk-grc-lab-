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
// We prioritize localConfig for everything because it's automatically provisioned by the system
const firebaseConfig = {
  apiKey: localConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: localConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: localConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: localConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: localConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: localConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: localConfig.measurementId || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: (localConfig as any).firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)'
};

console.log("Firebase Config Initialization:", {
  projectId: firebaseConfig.projectId,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
  databaseId: firebaseConfig.firestoreDatabaseId,
  usingLocalConfig: !!localConfig.apiKey
});

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
    // We try to fetch from server to verify connection and keys
    await getDocFromServer(doc(db, 'system', 'connectivity_test'));
    connectionStatus = 'connected';
    connectionErrorMessage = null;
  } catch (error: any) {
    const msg = error?.message || String(error);
    
    if (msg.includes('Database') && msg.includes('not found')) {
      connectionStatus = 'error';
      connectionErrorMessage = `Database not found. Active ID: ${firebaseConfig.firestoreDatabaseId}. This usually indicates the database is still provisioning or the ID is incorrect.`;
      console.error("Firebase Connection Error Diagnostic:", msg);
    } else if (msg.includes('the client is offline') || error?.code === 'unavailable' || msg.includes('network')) {
      connectionStatus = 'error';
      connectionErrorMessage = "Network connection failed. This usually indicates blocked cross-site tracking in your browser or a firewall issue. Try opening the app in a new tab.";
      console.warn("Firebase Connection Warning:", connectionErrorMessage);
    } else {
      // Permission denied or other errors usually mean we reached the server
      connectionStatus = 'connected';
      connectionErrorMessage = null;
    }
  }
}
testConnection();
