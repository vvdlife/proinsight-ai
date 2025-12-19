import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { generateOutline, generateBlogPostContent } from './geminiService';
import { BlogTone } from '../types';

// Mock the GoogleGenAI library
// We need to hoist the mock factory variables or use doMock if strictly necessary, 
// but for simple cases, defining them inside or using constants works if carefully managed.
// Ideally, use vi.hoisted() for variables used in vi.mock
const mocks = vi.hoisted(() => ({
    generateContent: vi.fn(),
    getGenerativeModel: vi.fn(),
}));

vi.mock('@google/genai', () => {
    // Define class inside factory to avoid hoisting issues
    class MockGoogleGenAI {
        constructor(public config: any) { }

        get models() {
            return {
                generateContent: mocks.generateContent
            };
        }

        getGenerativeModel = mocks.getGenerativeModel;
    }

    return {
        GoogleGenAI: MockGoogleGenAI,
        Type: {
            ARRAY: 'ARRAY',
            OBJECT: 'OBJECT',
            STRING: 'STRING'
        }
    };
});

describe('geminiService', () => {
    const API_KEY = 'test-api-key';

    beforeAll(() => {
        // Manually mock globals for Node environment
        const storageMock = {
            getItem: vi.fn((key) => {
                if (key === 'proinsight_api_key') return API_KEY;
                return null;
            }),
            setItem: vi.fn(),
            clear: vi.fn()
        };

        vi.stubGlobal('localStorage', storageMock);
        vi.stubGlobal('sessionStorage', storageMock);

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({})
        }));

        // Mock import.meta (if needed, but usually handled by vite transform)
        // Note: import.meta is syntax, can't be mocked easily at runtime if not transformed.
        // relying on short-circuiting in the code.
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        localStorage.clear();
    });

    describe('generateOutline', () => {
        it('should generate an outline successfully', async () => {
            // Setup mock response
            const mockResponse = {
                text: JSON.stringify({
                    title: 'Test Blog Post',
                    sections: ['Introduction', 'Main Point', 'Conclusion']
                }),
                usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10 }
            };

            mocks.generateContent.mockResolvedValue(mockResponse);

            const topic = 'Test Topic';
            const result = await generateOutline(topic, [], [], '');

            // Check if API was called
            expect(mocks.generateContent).toHaveBeenCalled();

            // Check result parsing
            expect(result).toEqual({
                title: 'Test Blog Post',
                sections: ['Introduction', 'Main Point', 'Conclusion']
            });
        });

        it('should handle API errors gracefully', async () => {
            mocks.generateContent.mockRejectedValue(new Error('API Failure'));

            await expect(generateOutline('Fail Topic', [], [], '')).rejects.toThrow();
        });
    });

    describe('generateBlogPostContent', () => {
        it('should generate content for all sections', async () => {
            // Mock responses sequentially
            // 1. Key Facts
            mocks.generateContent.mockResolvedValueOnce({
                text: 'Key Facts Summary',
                usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 5 }
            });
            // 2. Intro, Sections, Conclusion (all parallel)
            // Since specific call order in Promise.all is not guaranteed to resolve in order of providing result,
            // but mocks are popped in call order. 
            // The code calls generateText multiple times.
            // We will just provide a generic response for all subsequent calls.
            mocks.generateContent.mockResolvedValue({
                text: 'Generated Content Section',
                usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10 }
            });

            const outline = {
                title: 'Test Title',
                sections: ['Section 1', 'Section 2']
            };

            try {
                const result = await generateBlogPostContent(
                    outline,
                    BlogTone.PROFESSIONAL,
                    [],
                    [],
                    '',
                    'Korean',
                    'Test Topic'
                );

                expect(result.content).toBeDefined();
                expect(result.title).toBeDefined();
                expect(mocks.generateContent).toHaveBeenCalled();
            } catch (error) {
                console.error('Test Failed with error:', error);
                throw error;
            }
        });
    });
});
