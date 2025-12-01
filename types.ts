
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

export type GenerationMode = 
  | 'brand_sheet'      // 기존 캐릭터 시트
  | 'ad_storyboard'    // 광고 스토리보드
  | 'ani_storyboard'   // 애니메이션 스토리보드
  | 'goods'            // 굿즈 패키지
  | 'emoticon'         // 이모티콘 세트
  | 'moving_emoticon'; // 움직이는 이모티콘 (스프라이트 시트)

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
  loginCount?: number;
  
  // Credits System
  credits: number;
  hasPurchasedCredits?: boolean; // Track if user has ever purchased credits

  // Legacy Fields (kept for backward compatibility or group info)
  group: string;        
  maxGenerations: number;
  maxEdits: number;
  generationCount: number;
  editCount: number;
}

export interface SavedCharacter {
  id: string;
  userEmail: string;
  imageData: string;
  mimeType: string;
  prompt: string;
  timestamp: number;
  imageUrl?: string;    // Firebase Storage URL
  storagePath?: string; // Firebase Storage Path
  mode?: GenerationMode;
  memo?: string;
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

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
  link: string;
}
