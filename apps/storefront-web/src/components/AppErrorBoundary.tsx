import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Storefront runtime error', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="storefront-shell">
          <section>
            <h1>Something went wrong</h1>
            <p>Unexpected error occurred while loading this page.</p>
            <button
              className="primary-button"
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload page
            </button>
          </section>
        </div>
      );
    }

    return this.props.children;
  }
}
