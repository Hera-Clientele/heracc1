"use client";
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] to-[#23272f] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
        <p className="text-slate-300 mb-4">
          An error occurred while loading the dashboard.
        </p>
        {error && (
          <details className="text-left bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-4">
            <summary className="text-red-400 cursor-pointer">Error Details</summary>
            <pre className="text-red-300 text-sm mt-2 whitespace-pre-wrap">
              {error.message}
            </pre>
          </details>
        )}
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;

