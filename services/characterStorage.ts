import { GeneratedImage, SavedCharacter } from '../types';

const GALLERY_STORAGE_KEY = 'character_studio_gallery';

export const characterStorage = {
  getAll(): SavedCharacter[] {
    try {
      const items = localStorage.getItem(GALLERY_STORAGE_KEY);
      return items ? JSON.parse(items) : [];
    } catch {
      return [];
    }
  },

  getUserCharacters(email: string): SavedCharacter[] {
    const all = this.getAll();
    return all
      .filter(item => item.userEmail === email)
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  saveCharacter(email: string, image: GeneratedImage, prompt: string) {
    const items = this.getAll();
    const newItem: SavedCharacter = {
      id: Date.now().toString(),
      userEmail: email,
      imageData: image.data,
      mimeType: image.mimeType,
      prompt: prompt,
      timestamp: Date.now()
    };

    // Prepend new item
    const newItems = [newItem, ...items];

    // Safety check for localStorage limits (approximate check)
    // If array gets too big, we might want to limit it. 
    // For this demo, let's keep it simple but handle quotas.
    try {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      // If quota exceeded, try removing oldest items specifically for this user or globally
      if (newItems.length > 10) {
         // Keep only last 10 global items as a fallback to prevent crash
         localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(newItems.slice(0, 10)));
         throw new Error("저장 공간이 가득 차서 오래된 항목이 삭제되었습니다.");
      } else {
         throw new Error("브라우저 저장 공간이 부족하여 저장할 수 없습니다.");
      }
    }
  },

  deleteCharacter(id: string) {
    const items = this.getAll().filter(item => item.id !== id);
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(items));
  }
};