/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, doc, getDocFromServer } from "firebase/firestore";
// Try to load from placeholder or provided firebase config
import firebaseConfigJson from "../../firebase-applet-config.json";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// 1. Prioritize real env vars (Vercel) over standard firebase-applet-config JSON
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || "",
};

// Config is defined as valid only if apiKey and projectId are specified (non-empty)
export const isFirebaseConfigured = !!(config.apiKey && config.projectId && config.apiKey !== "");

let appInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;

if (isFirebaseConfigured) {
  try {
    appInstance = initializeApp(config);
    authInstance = getAuth(appInstance);
    // CRITICAL: The app will break without initializing database like this
    dbInstance = getFirestore(appInstance, firebaseConfigJson.firestoreDatabaseId || "(default)");
    
    // Enable Offline Persistence
    enableIndexedDbPersistence(dbInstance).catch((err) => {
      console.warn("Firestore offline persistence enabling failed (Standard behavior in dev environments):", err.code);
    });
  } catch (error) {
    console.error("Failed to initialize Firebase SDK:", error);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;

/**
 * Handle Firestore API Call Failures
 * Formats errors to compliant standard diagnostic JSON objects
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || "mock-user-id",
      email: auth?.currentUser?.email || "mock@example.com",
      emailVerified: auth?.currentUser?.emailVerified || false,
      isAnonymous: auth?.currentUser?.isAnonymous || false,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  
  console.error("Firestore Error payload: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Connection integrity check
 */
export async function testConnection() {
  if (!isFirebaseConfigured || !db) return;
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.error("Please check your Firebase configuration or network status.");
    }
  }
}

// Fire test connection if initialized
if (isFirebaseConfigured) {
  testConnection();
}
