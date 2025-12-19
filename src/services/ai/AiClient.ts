import { GoogleGenAI } from "@google/genai";
import { trackApiCall, estimateTokens } from '../apiUsageTracker';

export class AiClient {
    private static getClient(): GoogleGenAI {
        const key = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key') || (import.meta as any).env.VITE_API_KEY;

        if (!key) {
            throw new Error("API Key가 없습니다. 설정에서 키를 등록해주세요.");
        }
        return new GoogleGenAI({ apiKey: key });
    }

    /**
     * Generates content using Google GenAI.
     * Automatically handles Usage Tracking.
     */
    static async generate(
        modelId: string,
        parts: any[],
        config: {
            systemInstruction?: string;
            tools?: any[];
            responseMimeType?: string;
            responseSchema?: any;
        } = {},
        operationName: string = 'unknown',
        fallbackPromptText: string = ''
    ): Promise<{ text: string; usage: any }> {
        const ai = this.getClient();

        try {
            const response = await ai.models.generateContent({
                model: modelId,
                contents: { role: 'user', parts },
                config: config,
            });

            const text = response.text || "";

            // Usage Tracking
            const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(fallbackPromptText);
            const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(text);

            trackApiCall(modelId, promptTokens, completionTokens, operationName);

            return { text, usage: response.usageMetadata };
        } catch (error) {
            console.error(`AiClient generate failed [${operationName}]:`, error);
            throw error;
        }
    }

    /**
     * Generates an image (returns base64).
     * Note: The current GoogleGenAI Node SDK might have specific image generation methods or uses generateContent with strict schemas.
     * Based on existing geminiService code, it uses generateContent for IMAGE model.
     */
    static async generateImage(
        modelId: string,
        prompt: string,
        ratio: string = "16:9"
    ): Promise<string | undefined> {
        const ai = this.getClient();

        try {
            // Track Usage (Estimated) - Image models don't always return token counts the same way
            trackApiCall(modelId, 100, 0, 'image');

            const response = await ai.models.generateContent({
                model: modelId,
                contents: prompt,
                config: {
                    imageConfig: { aspectRatio: ratio }
                }
            });

            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
            return undefined;
        } catch (error) {
            console.error("AiClient image generation failed:", error);
            throw error; // Let caller decide or return undefined
        }
    }
}
