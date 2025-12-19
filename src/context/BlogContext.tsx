import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
    AppStep, BlogTone, ImageStyle, BlogFont, ModelType,
    OutlineData, BlogPost, UploadedFile, LoadingState, TrendingTopic
} from '../types';
import { useBlogGenerator } from '../hooks/useBlogGenerator';
import { useTrendingTopics } from '../hooks/useTrendingTopics';
import { useHistory, HistoryItem } from '../hooks/useHistory';

// Define the shape of the context
interface BlogContextType {
    // UI State
    currentStep: AppStep;
    setCurrentStep: (step: AppStep) => void;
    loading: LoadingState;

    // Blog Data State
    topic: string;
    setTopic: (value: string) => void;
    outline: OutlineData | null;
    setOutline: (data: OutlineData | null) => void;
    finalPost: BlogPost | null;
    setFinalPost: (post: BlogPost | null) => void;
    finalPostEn: BlogPost | null;
    setFinalPostEn: (post: BlogPost | null) => void;

    // Configuration State
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

    // Inputs (Source Materials)
    sourceUrls: string[];
    setSourceUrls: (urls: string[]) => void;
    sourceFiles: UploadedFile[];
    setSourceFiles: (files: UploadedFile[]) => void;
    memo: string;
    setMemo: (value: string) => void;

    // Actions & Computed
    onGenerateOutline: () => Promise<void>;
    onGenerateFullPost: () => Promise<void>;
    resetAll: () => void;

    // Trending Logic
    suggestions: TrendingTopic[];
    loadingTrends: boolean;
    refreshTrends: () => void;

    // History
    history: HistoryItem[];
    isHistoryOpen: boolean;
    setIsHistoryOpen: (open: boolean) => void;
    loadFromHistory: (item: HistoryItem) => void;

