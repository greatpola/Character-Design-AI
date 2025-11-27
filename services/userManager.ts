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

  addUser(email: string): User {
    const newUser: User = {
      email,
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
  login(email: string, password?: string): User | null {
    const cleanEmail = email.trim();
    
    // Admin Check
    if (cleanEmail === ADMIN_ID) {
      if (password === ADMIN_PW) {
        const adminUser: User = { 
          email: cleanEmail, 
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
      storedUser = this.addUser(cleanEmail);
    } else {
      // Existing User - Increment Login Count
      storedUser.loginCount = (storedUser.loginCount || 0) + 1;
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