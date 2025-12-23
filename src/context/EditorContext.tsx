import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  BlogTone,
  ImageStyle,
  BlogFont,
  ModelType,
  OutlineData,
  BlogPost,
  UploadedFile,
  TrendingTopic,
} from '../types';

interface EditorContextType {
  // Data State
  topic: string;
  setTopic: (value: string) => void;
  outline: OutlineData | null;
  setOutline: (data: OutlineData | null) => void;
  finalPost: BlogPost | null;
  setFinalPost: (post: BlogPost | null) => void;
  finalPostEn: BlogPost | null;
  setFinalPostEn: (post: BlogPost | null) => void;

  // Session / ID
  creationId: string;
  setCreationId: (id: string) => void;

  // Config State
  selectedModel: ModelType;
  setSelectedModel: (model: ModelType) => void;
  selectedTone: BlogTone;
  setSelectedTone: (tone: BlogTone) => void;
  selectedImageStyle: ImageStyle;
  setSelectedImageStyle: (style: ImageStyle) => void;
  selectedFont: BlogFont;
  setSelectedFont: (font: BlogFont) => void;
  isDualMode: boolean;
  setIsDualMode: (enabled: boolean) => void;
  activeLang: 'ko' | 'en';
  setActiveLang: (lang: 'ko' | 'en') => void;

  // User Inputs (Source Materials)
  sourceUrls: string[];
  setSourceUrls: (urls: string[]) => void;
  sourceFiles: UploadedFile[];
  setSourceFiles: (files: UploadedFile[]) => void;
  memo: string;
  setMemo: (value: string) => void;

  // Settings (Persisted)
  blogUrls: { [key: string]: string };
  setBlogUrls: (urls: { [key: string]: string }) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Core Data
  const [topic, setTopic] = useState('');
  const [outline, setOutline] = useState<OutlineData | null>(null);
  const [finalPost, setFinalPost] = useState<BlogPost | null>(null);
  const [finalPostEn, setFinalPostEn] = useState<BlogPost | null>(null);
  const [creationId, setCreationId] = useState<string>(() => Date.now().toString());

  // 2. Config
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.FLASH_3_0);
  const [selectedTone, setSelectedTone] = useState<BlogTone>(BlogTone.PROFESSIONAL);
  const [selectedImageStyle, setSelectedImageStyle] = useState<ImageStyle>(
    ImageStyle.PHOTOREALISTIC,
  );
  const [selectedFont, setSelectedFont] = useState<BlogFont>(BlogFont.PRETENDARD);
  const [isDualMode, setIsDualMode] = useState(true);
  const [activeLang, setActiveLang] = useState<'ko' | 'en'>('ko');

  // 3. Inputs
  const [sourceUrls, setSourceUrls] = useState<string[]>([]);
  const [sourceFiles, setSourceFiles] = useState<UploadedFile[]>([]);
  const [memo, setMemo] = useState('');

  // 4. Settings
  const [blogUrls, setBlogUrls] = useState<{ [key: string]: string }>(() => {
    try {
      return JSON.parse(localStorage.getItem('proinsight_blog_urls') || '{}');
    } catch {
      return {};
    }
  });

  // Sync settings
  useEffect(() => {
    localStorage.setItem('proinsight_blog_urls', JSON.stringify(blogUrls));
  }, [blogUrls]);

  const value = React.useMemo(
    () => ({
      topic,
      setTopic,
      outline,
      setOutline,
      finalPost,
      setFinalPost,
      finalPostEn,
      setFinalPostEn,
      creationId,
      setCreationId,
      selectedModel,
      setSelectedModel,
      selectedTone,
      setSelectedTone,
      selectedImageStyle,
      setSelectedImageStyle,
      selectedFont,
      setSelectedFont,
      isDualMode,
      setIsDualMode,
      activeLang,
      setActiveLang,
      sourceUrls,
      setSourceUrls,
      sourceFiles,
      setSourceFiles,
      memo,
      setMemo,
      blogUrls,
      setBlogUrls,
    }),
    [
      topic,
      outline,
      finalPost,
      finalPostEn,
      creationId,
      selectedModel,
      selectedTone,
      selectedImageStyle,
      selectedFont,
      isDualMode,
      activeLang,
      sourceUrls,
      sourceFiles,
      memo,
      blogUrls,
    ],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
