import type { Route } from '../hooks/useHashRoute';
import { ShieldLogo } from './ShieldLogo';
import { LocalIcon, OpenSourceIcon, PrivacyIcon } from './StatusIcons';
import { Wordmark } from './Wordmark';

interface HeaderProps {
  route: Route;
}

const NAV_ITEMS: { label: string; href: string; view: Route['view'] }[] = [
  { label: 'Scan', href: '#/scan', view: 'scan' },
  { label: 'Settings', href: '#/settings/general', view: 'settings' },
  { label: 'Privacy / About', href: '#/about', view: 'about' },
];

export function Header({ route }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <a className="brand" href="#/scan">
          <ShieldLogo />
          <Wordmark className="brand-name" />
        </a>
        <nav className="nav" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.view}
              href={item.href}
              className={`nav-link ${route.view === item.view ? 'is-active' : ''}`}
              aria-current={route.view === item.view ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="header-right">
        <span className="badge">
          <LocalIcon />
          Local-first
        </span>
        <span className="badge">
          <PrivacyIcon />
          No cloud upload
        </span>
        <span className="badge">
          <OpenSourceIcon />
          Open source
        </span>
      </div>
    </header>
  );
}
