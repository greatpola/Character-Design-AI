
import { User } from '../types';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';

const USERS_STORAGE_KEY = 'character_studio_users';
const CURRENT_USER_KEY = 'character_studio_current_session';

// Updated Admin ID
const ADMIN_ID = 'media@greatpola.com';
const ADMIN_PW = 'Silver50!';

// Internal type for storage including password
interface StoredUser extends User {
  password?: string; // Encrypted password
}

// Fallback logic for when Firebase is not configured or fails
const useLocalStorage = !process.env.FIREBASE_API_KEY;

// Simple client-side encryption mock
const encryptData = async (text: string): Promise<string> => {
  return btoa(text);
};

// We don't really need decrypt for passwords, we just compare hashes (encrypted values)
// but keeping decrypt for other data if needed.
const decryptData = async (text: string): Promise<string> => {
  try {
    return atob(text);
  } catch {
    return text;
  }
};

export const userManager = {
  // Mock Database methods (LocalStorage Fallback)
  getAllStoredUsers(): StoredUser[] {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  getAllUsers(): User[] {
    // Return users without sensitive data
    return this.getAllStoredUsers().map(({ password, ...user }) => user);
  },

  getStoredUser(email: string): StoredUser | undefined {
    const users = this.getAllStoredUsers();
    return users.find(u => u.email === email);
  },

  getUser(email: string): User | undefined {
    const stored = this.getStoredUser(email);
    if (!stored) return undefined;
    const { password, ...user } = stored;
    return user;
  },

  checkUserExists(email: string): boolean {
    // Admin always "exists"
    if (email.trim() === ADMIN_ID) return true;
    return !!this.getStoredUser(email.trim());
  },

  async saveStoredUser(user: StoredUser) {
    const users = this.getAllStoredUsers();
    const index = users.findIndex(u => u.email === user.email);
    if (index !== -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  },

  async registerUser(email: string, password: string, nickname: string): Promise<User> {
    const encryptedPassword = await encryptData(password);
    
    const newUser: StoredUser = {
      email,
      nickname,
      role: 'user',
      joinedAt: Date.now(),
      marketingAgreed: true,
      usageCount: 0,
      loginCount: 1, // Initial login
      password: encryptedPassword
    };
    
    await this.saveStoredUser(newUser);
    
    // Return sanitized user
    const { password: _, ...safeUser } = newUser;
    this.saveSession(safeUser);
    return safeUser;
  },

  removeUser(email: string) {
    const users = this.getAllStoredUsers().filter(u => u.email !== email);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  },

  async incrementUsage(email: string) {
    const user = this.getStoredUser(email);
    if (user) {
      user.usageCount = (user.usageCount || 0) + 1;
      await this.saveStoredUser(user);
      
      // Also update session if it matches
      const session = this.getSession();
      if (session && session.email === email) {
        session.usageCount = user.usageCount;
        this.saveSession(session);
      }
    }
  },

  // Auth methods
  async login(email: string, password: string): Promise<User> {
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
    let storedUser = this.getStoredUser(cleanEmail);
    
    if (!storedUser) {
       throw new Error('등록되지 않은 사용자입니다. 회원가입을 진행해주세요.');
    }

    // Verify Password
    const encryptedInput = await encryptData(password);
    if (storedUser.password && storedUser.password !== encryptedInput) {
       throw new Error('비밀번호가 일치하지 않습니다.');
    }

    // Legacy support: users created before password feature might not have a password
    // In a real app, we would force password reset. Here, we might just let them in or update it.
    // Let's assume strict password check for now.

    // Update stats
    storedUser.loginCount = (storedUser.loginCount || 0) + 1;
    await this.saveStoredUser(storedUser);

    const { password: _, ...safeUser } = storedUser;
    this.saveSession(safeUser);
    return safeUser;
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
