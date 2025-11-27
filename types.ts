
export interface GeneratedImage {
  data: string; // Base64 string
  mimeType: string;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  EDITING = 'EDITING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface HistoryItem {
  id: string;
  image: GeneratedImage;
  prompt: string;
  timestamp: number;
}

export type UserRole = 'admin' | 'user';

export interface User {
  email: string;
  nickname: string;
  role: UserRole;
  joinedAt: number;
  marketingAgreed?: boolean;
  usageCount?: number;
  loginCount?: number;
}

export interface SavedCharacter {
  id: string;
  userEmail: string;
  imageData: string;
  mimeType: string;
  prompt: string;
  timestamp: number;
}

export interface Message {
  id: string;
  senderEmail: string;
  targetEmail: string; // The recipient
  senderRole: UserRole; // Who sent it?
  content: string;
  timestamp: number;
}

export interface SeoConfig {
  title: string;
  description: string;
  keywords: string;
  author: string;
  supportLink?: string;
}
