import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppStep, LoadingState } from '../types';

interface UIContextType {
  // Navigation
  currentStep: AppStep;
  setCurrentStep: (step: AppStep) => void;

  // Loading Overlay
  loading: LoadingState;
  setLoading: (state: LoadingState) => void;

  // Global Drawers/Modals
  isHistoryOpen: boolean;
  setIsHistoryOpen: (isOpen: boolean) => void;
  // We can add isSettingsOpen here later if needed, but for now strict parity
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.TOPIC_INPUT);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    message: '',
    progress: 0,
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const value = React.useMemo(
    () => ({
      currentStep,
      setCurrentStep,
      loading,
      setLoading,
      isHistoryOpen,
      setIsHistoryOpen,
    }),
    [currentStep, loading, isHistoryOpen],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
