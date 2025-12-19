
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
  WATERCOLOR = '수채화',
  CYBERPUNK = '사이버펑크',
  ANIME = '애니메이션',
}

export enum BlogFont {
  PRETENDARD = 'Pretendard (기본)',
  NOTO_SERIF = 'Noto Serif (명조)',
  NANUM_GOTHIC = '나눔고딕 (본문용)',
  RIDIBATANG = '리디바탕 (이북스타일)',
  NANUM_PEN = '나눔손글씨 (캐주얼)',
}

export interface OutlineData {
  title: string;
  sections: string[];
}

export interface SocialPost {
  platform: 'Instagram' | 'LinkedIn' | 'Twitter';
  content: string;
  hashtags: string[];
  imageUrl?: string; // Added for Instagram image support
}

export interface BlogPost {
  title: string;
  content: string; // Markdown formatted string
  images: string[];
  socialPosts?: SocialPost[];
}

export interface UploadedFile {
  name: string;
  mimeType: string;
  data: string; // Base64 string without prefix
}

export enum AppStep {
  TOPIC_INPUT = 0,
  OUTLINE_REVIEW = 1,
  FINAL_RESULT = 2,
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
  progress?: number; // 0-100, optional progress percentage
}

// v1.1: Model Selection (All mapped to 2.5-flash for stability in 2025 environment)
export enum ModelType {
  PRO_3_0 = 'gemini-3.0-pro',
  FLASH_3_0 = 'gemini-3.0-flash',
  FLASH_2_5 = 'gemini-2.5-flash',
}

// v1.1: API Usage Monitoring
export interface ApiCallRecord {
  timestamp: number;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  operation: string; // e.g., 'outline', 'content', 'image', 'social'
}

export interface ApiUsageStats {
  totalCalls: number;
  totalTokens: number;
  estimatedCost: number; // in USD
  lastUpdated: number; // timestamp
  callHistory: ApiCallRecord[]; // last 100 calls
  monthlyUsage: {
    [yearMonth: string]: { // format: "2025-12"
      calls: number;
      tokens: number;
      cost: number;
    };
  };
}

// v1.2: Trending Topics
export interface SeoDiagnosis {
  issue: string;
  original: string;
  suggestion: string;
  rewrite?: string; // New: Concrete rewrite example
}

export interface TrendingTopic {
  icon: string; // Icon name (e.g., "TrendIcon", "ChartIcon")
  text: string; // Topic text
}

export interface TrendingCache {
  topics: TrendingTopic[];
  timestamp: number;
}

export interface TrendAnalysis {
  interestScore: number;
  reason: string;
  relatedKeywords: string[];
  prediction: string;
}

