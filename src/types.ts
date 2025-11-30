export enum BlogTone {
  PROFESSIONAL = '전문적인',
  CASUAL = '편안한/일상적인',
  WITTY = '재치있는',
  STORYTELLING = '감성적인/스토리텔링',
}

export enum ImageStyle {
  PHOTOREALISTIC = '실사 사진 (DSLR)',
  DIGITAL_ART = '디지털 아트',
  MINIMALIST = '미니멀 일러스트',
  RENDER_3D = '3D 렌더링',
}

export interface OutlineData {
  title: string;
  sections: string[];
}

export interface SocialPost {
  platform: 'Instagram' | 'LinkedIn' | 'Twitter';
  content: string;
  hashtags: string[];
  imageUrl?: string; // 인스타그램용 이미지 URL
}

export interface BlogPost {
  title: string;
  content: string; 
  images: string[]; 
  socialPosts?: SocialPost[];
}

export interface UploadedFile {
  name: string;
  mimeType: string;
  data: string; 
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