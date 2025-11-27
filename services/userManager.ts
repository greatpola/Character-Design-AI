
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

// Simple client-side encryption mock
const encryptData = async (text: string): Promise<string> => {
  return btoa(text);
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

  // Admin function to update user limits
  async updateUserLimits(email: string, group: string, maxGenerations: number, maxEdits: number) {
    const user = this.getStoredUser(email);
    if (user) {
      user.group = group;
      user.maxGenerations = maxGenerations;
      user.maxEdits = maxEdits;
      await this.saveStoredUser(user);
    }
  },

  async registerUser(email: string, password: string, nickname: string): Promise<User> {
    const encryptedPassword = await encryptData(password);
    
    const newUser: StoredUser = {
      email,
      nickname,
      role: 'user',
      joinedAt: Date.now(),
      marketingAgreed: true,
      loginCount: 1,
      password: encryptedPassword,
      
      // Default Limits for New Users
      group: 'basic',
      maxGenerations: 1,
      maxEdits: 1,
      generationCount: 0,
      editCount: 0
    };
    
    await this.saveStoredUser(newUser);
    
    const { password: _, ...safeUser } = newUser;
    this.saveSession(safeUser);
    return safeUser;
  },

  removeUser(email: string) {
    const users = this.getAllStoredUsers().filter(u => u.email !== email);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  },

  // Check if user has enough credits
  checkLimit(email: string, type: 'generation' | 'edit'): boolean {
    if (this.isAdmin(email)) return true; // Admins are unlimited

    const user = this.getStoredUser(email);
    if (!user) return false;

    if (type === 'generation') {
      return (user.generationCount || 0) < (user.maxGenerations || 0);
    } else {
      return (user.editCount || 0) < (user.maxEdits || 0);
    }
  },

  async incrementActivity(email: string, type: 'generation' | 'edit') {
    if (this.isAdmin(email)) return;

    const user = this.getStoredUser(email);
    if (user) {
      if (type === 'generation') {
        user.generationCount = (user.generationCount || 0) + 1;
      } else {
        user.editCount = (user.editCount || 0) + 1;
      }
      
      await this.saveStoredUser(user);
      
      const session = this.getSession();
      if (session && session.email === email) {
        session.generationCount = user.generationCount;
        session.editCount = user.editCount;
        this.saveSession(session);
      }
    }
  },

  // Fallback alias for backward compatibility or generic usage
  async incrementUsage(email: string) {
    return this.incrementActivity(email, 'generation');
  },

  async login(email: string, password: string): Promise<User> {
    const cleanEmail = email.trim();
    
    if (cleanEmail === ADMIN_ID) {
      if (password === ADMIN_PW) {
        const adminUser: User = { 
          email: cleanEmail, 
          nickname: '관리자',
          role: 'admin', 
          joinedAt: Date.now(), 
          loginCount: 0,
          // Admin has infinite limits technically, but we set high numbers for UI
          group: 'admin',
          maxGenerations: 9999,
          maxEdits: 9999,
          generationCount: 0,
          editCount: 0
        };
        this.saveSession(adminUser);
        return adminUser;
      } else {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }
    }

    let storedUser = this.getStoredUser(cleanEmail);
    
    if (!storedUser) {
       throw new Error('등록되지 않은 사용자입니다. 회원가입을 진행해주세요.');
    }

    const encryptedInput = await encryptData(password);
    if (storedUser.password && storedUser.password !== encryptedInput) {
       throw new Error('비밀번호가 일치하지 않습니다.');
    }

    // Migration: Add limit fields to existing users if missing
    let needsUpdate = false;
    if (storedUser.group === undefined) { storedUser.group = 'basic'; needsUpdate = true; }
    if (storedUser.maxGenerations === undefined) { storedUser.maxGenerations = 1; needsUpdate = true; }
    if (storedUser.maxEdits === undefined) { storedUser.maxEdits = 1; needsUpdate = true; }
    if (storedUser.generationCount === undefined) { 
        // Migrate old usageCount if it exists
        // @ts-ignore
        storedUser.generationCount = storedUser.usageCount || 0; 
        needsUpdate = true; 
    }
    if (storedUser.editCount === undefined) { storedUser.editCount = 0; needsUpdate = true; }

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
