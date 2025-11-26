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