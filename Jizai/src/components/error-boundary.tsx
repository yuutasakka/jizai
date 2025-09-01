// import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logReactError } from '../lib/error-tracking';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logReactError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[color:var(--color-jz-surface)] flex items-center justify-center p-[var(--space-16)]">
          <div className="max-w-md w-full bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] rounded-[--radius-jz-card] p-[var(--space-24)] text-center">
            <div className="text-6xl mb-[var(--space-16)]">😓</div>
            <h2 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-[var(--space-12)]">
              何か問題が発生しました
            </h2>
            <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-24)]">
              アプリでエラーが発生しました。ページを再読み込みして再度お試しください。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="jz-button jz-button-primary"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}