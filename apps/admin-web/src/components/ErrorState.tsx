import type { ReactNode } from 'react';

interface ErrorStateProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  retryLabel?: string;
  footer?: ReactNode;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  details,
  onRetry,
  retryLabel = 'Retry',
  footer,
}: ErrorStateProps) {
  return (
    <div className="state-panel state-panel-error" role="alert">
      <h3>{title}</h3>
      <p className="error-message">{message}</p>
      {details ? <p className="state-details">{details}</p> : null}
      {onRetry ? (
        <button className="secondary-button" onClick={onRetry} type="button">
          {retryLabel}
        </button>
      ) : null}
      {footer ?? null}
    </div>
  );
}
