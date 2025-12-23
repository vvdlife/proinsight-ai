import {
  BlogTone,
  ImageStyle,
  OutlineData,
  SocialPost,
  UploadedFile,
  SeoDiagnosis,
} from '../types';

// API Request/Response DTOs

export interface GenerateOutlineRequest {
  topic: string;
  files: UploadedFile[];
  urls: string[];
  memo: string;
  modelId: string;
}

export interface GeneratePostRequest {
  outline: OutlineData;
  tone: BlogTone;
  files: UploadedFile[];
  urls: string[];
  memo: string;
  language: 'Korean' | 'English';
  topic: string;
  modelId: string;
}

export interface GeneratePostResponse {
  content: string;
  title: string;
  hashtags: string[];
}

export interface GenerateSocialRequest {
  title: string;
  summary: string;
  imageStyle: ImageStyle;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Re-export shared types for convenience
export type { UploadedFile, OutlineData, SocialPost, SeoDiagnosis };
