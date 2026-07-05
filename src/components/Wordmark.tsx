interface WordmarkProps {
  className?: string;
}

export function Wordmark({ className = '' }: WordmarkProps) {
  return (
    <span className={`wordmark ${className}`.trim()} aria-label="CloakGuard">
      <span aria-hidden="true">Cloak</span>
      <span className="wordmark-accent" aria-hidden="true">
        Guard
      </span>
    </span>
  );
}
