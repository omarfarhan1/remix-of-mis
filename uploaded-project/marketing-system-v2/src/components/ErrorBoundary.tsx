import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in ${this.props.name || 'ErrorBoundary'}:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-12 text-center bg-[#FBFBFD] rounded-[40px] border-2 border-dashed border-[#D2D2D7]">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mb-8">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-[28px] font-display font-bold text-[#1D1D1F] mb-4">Something went wrong.</h2>
          <p className="text-[17px] text-[#86868B] max-w-[400px] mb-10 leading-relaxed font-medium">
            The {this.props.name || 'component'} encountered an unexpected error. This has been logged for our engineers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={this.handleReset}
              className="px-8 py-4 bg-[#1D1D1F] text-white rounded-full font-black uppercase tracking-[0.2em] text-[13px] flex items-center gap-3 hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-black/10"
            >
              <RefreshCw size={18} />
              Reboot View
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-4 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-full font-black uppercase tracking-[0.2em] text-[13px] flex items-center gap-3 hover:bg-[#F5F5F7] transition-all active:scale-95"
            >
              <Home size={18} />
              Return Home
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-12 p-6 bg-white border border-[#D2D2D7] rounded-2xl text-left max-w-full overflow-auto shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#86868B] mb-2">Technical Details</p>
              <pre className="text-[12px] font-mono text-rose-600 whitespace-pre-wrap">
                {this.state.error.toString()}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
