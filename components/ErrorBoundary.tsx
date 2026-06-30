import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    errorCount: 0,
  };

  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState(prevState => ({ errorCount: prevState.errorCount + 1 }));
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4 font-mono border-t-4 border-red-600">
          <h1 className="text-2xl font-bold text-red-500 mb-4 tracking-widest uppercase">[ SYSTEM_FAILURE ]</h1>
          <p className="text-center mb-6 text-gray-400 text-sm">CRITICAL ERROR ENCOUNTERED. EXECUTION HALTED.</p>
          <p className="text-xs text-gray-600 mb-6 font-mono">ERR_DUMP: SELF_HEAL_ATTEMPT_{this.state.errorCount}</p>
          <button
            onClick={this.handleRetry}
            className="px-6 py-2 border border-white/20 text-white/80 font-bold uppercase text-xs hover:bg-white/10 hover:text-white transition-colors tracking-widest"
          >
            INITIATE_REBOOT
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}