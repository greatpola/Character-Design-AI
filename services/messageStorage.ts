
import { Message, UserRole } from '../types';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore';

const COLLECTION_NAME = 'messages';

export const messageStorage = {
  async getAll(): Promise<Message[]> {
    if (!db) return [];
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'asc'));
      const snapshot = await getDocs(q);
      const msgs: Message[] = [];
      snapshot.forEach(doc => {
        msgs.push({ id: doc.id, ...(doc.data() as any) } as Message);
      });
      return msgs;
    } catch (e) {
      console.error("Error fetching messages:", e);
      return [];
    }
  },

  // Get all messages exchanged between a specific user and the admin
  async getConversation(userEmail: string): Promise<Message[]> {
    const all = await this.getAll();
    // For simplicity and to avoid complex composite indexes on `senderEmail` OR `targetEmail`,
    // we fetch all sorted by time and filter in memory. 
    // In a production app with huge data, we would use two queries or a specific conversationID.
    return all.filter(m => 
      (m.senderEmail === userEmail) || // Sent by user
      (m.targetEmail === userEmail)    // Sent to user (by admin)
    );
  },

  // Get a list of unique users who have started a conversation
  async getUniqueSenders(): Promise<string[]> {
    const all = await this.getAll();
    const senders = new Set<string>();
    all.forEach(m => {
      if (m.senderRole === 'user') {
        senders.add(m.senderEmail);
      }
    });
    return Array.from(senders);
  },

  async sendMessage(senderEmail: string, targetEmail: string, senderRole: UserRole, content: string) {
    if (!db) throw new Error("Database not connected");

    const newMessage: Omit<Message, 'id'> = {
      senderEmail,
      targetEmail,
      senderRole,
      content,
      timestamp: Date.now()
    };
    
    try {
      await addDoc(collection(db, COLLECTION_NAME), newMessage);
    } catch (e) {
      console.error("Error sending message:", e);
      throw e;
    }
  }
};