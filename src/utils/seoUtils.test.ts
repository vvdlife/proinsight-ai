import { describe, it, expect } from 'vitest';
import { calculateSeoMetrics, calculateSeoScores } from './seoUtils';

describe('SEO Utils', () => {
    describe('calculateSeoMetrics', () => {
        it('should calculate basic counts correctly', () => {
            const content = '## Title\nHello world. This is a robust test content.';
            const title = 'Test Title';
            const metrics = calculateSeoMetrics(content, title, '');

            expect(metrics.charCount).toBeGreaterThan(0);
            expect(metrics.h2Count).toBe(1);
        });

        it('should detect keyword correctly', () => {
            const content = 'Apple is a fruit. I like Apple.';
            const title = 'About Apple';
            const keyword = 'Apple';
            const metrics = calculateSeoMetrics(content, title, keyword);

            expect(metrics.keywordCount).toBe(2);
            expect(metrics.inTitle).toBe(true);
            expect(metrics.inFirstPara).toBe(true);
        });

        it('should calculate density correctly', () => {
            const content = 'Keyword keyword keyword other words.';
            const metrics = calculateSeoMetrics(content, '', 'keyword');
            // 3 keyword matches, total ~5 words? "Keyword keyword keyword other words." -> 5 words.
            // 3/5 = 60%.
            expect(metrics.keywordDensity).toBeGreaterThan(50);
        });
    });

    describe('calculateSeoScores', () => {
        it('should give max score for perfect content', () => {
            const metrics = {
                wordCount: 1000,
                charCount: 2000, // 20pts
                h2Count: 5, // 20pts (>=3)
                linkCount: 2, // 5pts
                imageCount: 2, // 5pts
                keywordCount: 15,
                keywordDensity: 1.5, // 15pts (0.5 ~ 3.0)
                inTitle: true, // 15pts
                inFirstPara: true // 10pts
            };
            const scores = calculateSeoScores(metrics, 'test', 0);
            // Length: 20
            // Structure: 10(h2) + 5(img) + 5(link) = 20
            // Keyword: 15(title) + 10(para) + 15(density) = 40
            // Quality: 20
            // Total: 100
            expect(scores.total).toBe(100);
        });

        it('should penalize quality logic', () => {
            const metrics = {
                wordCount: 1000,
                charCount: 2000,
                h2Count: 5,
                linkCount: 2,
                imageCount: 2,
                keywordCount: 15,
                keywordDensity: 1.5,
                inTitle: true,
                inFirstPara: true
            };
            // 2 suggestions -> 20 - 10 = 10 pts quality
            const scores = calculateSeoScores(metrics, 'test', 2);
            expect(scores.quality).toBe(10);
            expect(scores.total).toBe(90);
        });
    });
});
