import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)] p-6">
          <div className="w-full max-w-md bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-[color:var(--text-primary)] mb-2">Something went wrong</h1>
            <p className="text-[color:var(--text-secondary)] mb-6 text-sm">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              className="w-full py-3 bg-[color:var(--accent)] text-white rounded-lg font-medium text-sm cursor-pointer transition-all hover:bg-[color:var(--accent-hover)]"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
