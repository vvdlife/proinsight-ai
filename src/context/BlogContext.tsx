import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import {
  AppStep,
  LoadingState,
  BlogTone,
  ImageStyle,
  BlogFont,
  ModelType,
  OutlineData,
  BlogPost,
  UploadedFile,
  TrendingTopic,
} from '../types';
import { useBlogGenerator } from '../hooks/useBlogGenerator';
import { useTrendingTopics } from '../hooks/useTrendingTopics';
import { useHistory, HistoryItem } from '../hooks/useHistory'; // [FIX] Import HistoryItem
import { UIProvider, useUI } from './UIContext';
import { EditorProvider, useEditor } from './EditorContext';

// ------------------------------------------------------------------
// Legacy Interface Preservation (The "Contract")
// ------------------------------------------------------------------
interface BlogContextType {
  // UI State
  currentStep: AppStep;
  setCurrentStep: (step: AppStep) => void;
  loading: LoadingState;
  setLoading: (state: LoadingState) => void; // Exposed for manual control if needed

  // Data State
  topic: string;
  setTopic: (value: string) => void;
  outline: OutlineData | null;
  setOutline: (data: OutlineData | null) => void;
  finalPost: BlogPost | null;
  setFinalPost: (post: BlogPost | null) => void;
  finalPostEn: BlogPost | null;
  setFinalPostEn: (post: BlogPost | null) => void;

  // Session
  creationId: string;

  // Config
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

  // Inputs
  sourceUrls: string[];
  setSourceUrls: (urls: string[]) => void;
  sourceFiles: UploadedFile[];
  setSourceFiles: (files: UploadedFile[]) => void;
  memo: string;
  setMemo: (value: string) => void;

  // Settings
  blogUrls: { [key: string]: string };
  setBlogUrls: (urls: { [key: string]: string }) => void;

  // Global UI
  isHistoryOpen: boolean;
  setIsHistoryOpen: (isOpen: boolean) => void;

  // Logic / Actions
  suggestions: TrendingTopic[]; // [FIX] Restored legacy name
  loadingTrends: boolean; // [FIX] Restored legacy name
  refreshTrends: () => Promise<void>; // [FIX] Restored legacy name

  onGenerateOutline: () => Promise<void>;
  onGenerateFullPost: () => Promise<void>;

  history: HistoryItem[];
  historyLoading: boolean;
  saveToHistory: () => Promise<void>;
  loadFromHistory: (item: HistoryItem) => void;
  deleteHistoryItem: (id: string) => Promise<void>;

  resetAll: () => void;
}

// Create the Context (It will be null initially, but populated by the hook)
const BlogContext = createContext<BlogContextType | undefined>(undefined);

