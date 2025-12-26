/**
 * Safely parses JSON from a string, handling markdown code blocks and extra text.
 */
export const safeJsonParse = <T>(text: string): T => {
  if (!text) throw new Error('Empty response text');

  // 1. Try removing markdown code blocks
  const clean = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    // 2. If parsing failed, try extracting the JSON structure strictly
    // Look for the first '{' or '['
    const firstBo = clean.indexOf('{');
    const firstBa = clean.indexOf('[');

    let start = -1;
    let end = -1;

    // Determine if we are looking for an Object or Array based on which comes first
    if (firstBo !== -1 && (firstBa === -1 || firstBo < firstBa)) {
      start = firstBo;
      end = clean.lastIndexOf('}');
    } else if (firstBa !== -1) {
      start = firstBa;
      end = clean.lastIndexOf(']');
    }

    if (start !== -1 && end !== -1 && end > start) {
      const extracted = clean.substring(start, end + 1);
      try {
        return JSON.parse(extracted);
      } catch (inner) {
        console.error('JSON Extraction failed:', extracted);
        throw new Error('Extracted text is not valid JSON.');
      }
    }

    console.error('JSON Parse failed. Raw text:', text);
    throw new Error('Could not find valid JSON in response.');
  }
};

/**
 * Advanced Clean Citations
 * Removes [Source], [Image], [Link], annotations, and excessive markdown artifacts.
 */
export const cleanCitations = (text: string): string => {
  return text
    .replace(/\[Source\]/g, '')
    .replace(/\[Image\]/g, '')
    .replace(/\[Link\]/g, '')
    .replace(/\[citation:\d+\]/g, '') // Remove [citation:1]
    .replace(/\[\d+\]/g, '') // Remove [1], [2]
    .replace(/【\d+:\d+†source】/g, '') // Gemini source annotations
    .replace(/\*\s+/g, '* ') // Fix bullet points
    .replace(/\n{3,}/g, '\n\n') // Normalize newlines
    .trim();
};

/**
 * Normalize Outline Data
 * Converts raw AI response (RawOutlineData) into strict OutlineData.
 */
import { RawOutlineData, OutlineData } from '../types';

export const normalizeOutline = (raw: RawOutlineData | unknown): OutlineData => {
  const data = raw as RawOutlineData;
  const title = data.title || '제목 없음';
  let sections: string[] = [];

  if (Array.isArray(data.sections)) {
    sections = data.sections.map((sec: unknown) => {
      if (typeof sec === 'string') return sec;
      if (typeof sec === 'object' && sec !== null && 'title' in sec) {
        return (sec as { title: string }).title;
      }
      return JSON.stringify(sec);
    });
  } else if (typeof (data as unknown as { sections: unknown }).sections === 'string') {
    // Attempt to parse string list if AI returns markdown list
    // Fallback for extremely malformed cases where sections is a single string
    sections = ((data as unknown as { sections: string }).sections).split('\n').filter((line: string) => line.trim().length > 0);
  }

  return { title, sections };
};
