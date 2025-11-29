export enum BlogTone {
  PROFESSIONAL = '전문적인',
  CASUAL = '편안한/일상적인',
  WITTY = '재치있는',
  STORYTELLING = '감성적인/스토리텔링',
}

export interface OutlineData {
  title: string;
  sections: string[];
}

export interface BlogPost {
  title: string;
  content: string; // Markdown formatted string
  imageUrl?: string;
}

export enum AppStep {
  TOPIC_INPUT = 0,
  OUTLINE_REVIEW = 1,
  FINAL_RESULT = 2,
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}