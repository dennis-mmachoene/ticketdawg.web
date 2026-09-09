import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('App error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full text-center">
            <h1 className="text-xl font-semibold text-secondary-900 mb-2">Something went wrong</h1>
            <p className="text-secondary-600 mb-6">The page hit an unexpected error. Reloading usually fixes it.</p>
            <button onClick={() => window.location.reload()} className="btn-primary">Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
