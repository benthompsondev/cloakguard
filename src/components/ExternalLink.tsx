import { isTauri } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import type { AnchorHTMLAttributes, MouseEvent } from 'react';

type OpenResult = 'desktop' | 'web';

/**
 * Open a project link in the system browser when running inside Tauri.
 * Browser builds keep normal anchor navigation instead.
 */
export async function openExternal(url: string): Promise<OpenResult> {
  if (!isTauri()) return 'web';
  await openUrl(url);
  return 'desktop';
}

interface ExternalLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
}

export function ExternalLink({
  href,
  onClick,
  rel = 'noreferrer',
  target = '_blank',
  ...props
}: ExternalLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || !isTauri()) return;

    event.preventDefault();
    void openExternal(href);
  };

  return (
    <a href={href} onClick={handleClick} rel={rel} target={target} {...props} />
  );
}
