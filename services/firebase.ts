
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { CONFIG } from '../config';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let analytics: Analytics | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;

// Initialize Firebase only if config is present
if (CONFIG.FIREBASE.apiKey) {
  try {
    // Prevent multiple initializations (Singleton pattern)
    app = getApps().length > 0 ? getApp() : initializeApp(CONFIG.FIREBASE);
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    
    // Analytics is only supported in browser environments
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
    
    console.log("Firebase initialized successfully");
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
} else {
  console.warn("Firebase configuration missing. Falling back to local storage mode.");
}

export { app, db, analytics, auth, googleProvider };
