import { GoogleGenAI } from '@google/genai';
import { MODEL_IDS } from '../constants/models';

export class GeminiClient {
  private static instance: GeminiClient;
  private client: GoogleGenAI | null = null;
  private apiKey: string | null = null;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): GeminiClient {
    if (!GeminiClient.instance) {
      GeminiClient.instance = new GeminiClient();
    }
    return GeminiClient.instance;
  }

  private initialize(): void {
    // Priority: Session -> LocalStorage -> Env
    const key =
      sessionStorage.getItem('proinsight_api_key') ||
      localStorage.getItem('proinsight_api_key') ||
      import.meta.env.VITE_API_KEY;


    if (key) {
      this.apiKey = key;
      this.client = new GoogleGenAI({ apiKey: key });
    }
  }

  public getClient(): GoogleGenAI {
    // Re-check key if client is null (e.g. user added key later)
    if (!this.client || !this.apiKey) {
      this.initialize();
    }

    if (!this.client) {
      // We throw here because services expect a valid client.
      // The UI should catch this and show the "Settings" modal.
      throw new Error('API Key가 설정되지 않았습니다. 설정 메뉴에서 키를 입력해주세요.');
    }

    return this.client;
  }

  public hasKey(): boolean {
    if (!this.apiKey) {
      this.initialize();
    }
    return !!this.apiKey;
  }

  public getModelId(type: 'TEXT' | 'IMAGE' | 'FLASH'): string {
    switch (type) {
      case 'TEXT':
        return MODEL_IDS.TEXT;
      case 'IMAGE':
        return MODEL_IDS.IMAGE;
      case 'FLASH':
        return MODEL_IDS.FLASH;
      default:
        return MODEL_IDS.TEXT;
    }
  }
}