    // Settings
    blogUrls: { [key: string]: string };
    setBlogUrls: (urls: { [key: string]: string }) => void;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export const BlogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 1. Core State
    const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.TOPIC_INPUT);
    const [topic, setTopic] = useState('');
    const [outline, setOutline] = useState<OutlineData | null>(null);
    const [finalPost, setFinalPost] = useState<BlogPost | null>(null);
    const [finalPostEn, setFinalPostEn] = useState<BlogPost | null>(null);

    // Session ID for History De-duplication
    const [creationId, setCreationId] = useState<string>(() => Date.now().toString());

    // 2. Config State
    const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.FLASH_3_0);
    const [selectedTone, setSelectedTone] = useState<BlogTone>(BlogTone.PROFESSIONAL);
    const [selectedImageStyle, setSelectedImageStyle] = useState<ImageStyle>(ImageStyle.PHOTOREALISTIC);
    const [selectedFont, setSelectedFont] = useState<BlogFont>(BlogFont.PRETENDARD);
    const [isDualMode, setIsDualMode] = useState(true);
    const [activeLang, setActiveLang] = useState<'ko' | 'en'>('ko');

    // 3. Inputs
    const [sourceUrls, setSourceUrls] = useState<string[]>([]);
    const [sourceFiles, setSourceFiles] = useState<UploadedFile[]>([]);
    const [memo, setMemo] = useState('');

    // Settings State
    const [blogUrls, setBlogUrls] = useState<{ [key: string]: string }>(() => {
        try {
            return JSON.parse(localStorage.getItem('proinsight_blog_urls') || '{}');
        } catch {
            return {};
        }
    });

    // Sync blogUrls to localStorage
    React.useEffect(() => {
        localStorage.setItem('proinsight_blog_urls', JSON.stringify(blogUrls));
    }, [blogUrls]);

    // 4. Hooks
    const { loading, generateOutlineWrapper, generatePostWrapper, generateSocialWrapper } = useBlogGenerator();
    const { suggestions, loadingTrends, refreshTrends } = useTrendingTopics(selectedModel);

    // 5. History Hook
    const { history, isHistoryOpen, setIsHistoryOpen } = useHistory(finalPost, finalPostEn, outline, creationId);

    const loadFromHistory = useCallback((item: HistoryItem) => {
        setOutline(item.outline);
        setFinalPost(item.finalPost);
        // If stored, load en/dual settings too? For now, stick to basic restore
        setFinalPostEn(null);
        setCurrentStep(AppStep.FINAL_RESULT);
        setIsHistoryOpen(false);
        setCreationId(item.id); // Resume session with this ID
    }, []);

    // ...
    // Actually, I can't import useHistory inside the component effectively if I didn't import at top.
    // Let's assume I will add import at top in next step or now?
    // I need to add import. Since I can't modify imports easily with this tool without rewriting top,
    // I will use multi_replace to add import AND add logic.

    const resetAll = useCallback(() => {
        setCurrentStep(AppStep.TOPIC_INPUT);
        setTopic('');
        setOutline(null);
        setFinalPost(null);
        setFinalPostEn(null);
        setSourceFiles([]);
        setSourceUrls([]);
        setMemo('');
        setCreationId(Date.now().toString()); // New Session ID
    }, []);

    // Action: Generate Outline
    const onGenerateOutline = useCallback(async () => {
        // Validation handled in UI or here? Let's check key here
        const key = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key') || (import.meta as any).env.VITE_API_KEY;
        if (!key) {
            alert("⚠️ API Key가 설정되지 않았습니다.");
            return;
        }
        if (!topic.trim()) return;

        try {
            const data = await generateOutlineWrapper(topic, sourceFiles, sourceUrls, memo, selectedModel);
            setOutline(data);
            setCurrentStep(AppStep.OUTLINE_REVIEW);
        } catch (error: any) {
            alert(`개요 생성 실패: ${error?.message}`);
        }
    }, [topic, sourceFiles, sourceUrls, memo, selectedModel, generateOutlineWrapper]);

    // Action: Generate Full Post
    const onGenerateFullPost = useCallback(async () => {
        // Validation
        const key = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key') || (import.meta as any).env.VITE_API_KEY;
        if (!key) { alert("⚠️ API Key가 설정되지 않았습니다."); return; }
        if (!outline) return;

        try {
            // 1. Korean
            const postData = await generatePostWrapper(outline, selectedTone, selectedImageStyle, sourceFiles, sourceUrls, memo, topic, selectedModel, 'ko', false);

            // 2. English (Dual)
            let postDataEn = null;
            if (isDualMode) {
                postDataEn = await generatePostWrapper(outline, selectedTone, selectedImageStyle, sourceFiles, sourceUrls, memo, topic, selectedModel, 'en', true);
            }

            // 3. Post-Processing & Social
            const mainTitle = postData.title;
            let finalContent = postData.content;

            // Remove Title if it appears at the start of the body
            const titlePattern = new RegExp(`^${mainTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
            if (finalContent.match(titlePattern) || finalContent.startsWith('Title:') || finalContent.startsWith('# ')) {
                finalContent = finalContent
                    .replace(titlePattern, '')
                    .replace(/^Title:.*?\n+/i, '')
                    .replace(/^# .*?\n+/, '')
                    .trim();
            }

            const summary = finalContent.substring(0, 500);
            let socialPosts: any[] = [];
            try {
                // Ensure social wrapper is called with correct args
                socialPosts = await generateSocialWrapper(postData.title, summary, selectedImageStyle);
            } catch (e) {
                console.error("Social generation failed", e);
            }

            setFinalPost({
                title: mainTitle,
                content: finalContent,
                images: postData.images,
                socialPosts
            });

            if (isDualMode && postDataEn) {
                setFinalPostEn({
                    title: postDataEn.title,
                    content: postDataEn.content,
                    images: postData.images,
                    socialPosts: []
                });
            } else {
                setFinalPostEn(null);
            }

            setActiveLang('ko');
            setCurrentStep(AppStep.FINAL_RESULT);

        } catch (error: any) {
            alert(`글 작성 실패: ${error?.message}`);
        }
    }, [outline, selectedTone, selectedImageStyle, sourceFiles, sourceUrls, memo, topic, selectedModel, isDualMode, generatePostWrapper, generateSocialWrapper]);


    const value: BlogContextType = React.useMemo(() => ({
        currentStep, setCurrentStep,
        loading,
        topic, setTopic,
        outline, setOutline,
        finalPost, setFinalPost,
        finalPostEn, setFinalPostEn,
        selectedModel, setSelectedModel,
        selectedTone, setSelectedTone,
        selectedImageStyle, setSelectedImageStyle,
        selectedFont, setSelectedFont,
        isDualMode, setIsDualMode,
        activeLang, setActiveLang,
        sourceUrls, setSourceUrls,
        sourceFiles, setSourceFiles,
        memo, setMemo,
        onGenerateOutline,
        onGenerateFullPost,
        resetAll,
        suggestions, loadingTrends, refreshTrends,
        history, isHistoryOpen, setIsHistoryOpen, loadFromHistory,
        blogUrls, setBlogUrls
    }), [
        currentStep, loading, topic, outline, finalPost, finalPostEn,
        selectedModel, selectedTone, selectedImageStyle, selectedFont,
        isDualMode, activeLang, sourceUrls, sourceFiles, memo,
        onGenerateOutline, onGenerateFullPost, resetAll,
        suggestions, loadingTrends, refreshTrends,
        history, isHistoryOpen, setIsHistoryOpen, loadFromHistory
    ]);

    return (
        <BlogContext.Provider value={value}>
            {children}
        </BlogContext.Provider>
    );
};

export const useBlogContext = () => {
    const context = useContext(BlogContext);
    if (!context) {
        throw new Error('useBlogContext must be used within a BlogProvider');
    }
    return context;
};
