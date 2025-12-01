
// Helper to safely access environment variables in browser/module environments
const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // ignore error
  }
  return '';
};

export const CONFIG = {
  // API Keys
  API_KEY: getEnv('API_KEY'),
  
  // Firebase Configuration
  FIREBASE: {
    apiKey: getEnv('FIREBASE_API_KEY'),
    authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
    projectId: getEnv('FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('FIREBASE_APP_ID')
  },
  
  // Admin Credentials
  ADMIN: {
    ID: 'media@greatpola.com',
    PW: 'Silver50!'
  }
};
