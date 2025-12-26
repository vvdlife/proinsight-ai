import { useState, useEffect, useCallback } from 'react';
import { BlogPost, OutlineData, ModelType, BlogTone, ImageStyle } from '../types';
import { safeLocalStorage } from '../utils/safeStorage';

export interface HistoryItem {
  id: string;
  date: string;
  topic: string;
  finalPost: BlogPost;
  finalPostEn?: BlogPost | null;
  outline: OutlineData;
  options?: {
    model: ModelType;
    tone: BlogTone;
    imageStyle: ImageStyle;
  };
}

export const useHistory = (
  finalPost: BlogPost | null,
  finalPostEn: BlogPost | null,
  outline: OutlineData | null,
  creationId: string, // [NEW] Identify the current creation session
) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load History on Mount
  useEffect(() => {
    const saved = safeLocalStorage.getItem<HistoryItem[]>('proinsight_history', []);
    setHistory(saved);
  }, []);

  // Save to History when content changes
  useEffect(() => {
    if (finalPost && outline) {
      const newItem: HistoryItem = {
        id: creationId, // Use consistent ID for this session
        date: new Date().toLocaleDateString(),
        topic: outline.title,
        finalPost,
        finalPostEn,
        outline,
        options: undefined, // Options are preserved via manual save, not automatic effect save
      };

      setHistory((prev) => {
        // Check if this ID already exists in history
        const index = prev.findIndex((p) => p.id === creationId);

        let updated;
        if (index !== -1) {
          // Update existing item
          updated = [...prev];
          updated[index] = newItem;
          // Move to top? Optionally. Let's keep position for now or move to top.
          // Usually "recently edited" moves to top.
          updated.splice(index, 1);
          updated.unshift(newItem);
        } else {
          // Add new item
          updated = [newItem, ...prev];
        }

        // Limit to 1 item as per user request to prevent QuotaExceededError
        updated = updated.slice(0, 1);

        safeLocalStorage.setItem('proinsight_history', updated);
        return updated;
      });
    }
  }, [finalPost, finalPostEn, outline, creationId]);

  // Manual Save Function
  const saveItem = useCallback((item: HistoryItem) => {
    setHistory((prev) => {
      // Check if this ID already exists
      const index = prev.findIndex((p) => p.id === item.id);
      let updated;
      if (index !== -1) {
        updated = [...prev];
        updated[index] = item;
        // Move to top
        updated.splice(index, 1);
        updated.unshift(item);
      } else {
        updated = [item, ...prev];
      }

      // Limit to 50 items (prevent storage overflow)
      if (updated.length > 50) updated = updated.slice(0, 50);

      safeLocalStorage.setItem('proinsight_history', updated);
      return updated;
    });
  }, []);

  // Delete Function
  const deleteItem = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      safeLocalStorage.setItem('proinsight_history', updated);
      return updated;
    });
  }, []);

  return {
    history,
    isHistoryOpen,
    setIsHistoryOpen,
    saveItem,
    deleteItem,
    loading: false, // Compatibility
  };
};
