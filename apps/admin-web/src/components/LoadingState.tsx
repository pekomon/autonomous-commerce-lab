interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Loading...' }: LoadingStateProps) {
  return (
    <div aria-live="polite" className="state-panel state-panel-loading" role="status">
      <p>{label}</p>
    </div>
  );
}
