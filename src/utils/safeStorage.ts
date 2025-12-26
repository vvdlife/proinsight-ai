/**
 * Safe LocalStorage Wrapper
 * Handles JSON parsing errors and quota limits gracefully.
 */

export const safeLocalStorage = {
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch (e) {
      console.warn(`Failed to load ${key} from localStorage, using default.`, e);
      return defaultValue;
    }
  },

  setItem: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Failed to save ${key} to localStorage.`, e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert('브라우저 저장 공간이 부족합니다. 일부 데이터를 정리해주세요.');
      }
      return false;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove ${key} from localStorage.`, e);
    }
  },
};
