import { useState, useEffect, useCallback } from 'react';
import { BlogPost, OutlineData } from '../types';

export interface HistoryItem {
    id: string;
    date: string;
    topic: string;
    finalPost: BlogPost;
    finalPostEn?: BlogPost | null;
    outline: OutlineData;
}

export const useHistory = (
    finalPost: BlogPost | null,
    finalPostEn: BlogPost | null,
    outline: OutlineData | null,
    creationId: string // [NEW] Identify the current creation session
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
                outline
            };

            setHistory(prev => {
                // Check if this ID already exists in history
                const index = prev.findIndex(p => p.id === creationId);

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

                // Limit to 10 items (increased from 5 for better UX)
                updated = updated.slice(0, 10);

                try {
                    // Strip images to prevent QuotaExceededError
                    const safeHistory = updated.map(item => ({
                        ...item,
                        images: [],
                        finalPost: item.finalPost ? { ...item.finalPost, images: [] } : null,
                        finalPostEn: item.finalPostEn ? { ...item.finalPostEn, images: [] } : null
                    }));
                    localStorage.setItem('proinsight_history', JSON.stringify(safeHistory));
                } catch (e) {
                    console.error("Failed to save history:", e);
                    // Fallback strategies...
                }

                return updated;
            });
        }
    }, [finalPost, finalPostEn, outline, creationId]);

    return {
        history,
        isHistoryOpen,
        setIsHistoryOpen
    };
};
