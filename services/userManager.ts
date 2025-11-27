import { User } from '../types';

const USERS_STORAGE_KEY = 'character_studio_users';
const CURRENT_USER_KEY = 'character_studio_current_session';

// Updated Admin ID as requested
const ADMIN_ID = 'media@greatpola.com';
const ADMIN_PW = 'Silver50!';

export const userManager = {
  // Mock Database methods
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

  addUser(email: string) {
    const users = this.getAllUsers();
    // Prevent duplicates
    if (!users.find(u => u.email === email)) {
      const newUser: User = {
        email,
        role: 'user',
        joinedAt: Date.now(),
        marketingAgreed: true,
        usageCount: 0
      };
      users.push(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  },

  removeUser(email: string) {
    const users = this.getAllUsers().filter(u => u.email !== email);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  },

  incrementUsage(email: string) {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.email === email);
    if (userIndex !== -1) {
      const user = users[userIndex];
      user.usageCount = (user.usageCount || 0) + 1;
      users[userIndex] = user;
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  },

  // Auth methods
  login(email: string, password?: string): User | null {
    const cleanEmail = email.trim();
    
    // Admin Check
    if (cleanEmail === ADMIN_ID) {
      if (password === ADMIN_PW) {
        // Admins don't need usage tracking in the user list usually, but we can return a valid User object
        const adminUser: User = { email: cleanEmail, role: 'admin', joinedAt: Date.now(), usageCount: 0 };
        this.saveSession(adminUser);
        return adminUser;
      } else {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }
    }

    // Normal User Check
    let storedUser = this.getUser(cleanEmail);
    
    // If new user, create them
    if (!storedUser) {
      this.addUser(cleanEmail);
      storedUser = this.getUser(cleanEmail);
    }
    
    // Fallback if something went wrong (should not happen)
    if (!storedUser) {
      storedUser = { 
        email: cleanEmail, 
        role: 'user', 
        joinedAt: Date.now(), 
        marketingAgreed: true, 
        usageCount: 0 
      };
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