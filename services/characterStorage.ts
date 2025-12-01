
import { GeneratedImage, SavedCharacter } from '../types';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, orderBy } from 'firebase/firestore';

const COLLECTION_NAME = 'characters';

export const characterStorage = {
  async getAll(): Promise<SavedCharacter[]> {
    if (!db) return [];
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const items: SavedCharacter[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as SavedCharacter);
      });
      return items;
    } catch (e) {
      console.error("Error fetching all characters:", e);
      return [];
    }
  },

  async getUserCharacters(email: string): Promise<SavedCharacter[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('userEmail', '==', email)
      );
      const snapshot = await getDocs(q);
      const items: SavedCharacter[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as SavedCharacter);
      });
      // Sort client-side or use composite index in Firestore
      return items.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      console.error("Error fetching user characters:", e);
      return [];
    }
  },

  async saveCharacter(email: string, image: GeneratedImage, prompt: string) {
    if (!db) throw new Error("Database not connected");
    
    const newItem: Omit<SavedCharacter, 'id'> = {
      userEmail: email,
      imageData: image.data,
      mimeType: image.mimeType,
      prompt: prompt,
      timestamp: Date.now()
    };

    try {
      await addDoc(collection(db, COLLECTION_NAME), newItem);
    } catch (e) {
      console.error("Error saving character:", e);
      throw new Error("캐릭터 저장 중 오류가 발생했습니다.");
    }
  },

  async deleteCharacter(id: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (e) {
      console.error("Error deleting character:", e);
      throw new Error("삭제 중 오류가 발생했습니다.");
    }
  }
};
