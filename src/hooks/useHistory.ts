import { useState, useEffect, useCallback } from 'react';
import { BlogPost, OutlineData, ModelType, BlogTone, ImageStyle } from '../types';

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
    const saved = localStorage.getItem('proinsight_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
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

        try {
          // Strip images and truncate extremely long content to prevent QuotaExceededError
          const safeHistory = updated.map((item) => ({
            ...item,
            images: [],
            finalPost: item.finalPost
              ? {
                ...item.finalPost,
                images: [],
                socialPosts: item.finalPost.socialPosts?.map((p) => ({
                  ...p,
                  imageUrl: undefined,
                })), // [NEW] Strip social images
                content:
                  item.finalPost.content.length > 30000
                    ? item.finalPost.content.substring(0, 30000) + '... (truncated)'
                    : item.finalPost.content,
              }
              : null,
            finalPostEn: item.finalPostEn
              ? {
                ...item.finalPostEn,
                images: [],
                socialPosts: item.finalPostEn.socialPosts?.map((p) => ({
                  ...p,
                  imageUrl: undefined,
                })), // [NEW] Strip social images
                content:
                  item.finalPostEn.content.length > 30000
                    ? item.finalPostEn.content.substring(0, 30000) + '... (truncated)'
                    : item.finalPostEn.content,
              }
              : null,
          }));
          localStorage.setItem('proinsight_history', JSON.stringify(safeHistory));
        } catch (e) {
          console.error('Failed to save history:', e);
          // If even that fails, try clearing old history or just stop saving
          if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            // Clear oldest
            const recover = updated.slice(0, 1); // Keep only current
            try {
              localStorage.setItem('proinsight_history', JSON.stringify(recover));
            } catch (e2) {
              console.error('Could not even save current item', e2);
            }
          }
        }

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

      try {
        localStorage.setItem('proinsight_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save history manually', e);
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          alert('저장 공간이 부족하여 히스토리를 저장할 수 없습니다. 오래된 항목을 삭제해주세요.');
        }
      }
      return updated;
    });
  }, []);

  // Delete Function
  const deleteItem = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem('proinsight_history', JSON.stringify(updated));
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
