interface DemoBannerProps {
  flag: string | undefined;
}

export function isDemoBannerEnabled(flag: unknown): boolean {
  return flag === '1';
}

export function DemoBanner({ flag }: DemoBannerProps) {
  if (!isDemoBannerEnabled(flag)) return null;

  return (
    <aside className="demo-banner" aria-label="Online demo notice">
      <span>Online demo — everything runs in your browser and nothing is uploaded.</span>{' '}
      <a href="https://github.com/benthompsondev/cloakguard/releases/latest">
        Download the Windows app
      </a>{' '}
      <span>for fully offline use.</span>
    </aside>
  );
}