// ------------------------------------------------------------------
// The Adapter Component (Internal)
// ------------------------------------------------------------------
const BlogContextAdapter: React.FC<{ children: ReactNode }> = ({ children }) => {
  const ui = useUI();
  const editor = useEditor();

  // Domain Hooks
  const { generateOutlineWrapper, generatePostWrapper, generateSocialWrapper } = useBlogGenerator();
  const {
    suggestions: trendingTopics,
    loadingTrends: historyLoading,
    refreshTrends: refreshTrending,
  } = useTrendingTopics(); // [FIX] Destructure correct names
  const { history, saveItem, deleteItem, isHistoryOpen, setIsHistoryOpen } = useHistory(
    null,
    null,
    null,
    editor.creationId,
  ); // [FIX] Pass nulls as we don't rely on implicit effect anymore

  // ------------------------------------------------------------------
  // Business Logic (Orchestration)
  // ------------------------------------------------------------------

  const handleGenerateOutline = useCallback(async () => {
    if (!editor.topic.trim()) {
      toast.error('주제를 입력해주세요.', { description: '블로그 주제는 필수입니다.' });
      return;
    }

    ui.setLoading({ isLoading: true, message: '개요를 생성하고 있습니다...', progress: 30 });

    try {
      const data = await generateOutlineWrapper(
        editor.topic,
        editor.sourceFiles,
        editor.sourceUrls,
        editor.memo,
        editor.selectedModel,
      );

      editor.setOutline(data);
      ui.setCurrentStep(AppStep.OUTLINE_REVIEW);
      toast.success('개요가 생성되었습니다.');
    } catch (error) {
      console.error(error);
      toast.error('개요 생성 중 오류가 발생했습니다.');
    } finally {
      ui.setLoading({ isLoading: false, message: '', progress: 0 });
    }
  }, [editor, ui, generateOutlineWrapper]);

  const handleGenerateFullPost = useCallback(async () => {
    if (!editor.outline) return;

    ui.setLoading({ isLoading: true, message: '블로그 글을 작성하고 있습니다...', progress: 10 });

    try {
      // 1. Generate Korean Post
      ui.setLoading({ isLoading: true, message: '국문 블로그 포스팅 생성 중...', progress: 30 });
      // Signature: (outline, tone, imageStyle, files, urls, memo, topic, modelId, language, skipImage)
      const koPost = await generatePostWrapper(
        editor.outline,
        editor.selectedTone,
        editor.selectedImageStyle, // [FIX] Added missing arg
        editor.sourceFiles,
        editor.sourceUrls,
        editor.memo,
        editor.topic,
        editor.selectedModel,
        'ko',
        false,
      );
      editor.setFinalPost(koPost);

      // 2. Generate English Post (if Dual Mode)
      let enPost = null;
      if (editor.isDualMode) {
        ui.setLoading({ isLoading: true, message: '영문 번역본 생성 중...', progress: 60 });
        enPost = await generatePostWrapper(
          editor.outline,
          editor.selectedTone,
          editor.selectedImageStyle,
          editor.sourceFiles,
          editor.sourceUrls,
          editor.memo,
          editor.topic,
          editor.selectedModel,
          'en',
          true,
        );
        editor.setFinalPostEn(enPost);
      } else {
        editor.setFinalPostEn(null);
      }

      // 3. Generate Social Content
      ui.setLoading({ isLoading: true, message: 'SNS 홍보 콘텐츠 생성 중...', progress: 90 });
      const socials = await generateSocialWrapper(
        koPost.title,
        koPost.content.slice(0, 500),
        editor.selectedImageStyle,
      );

      // Merge social content into the post object (Adapter logic)
      editor.setFinalPost({ ...koPost, socialPosts: socials });

      ui.setCurrentStep(AppStep.FINAL_RESULT);
      toast.success('블로그 포스팅이 완료되었습니다.');
    } catch (error) {
      console.error(error);
      toast.error('글 생성 중 오류가 발생했습니다.');
    } finally {
      ui.setLoading({ isLoading: false, message: '', progress: 0 });
    }
  }, [editor, ui, generatePostWrapper, generateSocialWrapper]);

  const handleSaveToHistory = useCallback(async () => {
    if (!editor.finalPost || !editor.outline) return;

    await saveItem({
      id: editor.creationId,
      date: new Date().toISOString(),
      topic: editor.topic,
      outline: editor.outline,
      finalPost: editor.finalPost, // [FIX] Map finalPost -> finalPost (naming match check needed)
      finalPostEn: editor.finalPostEn || undefined,
      // options: ... if HistoryItem supports it? Original used params only.
      // Let's rely on type definition of HistoryItem in useHistory.ts
    });
    toast.success('히스토리에 저장되었습니다.');
  }, [editor, saveItem]);

  const handleLoadFromHistory = useCallback(
    (item: HistoryItem) => {
      editor.setTopic(item.topic);
      editor.setOutline(item.outline);
      editor.setFinalPost(item.finalPost);
      editor.setFinalPostEn(item.finalPostEn || null);
      editor.setCreationId(item.id);

      if (item.options) {
        editor.setSelectedModel(item.options.model);
        editor.setSelectedTone(item.options.tone);
        editor.setSelectedImageStyle(item.options.imageStyle);
      }

      ui.setCurrentStep(AppStep.FINAL_RESULT);
      ui.setIsHistoryOpen(false);
    },
    [editor, ui],
  );

  const handleDeleteHistoryItem = useCallback(
    async (id: string) => {
      deleteItem(id);
    },
    [deleteItem],
  );

  const resetAll = useCallback(() => {
    // Reset UI
    ui.setCurrentStep(AppStep.TOPIC_INPUT);

    // Reset Editor Data
    editor.setTopic('');
    editor.setOutline(null);
    editor.setFinalPost(null);
    editor.setFinalPostEn(null);
    editor.setSourceFiles([]);
    editor.setSourceUrls([]);
    editor.setMemo('');
    editor.setCreationId(Date.now().toString());

    // We do NOT reset config (Model, Tone, etc.) as users typically want to keep settings
  }, [ui, editor]);

  // ------------------------------------------------------------------
  // Construct the Legacy Context Value
  // ------------------------------------------------------------------
  const value: BlogContextType = {
    // UI
    currentStep: ui.currentStep,
    setCurrentStep: ui.setCurrentStep,
    loading: ui.loading,
    setLoading: ui.setLoading,
    isHistoryOpen: ui.isHistoryOpen,
    setIsHistoryOpen: ui.setIsHistoryOpen,

    // Editor Data & Config
    topic: editor.topic,
    setTopic: editor.setTopic,
    outline: editor.outline,
    setOutline: editor.setOutline,
    finalPost: editor.finalPost,
    setFinalPost: editor.setFinalPost,
    finalPostEn: editor.finalPostEn,
    setFinalPostEn: editor.setFinalPostEn,
    creationId: editor.creationId,
    selectedModel: editor.selectedModel,
    setSelectedModel: editor.setSelectedModel,
    selectedTone: editor.selectedTone,
    setSelectedTone: editor.setSelectedTone,
    selectedImageStyle: editor.selectedImageStyle,
    setSelectedImageStyle: editor.setSelectedImageStyle,
    selectedFont: editor.selectedFont,
    setSelectedFont: editor.setSelectedFont,
    isDualMode: editor.isDualMode,
    setIsDualMode: editor.setIsDualMode,
    activeLang: editor.activeLang,
    setActiveLang: editor.setActiveLang,
    sourceUrls: editor.sourceUrls,
    setSourceUrls: editor.setSourceUrls,
    sourceFiles: editor.sourceFiles,
    setSourceFiles: editor.setSourceFiles,
    memo: editor.memo,
    setMemo: editor.setMemo,
    blogUrls: editor.blogUrls,
    setBlogUrls: editor.setBlogUrls,

    // Hooks & Actions
    suggestions: trendingTopics, // [FIX] Mapped correctly
    loadingTrends: historyLoading, // [FIX] Mapped correctly
    refreshTrends: refreshTrending, // [FIX] Mapped correctly

    history,
    historyLoading,
    saveToHistory: handleSaveToHistory,
    loadFromHistory: handleLoadFromHistory,
    deleteHistoryItem: handleDeleteHistoryItem,
    onGenerateOutline: handleGenerateOutline,
    onGenerateFullPost: handleGenerateFullPost,
    resetAll,
  };

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
};

// ------------------------------------------------------------------
// The Main Provider (Wrapper)
// ------------------------------------------------------------------
export const BlogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <EditorProvider>
        <BlogContextAdapter>{children}</BlogContextAdapter>
      </EditorProvider>
    </UIProvider>
  );
};

export const useBlogContext = () => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlogContext must be used within a BlogProvider');
  }
  return context;
};
