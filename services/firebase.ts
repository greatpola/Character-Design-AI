
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { CONFIG } from '../config';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

// Initialize Firebase only if config is present
if (CONFIG.FIREBASE.apiKey) {
  try {
    // Prevent multiple initializations (Singleton pattern)
    app = getApps().length > 0 ? getApp() : initializeApp(CONFIG.FIREBASE);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
} else {
  console.warn("Firebase configuration missing. Falling back to local storage mode.");
}

export { app, db };
