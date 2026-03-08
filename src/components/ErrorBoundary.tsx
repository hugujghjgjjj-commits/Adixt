import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center font-mono">
          <h1 className="text-4xl font-bold text-[#CCFF00] mb-4 uppercase">System Malfunction</h1>
          <p className="text-xl mb-8 max-w-md">Something went wrong in the matrix. We're working on a fix.</p>
          
          <div className="bg-[#111] border border-white/10 p-6 rounded-xl mb-8 max-w-2xl w-full text-left overflow-auto max-h-60">
            <p className="text-red-500 font-bold mb-2">{this.state.error?.toString()}</p>
            <pre className="text-xs text-gray-500 whitespace-pre-wrap">
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>

          <button 
            onClick={() => window.location.href = '/'}
            className="bg-[#CCFF00] text-black px-8 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-white transition-colors"
          >
            Reboot System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
