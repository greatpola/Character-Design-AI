
import { SeoConfig } from '../types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const SEO_STORAGE_KEY = 'character_studio_seo';
const FIRESTORE_COLLECTION = 'settings';
const FIRESTORE_DOC_ID = 'seo_config';

const DEFAULT_SEO: SeoConfig = {
  title: 'Character Studio AI',
  description: 'Generate and edit professional character design sheets using Gemini 3 Pro Image.',
  keywords: 'AI, Character Design, 3D Art, Toy Design, Gemini, Brand Sheet',
  author: 'Character Studio AI',
  supportLink: 'https://buy.stripe.com/28E5kDgVC9dl6AE8Wy'
};

// Initialize Firebase for Global Sync
// We check if environment variables are available to enable cloud sync.
let db: any = null;
try {
  // Only attempt init if API key is present, preventing crashes in environments without config
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env.FIREBASE_API_KEY) {
      const firebaseConfig = {
          // @ts-ignore
          apiKey: process.env.FIREBASE_API_KEY,
          // @ts-ignore
          authDomain: process.env.FIREBASE_AUTH_DOMAIN,
          // @ts-ignore
          projectId: process.env.FIREBASE_PROJECT_ID,
          // @ts-ignore
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          // @ts-ignore
          messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
          // @ts-ignore
          appId: process.env.FIREBASE_APP_ID
      };
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      db = getFirestore(app);
  }
} catch (e) {
  console.warn("SEO Storage: Global sync unavailable (Firebase not configured). Falling back to local storage.", e);
}

export const seoStorage = {
  getSeoConfig(): SeoConfig {
    try {
      const stored = localStorage.getItem(SEO_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SEO;
    } catch {
      return DEFAULT_SEO;
    }
  },

  // Fetch from Cloud and update Local Storage (Async)
  // This ensures all users get the Admin's settings
  async fetchAndSync(): Promise<void> {
    if (!db) return;

    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
      const snap = await getDoc(docRef);
      
      if (snap.exists()) {
        const remoteConfig = snap.data() as SeoConfig;
        // Update local cache with the truth from cloud
        localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(remoteConfig));
        // Apply changes immediately to the current document
        this.applyToDocument();
      }
    } catch (e) {
      console.error("SEO Storage: Failed to sync with cloud", e);
    }
  },

  async saveSeoConfig(config: SeoConfig) {
    // 1. Save to Local Storage (Optimistic Update)
    localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(config));
    this.applyToDocument();

    // 2. Save to Firestore (Global Update)
    if (db) {
      try {
        await setDoc(doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID), config);
      } catch (e) {
        console.error("SEO Storage: Failed to save to cloud", e);
        throw new Error("설정은 로컬에 저장되었으나, 클라우드 동기화에 실패했습니다.");
      }
    }
  },

  applyToDocument() {
    const config = this.getSeoConfig();
    
    // Update Title
    document.title = config.title;

    // Helper to set meta tag
    const setMetaTag = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to set Open Graph tag
    const setOgTag = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMetaTag('description', config.description);
    setMetaTag('keywords', config.keywords);
    setMetaTag('author', config.author);

    // Update Open Graph tags for social sharing
    setOgTag('og:title', config.title);
    setOgTag('og:description', config.description);
    setOgTag('og:type', 'website');
  }
};
