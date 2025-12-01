
import { User } from '../types';
import { db, auth, googleProvider } from './firebase';
import { collection, doc, setDoc, getDoc, updateDoc, getDocs, increment } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { CONFIG } from '../config';

const CURRENT_USER_KEY = 'character_studio_current_session';

// Internal type for storage
interface StoredUser extends User {
}

export const userManager = {
  // --- Helper ---
  isAdmin(email: string): boolean {
    return email === CONFIG.ADMIN.ID;
  },

  getSession(): User | null {
    if (typeof window === 'undefined') return null;
    const stored = sessionStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  saveSession(user: User) {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  logout() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(CURRENT_USER_KEY);
    if (auth) auth.signOut();
  },

  // --- Firestore Interactions ---

  async getAllUsers(): Promise<User[]> {
    if (!db) return [];
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as StoredUser;
        users.push(data);
      });
      return users;
    } catch (e) {
      console.error("Error getting users:", e);
      return [];
    }
  },

  async getUser(email: string): Promise<User | undefined> {
    if (!db) return undefined;
    try {
      const docRef = doc(db, 'users', email);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as User;
      }
      return undefined;
    } catch (e) {
      console.error("Error getting user:", e);
      return undefined;
    }
  },

  async checkUserExists(email: string): Promise<boolean> {
    const cleanEmail = email.trim();
    if (cleanEmail === CONFIG.ADMIN.ID) return true;
    if (!db) return false;
    
    try {
      const docRef = doc(db, 'users', cleanEmail);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (e) {
      console.error("Error checking user existence:", e);
      return false;
    }
  },

  // Admin function to update user limits
  async updateUserLimits(email: string, group: string, maxGenerations: number, maxEdits: number) {
    if (!db) return;
    try {
      const docRef = doc(db, 'users', email);
      await updateDoc(docRef, {
        group,
        maxGenerations,
        maxEdits
      });
    } catch (e) {
      console.error("Error updating user limits:", e);
      throw e;
    }
  },

  async updateNickname(email: string, newNickname: string) {
    if (!db) return;
    try {
      const docRef = doc(db, 'users', email);
      await updateDoc(docRef, {
        nickname: newNickname
      });
    } catch (e) {
      console.error("Error updating nickname:", e);
      throw e;
    }
  },

  // --- Credit System ---

  async checkCredit(email: string): Promise<boolean> {
    if (this.isAdmin(email)) return true;
    const user = await this.getUser(email);
    return !!user && (user.credits > 0);
  },

  async deductCredit(email: string, amount: number = 1): Promise<void> {
    if (this.isAdmin(email)) return;
    if (!db) return;

    try {
      const docRef = doc(db, 'users', email);
      await updateDoc(docRef, {
        credits: increment(-amount)
      });
      
      // Update session if active
      const session = this.getSession();
      if (session && session.email === email) {
        session.credits = (session.credits || 0) - amount;
        this.saveSession(session);
      }
    } catch (e) {
      console.error("Error deducting credit:", e);
      throw e;
    }
  },

  async addCredits(email: string, amount: number): Promise<void> {
    if (!db) return;
    try {
      const docRef = doc(db, 'users', email);
      await updateDoc(docRef, {
        credits: increment(amount),
        hasPurchasedCredits: true // Mark as paid user
      });
    } catch (e) {
      console.error("Error adding credits:", e);
      throw e;
    }
  },

  // --- Auth ---

  async registerUser(email: string, password: string): Promise<User> {
    if (!db || !auth) throw new Error("Firebase services not initialized");

    try {
      // 1. Create Auth User
      await createUserWithEmailAndPassword(auth, email, password);

      // Auto-generate nickname
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const autoNickname = `User_${randomSuffix}`;

      // 2. Create User Profile in Firestore
      const newUser: StoredUser = {
        email,
        nickname: autoNickname,
        role: 'user',
        joinedAt: Date.now(),
        marketingAgreed: true,
        loginCount: 1,
        
        // Credits: 1 Gen + 1 Edit = 2 Credits
        credits: 2,
        hasPurchasedCredits: false,

        // Defaults (Legacy fields kept for compatibility)
        group: 'basic',
        maxGenerations: 1,
        maxEdits: 1,
        generationCount: 0,
        editCount: 0
      };
      
      await setDoc(doc(db, 'users', email), newUser);
      
      this.saveSession(newUser);
      return newUser;
    } catch (e: any) {
      console.error("Error registering user:", e);
      if (e.code === 'auth/email-already-in-use') {
        throw new Error("이미 사용 중인 이메일 주소입니다.");
      } else if (e.code === 'auth/weak-password') {
        throw new Error("비밀번호는 6자리 이상이어야 합니다.");
      }
      throw new Error("회원가입 중 오류가 발생했습니다: " + e.message);
    }
  },

  async removeUser(email: string) {
    if (!db) return;
    console.warn("User removal from Auth is restricted on client-side.");
  },

  async incrementActivity(email: string, type: 'generation' | 'edit') {
    if (this.isAdmin(email)) return;
    if (!db) return;

    try {
      const docRef = doc(db, 'users', email);
      const field = type === 'generation' ? 'generationCount' : 'editCount';
      
      // Also deduct credit is handled separately in logic, but here we update counts
      await updateDoc(docRef, {
        [field]: increment(1)
      });
      
      // Update session if it matches
      const session = this.getSession();
      if (session && session.email === email) {
        if (type === 'generation') session.generationCount = (session.generationCount || 0) + 1;
        else session.editCount = (session.editCount || 0) + 1;
        this.saveSession(session);
      }
    } catch (e) {
      console.error("Error incrementing activity:", e);
    }
  },

  async login(email: string, password: string): Promise<User> {
    const cleanEmail = email.trim();
    
    // 1. Admin Login
    if (cleanEmail === CONFIG.ADMIN.ID) {
      if (password === CONFIG.ADMIN.PW) {
        const adminUser: User = { 
          email: cleanEmail, 
          nickname: '관리자',
          role: 'admin', 
          joinedAt: Date.now(), 
          loginCount: 0,
          group: 'admin',
          credits: 99999,
          hasPurchasedCredits: true,
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

    // 2. Regular User Login
    if (!db || !auth) throw new Error("Service unavailable");

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);

      const docRef = doc(db, 'users', cleanEmail);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('사용자 프로필을 찾을 수 없습니다.');
      }

      const storedUser = docSnap.data() as StoredUser;

      // Migration/Default Check
      const updates: any = {};
      if (storedUser.credits === undefined) updates.credits = 0; 
      if (storedUser.group === undefined) updates.group = 'basic';
      if (storedUser.hasPurchasedCredits === undefined) updates.hasPurchasedCredits = false;
      if (!storedUser.nickname) updates.nickname = `User_${Math.floor(1000 + Math.random() * 9000)}`;
      
      updates.loginCount = increment(1);

      await updateDoc(docRef, updates);

      const updatedUser = { 
        ...storedUser, 
        ...updates, 
        credits: typeof updates.credits === 'number' ? updates.credits : (storedUser.credits || 0),
        hasPurchasedCredits: typeof updates.hasPurchasedCredits === 'boolean' ? updates.hasPurchasedCredits : (storedUser.hasPurchasedCredits || false),
        loginCount: (storedUser.loginCount || 0) + 1 
      };
      
      this.saveSession(updatedUser as User);
      return updatedUser as User;

    } catch (e: any) {
      console.error("Login error:", e);
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
      }
      throw new Error('로그인 중 오류가 발생했습니다.');
    }
  },

  async loginWithGoogle(): Promise<User> {
    if (!auth || !db || !googleProvider) throw new Error("Firebase services not initialized");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const email = firebaseUser.email;
      
      if (!email) throw new Error("이메일 정보를 가져올 수 없습니다.");

      // Check Admin Logic for Google Login
      if (email === CONFIG.ADMIN.ID) {
          const adminUser: User = { 
            email, 
            nickname: '관리자',
            role: 'admin', 
            joinedAt: Date.now(), 
            loginCount: 0,
            group: 'admin',
            credits: 99999,
            hasPurchasedCredits: true,
            maxGenerations: 9999,
            maxEdits: 9999,
            generationCount: 0,
            editCount: 0
          };
          this.saveSession(adminUser);
          return adminUser;
      }

      // Check if user exists in Firestore
      const docRef = doc(db, 'users', email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Login Existing
        const storedUser = docSnap.data() as StoredUser;
        const updates: any = { loginCount: increment(1) };
        if (storedUser.credits === undefined) updates.credits = 0;
        if (storedUser.hasPurchasedCredits === undefined) updates.hasPurchasedCredits = false;

        await updateDoc(docRef, updates);
        
        const updatedUser = { 
            ...storedUser, 
            credits: typeof updates.credits === 'number' ? updates.credits : (storedUser.credits || 0),
            hasPurchasedCredits: typeof updates.hasPurchasedCredits === 'boolean' ? updates.hasPurchasedCredits : (storedUser.hasPurchasedCredits || false),
            loginCount: (storedUser.loginCount || 0) + 1 
        };
        this.saveSession(updatedUser as User);
        return updatedUser as User;
      } else {
        // Register New
        const newUser: StoredUser = {
            email,
            nickname: firebaseUser.displayName || `User_${Math.floor(1000 + Math.random() * 9000)}`,
            role: 'user',
            joinedAt: Date.now(),
            marketingAgreed: true, // Implied consent via OAuth
            loginCount: 1,
            credits: 2, // Default credits
            hasPurchasedCredits: false,
            group: 'basic',
            maxGenerations: 1,
            maxEdits: 1,
            generationCount: 0,
            editCount: 0
        };
        await setDoc(docRef, newUser);
        this.saveSession(newUser);
        return newUser;
      }
    } catch (e: any) {
      console.error("Google Login Error:", e);
      if (e.code === 'auth/popup-closed-by-user') {
        throw new Error("로그인 창이 닫혔습니다.");
      } else if (e.code === 'auth/unauthorized-domain') {
        throw new Error(`승인되지 않은 도메인입니다. Firebase Console에서 도메인을 추가해주세요. (현재: ${window.location.hostname})`);
      }
      throw new Error("Google 로그인 중 오류가 발생했습니다.");
    }
  }
};
