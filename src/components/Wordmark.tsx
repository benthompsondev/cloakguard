interface WordmarkProps {
  className?: string;
}

export function Wordmark({ className = '' }: WordmarkProps) {
  return (
    <span className={`wordmark ${className}`.trim()} aria-label="CloakScan">
      <span aria-hidden="true">Cloak</span>
      <span className="wordmark-accent" aria-hidden="true">
        Scan
      </span>
    </span>
  );
}
