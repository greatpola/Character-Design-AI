
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

// Obfuscated API Key (ASCII Char Codes) to prevent plain-text scraping
// Key: AIzaSyB_zJSuz0Xb74T7CLtvBtxMe_GxKh16Hhc
const _k = [65, 73, 122, 97, 83, 121, 66, 95, 122, 74, 83, 117, 122, 48, 88, 98, 55, 52, 84, 55, 67, 76, 116, 118, 66, 116, 120, 77, 101, 95, 71, 120, 75, 104, 49, 54, 72, 104, 99];

const getApiKey = (): string => {
  // 1. Prioritize Environment Variable
  const envKey = getEnv('API_KEY');
  if (envKey) return envKey;

  // 2. Fallback to embedded obfuscated key
  try {
    return String.fromCharCode(..._k);
  } catch (e) {
    console.error("Failed to reconstruct API key");
    return '';
  }
};

export const CONFIG = {
  // API Keys
  API_KEY: getApiKey(),
  
  // Firebase Configuration
  FIREBASE: {
    apiKey: "AIzaSyDq5LiPZeeFfcewtZ67eePpOAC2YGnatYM",
    authDomain: "greatpola.com", // Custom Domain
    projectId: "ai-studio-e6d5a",
    storageBucket: "ai-studio-e6d5a.firebasestorage.app",
    messagingSenderId: "284999464226",
    appId: "1:284999464226:web:b2a2c701181ac017e5a17b",
    measurementId: "G-CM31K2VYWV"
  },
  
  // Admin Credentials
  ADMIN: {
    ID: 'media@greatpola.com',
    PW: 'Silver50!'
  }
};
