import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = '#/foyer';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 font-sans select-none">
          <div className="max-w-xl w-full bg-[#0d121c] border border-cyan-500/40 rounded-2xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400 flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <span className="text-2xl">⚠️</span>
            </div>
            
            <h1 className="text-xl font-black tracking-wider uppercase text-cyan-300 mb-2">
              Civicverse Interface Recovery
            </h1>
            
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              A front-end runtime exception was intercepted before it could cause a blank display. You can reload the viewport or return to the safe default state.
            </p>

            {this.state.error && (
              <div className="w-full text-left bg-black/60 border border-red-500/30 rounded-lg p-3.5 mb-6 text-xs font-mono text-red-300 overflow-x-auto max-h-48">
                <div className="font-bold text-red-400 mb-1">{this.state.error.name}: {this.state.error.message}</div>
                {this.state.error.stack && (
                  <pre className="text-[11px] text-gray-400 whitespace-pre-wrap">{this.state.error.stack}</pre>
                )}
              </div>
            )}

            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
              >
                Reload Viewport
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#1a2334] hover:bg-[#253249] text-gray-300 hover:text-white border border-[#323d4e] font-bold text-sm transition-all cursor-pointer"
              >
                Reset &amp; Enter Foyer
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
