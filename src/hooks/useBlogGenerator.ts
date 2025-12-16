import { useState, useCallback } from 'react';
import {
    generateOutline as apiGenerateOutline,
    generateBlogPostContent as apiGeneratePost,
    generateBlogImage as apiGenerateImage,
    generateSocialPosts as apiGenerateSocial
} from '../services/geminiService';
import { LoadingState, OutlineData, BlogPost, BlogTone, ImageStyle, UploadedFile, BlogFont, ModelType, SocialPost } from '../types';

export const useBlogGenerator = () => {
    const [loading, setLoading] = useState<LoadingState>({ isLoading: false, message: '', progress: 0 });

    // Wrapper for Generate Outline
    const generateOutlineWrapper = useCallback(async (
        topic: string,
        sourceFiles: UploadedFile[],
        sourceUrls: string[],
        memo: string,
        modelId: string // [NEW] Accept modelId
    ): Promise<OutlineData> => {
        setLoading({ isLoading: true, message: 'Gemini가 자료를 분석하고 개요를 작성하고 있습니다...', progress: 30 });
        try {
            const data = await apiGenerateOutline(topic, sourceFiles, sourceUrls, memo, modelId);
            setLoading({ isLoading: false, message: '', progress: 100 });
            return data;
        } catch (error) {
            setLoading({ isLoading: false, message: '', progress: 0 });
            throw error;
        }
    }, []);

    // Wrapper for Generate Full Post
    const generatePostWrapper = useCallback(async (
        outline: OutlineData,
        tone: BlogTone,
        imageStyle: ImageStyle,
        files: UploadedFile[],
        urls: string[],
        memo: string,
        topic: string,
        modelId: string, // [NEW] Accept modelId
        language: 'ko' | 'en' = 'ko',
        skipImage: boolean = false
    ): Promise<BlogPost> => {
        setLoading({ isLoading: true, message: '블로그 글을 작성하고 있습니다...', progress: 0 });
        try {
            // 1. Generate Text
            setLoading({ isLoading: true, message: `Step 1/3: ${language === 'en' ? 'Translating' : 'Writing'} content...`, progress: 30 });
            // API Signature: (outline, tone, files, urls, memo, language, topic, modelId)
            const post = await apiGeneratePost(outline, tone, files, urls, memo, language === 'en' ? 'English' : 'Korean', topic, modelId);

            // 2. Generate Image (Parallel if possible, but sequential for progress)
            let imageUrl = '';
            if (!skipImage) {
                setLoading({ isLoading: true, message: 'Step 2/3: AI가 썸네일 이미지를 생성 중입니다...', progress: 60 });
                try {
                    imageUrl = (await apiGenerateImage(topic, imageStyle)) || '';
                } catch (e) {
                    console.error("Image generation failed", e);
                    // Continue even if image fails
                }
            }

            const final: BlogPost = { ...post, images: imageUrl ? [imageUrl] : [] };
            setLoading({ isLoading: false, message: '', progress: 100 });
            return final;

        } catch (error) {
            setLoading({ isLoading: false, message: '', progress: 0 });
            throw error;
        }
    }, []);

    // Wrapper for Translation (Dual Mode)
    const generateTranslationWrapper = useCallback(async (
        originalPost: BlogPost,
        model: ModelType
    ): Promise<BlogPost> => {
        // Placeholder: To be implemented if standard translation logic is needed separately
        return originalPost;
    }, []);

    // Wrapper for Social
    const generateSocialWrapper = useCallback(async (
        title: string,
        summary: string,
        imageStyle: ImageStyle
    ): Promise<SocialPost[]> => {
        return await apiGenerateSocial(title, summary, imageStyle);
    }, []);


    return {
        loading,
        setLoading, // Expose setter just in case
        generateOutlineWrapper,
        generatePostWrapper,
        generateSocialWrapper
    };
};
