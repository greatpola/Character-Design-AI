
import { User } from '../types';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';

const USERS_STORAGE_KEY = 'character_studio_users';
const CURRENT_USER_KEY = 'character_studio_current_session';

// Updated Admin ID as requested
const ADMIN_ID = 'media@greatpola.com';
const ADMIN_PW = 'Silver50!';

// Fallback logic for when Firebase is not configured or fails
const useLocalStorage = !process.env.FIREBASE_API_KEY;

// Simple client-side encryption mock (AES-GCM is complex to implement fully securely in one file without libs)
// For this demo, we will simulate encryption for "storage at rest" in local storage/firebase text fields
// In a real production app, use the Web Crypto API properly.
const encryptData = async (text: string): Promise<string> => {
  // Simple Base64 encoding as a placeholder for "encryption" to demonstrate the architecture
  // Real implementation would use window.crypto.subtle
  return btoa(text);
};

const decryptData = async (text: string): Promise<string> => {
  try {
    return atob(text);
  } catch {
    return text;
  }
};

export const userManager = {
  // Mock Database methods (LocalStorage Fallback)
  getAllUsers(): User[] {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  getUser(email: string): User | undefined {
    const users = this.getAllUsers();
    return users.find(u => u.email === email);
  },

  saveUser(user: User) {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.email === user.email);
    if (index !== -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  },

  addUser(email: string, nickname: string): User {
    const newUser: User = {
      email,
      nickname,
      role: 'user',
      joinedAt: Date.now(),
      marketingAgreed: true,
      usageCount: 0,
      loginCount: 1 // Initial login
    };
    this.saveUser(newUser);
    return newUser;
  },

  removeUser(email: string) {
    const users = this.getAllUsers().filter(u => u.email !== email);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  },

  incrementUsage(email: string) {
    const user = this.getUser(email);
    if (user) {
      user.usageCount = (user.usageCount || 0) + 1;
      this.saveUser(user);
      
      // Also update session if it matches
      const session = this.getSession();
      if (session && session.email === email) {
        session.usageCount = user.usageCount;
        this.saveSession(session);
      }
    }
  },

  // Auth methods
  login(email: string, nickname?: string, password?: string): User | null {
    const cleanEmail = email.trim();
    
    // Admin Check
    if (cleanEmail === ADMIN_ID) {
      if (password === ADMIN_PW) {
        const adminUser: User = { 
          email: cleanEmail, 
          nickname: '관리자',
          role: 'admin', 
          joinedAt: Date.now(), 
          usageCount: 0,
          loginCount: 0 
        };
        this.saveSession(adminUser);
        return adminUser;
      } else {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }
    }

    // Normal User Check
    let storedUser = this.getUser(cleanEmail);
    
    if (!storedUser) {
      // New User
      if (!nickname) {
         // Should ideally be caught by UI, but as a fallback
         nickname = cleanEmail.split('@')[0];
      }
      storedUser = this.addUser(cleanEmail, nickname);
    } else {
      // Existing User - Increment Login Count
      storedUser.loginCount = (storedUser.loginCount || 0) + 1;
      
      // Update nickname if provided and different
      if (nickname && storedUser.nickname !== nickname) {
        storedUser.nickname = nickname;
      }
      
      this.saveUser(storedUser);
    }

    this.saveSession(storedUser);
    return storedUser;
  },

  logout() {
    sessionStorage.removeItem(CURRENT_USER_KEY);
  },

  saveSession(user: User) {
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  getSession(): User | null {
    try {
      const stored = sessionStorage.getItem(CURRENT_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  },

  isAdmin(email: string) {
    return email.trim() === ADMIN_ID;
  }
};
