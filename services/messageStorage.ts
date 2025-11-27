
import { Message, UserRole } from '../types';

const MESSAGES_KEY = 'character_studio_messages';

export const messageStorage = {
  getAll(): Message[] {
    try {
      const stored = localStorage.getItem(MESSAGES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Get all messages exchanged between a specific user and the admin
  getConversation(userEmail: string): Message[] {
    const all = this.getAll();
    return all.filter(m => 
      (m.senderEmail === userEmail) || // Sent by user
      (m.targetEmail === userEmail)    // Sent to user (by admin)
    ).sort((a, b) => a.timestamp - b.timestamp);
  },

  // Get a list of unique users who have started a conversation
  getUniqueSenders(): string[] {
    const all = this.getAll();
    const senders = new Set<string>();
    all.forEach(m => {
      if (m.senderRole === 'user') {
        senders.add(m.senderEmail);
      }
    });
    return Array.from(senders);
  },

  sendMessage(senderEmail: string, targetEmail: string, senderRole: UserRole, content: string) {
    const messages = this.getAll();
    const newMessage: Message = {
      id: Date.now().toString(),
      senderEmail,
      targetEmail,
      senderRole,
      content,
      timestamp: Date.now()
    };
    // Prepend new message
    localStorage.setItem(MESSAGES_KEY, JSON.stringify([...messages, newMessage]));
  },

  deleteMessage(id: string) {
    const messages = this.getAll().filter(m => m.id !== id);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }
};
