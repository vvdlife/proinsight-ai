import { describe, it, expect } from 'vitest';
import { PROMPTS } from './prompts';
import { OutlineData, UploadedFile, BlogTone } from '../types';

describe('PROMPTS', () => {
    describe('BASE_CONTEXT', () => {
        it('should generate context with minimal inputs', () => {
            const result = PROMPTS.BASE_CONTEXT(
                'Test Title', 'Professional', 'Korean', 'Facts...', 'Persona...', false, 'Topic', '', [], false
            );
            expect(result).toContain('Blog Title: "Test Title"');
            expect(result).toContain('Tone: Professional');
            expect(result).not.toContain('SOURCE URLs');
            expect(result).not.toContain('attached documents');
        });

        it('should include file contexts', () => {
            const result = PROMPTS.BASE_CONTEXT(
                'Title', 'Tone', 'Lang', 'Facts', 'Persona', false, 'Topic', '', [], true
            );
            expect(result).toContain('(Refer to attached documents)');
        });

        it('should include URLs', () => {
            const urls = ['http://example.com'];
            const result = PROMPTS.BASE_CONTEXT(
                'Title', 'Tone', 'Lang', 'Facts', 'Persona', false, 'Topic', '', urls, false
            );
            expect(result).toContain('SOURCE URLs');
            expect(result).toContain('http://example.com');
        });

        it('should include memo', () => {
            const memo = 'Special instruction';
            const result = PROMPTS.BASE_CONTEXT(
                'Title', 'Tone', 'Lang', 'Facts', 'Persona', false, 'Topic', memo, [], false
            );
            expect(result).toContain('[USER MEMO]:');
            expect(result).toContain('Special instruction');
        });
    });

    describe('OUTLINE', () => {
        it('should return a string containing instruction', () => {
            const result = PROMPTS.OUTLINE(new Date().toDateString(), 'AI Trends');
            expect(result).toContain('Create a blog post outline for the topic');
            expect(result).toContain('AI Trends');
        });
    });

    describe('SECTION', () => {
        it('should prompt for section writing', () => {
            const outlineSections = ['Section 1', 'Section 2'];
            const result = PROMPTS.SECTION('Base Context...', 'Section 1', outlineSections, false);
            expect(result).toContain('Section 1');
            expect(result).toContain('Base Context...');
        });
    });

    describe('SOCIAL', () => {
        it('should generate social prompts', () => {
            const result = PROMPTS.SOCIAL('New Post', 'Summary text');
            expect(result).toContain('Instagram');
            expect(result).toContain('LinkedIn');
            expect(result).toContain('New Post');
        });
    });

    describe('SEO_ANALYSIS', () => {
        it('should generate SEO analysis prompts', () => {
            const result = PROMPTS.SEO_ANALYSIS('PersonaInstruction', 'Keyword', false, 'Content...');
            expect(result).toContain('Target Keyword: "Keyword"');
            expect(result).toContain('Context Language: Korean');
        });
    });
});
