import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshIcon } from './Icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🚨</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">오류가 발생했습니다</h1>
            <p className="text-slate-500 mb-6 leading-relaxed">
              죄송합니다. 예상치 못한 문제가 발생했습니다.
              <br />
              페이지를 새로고침하면 해결될 수 있습니다.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg text-left mb-6 overflow-auto max-h-32 text-xs text-red-500 font-mono">
              {this.state.error?.message}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <RefreshIcon className="w-5 h-5" />
              페이지 새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
