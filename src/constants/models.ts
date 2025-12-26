export const MODEL_IDS = {
  TEXT: 'gemini-3-flash-preview',
  FLASH: 'gemini-2.5-flash',
  IMAGE: 'gemini-3-pro-image-preview',
} as const;

export type ModelIdKey = keyof typeof MODEL_IDS;
