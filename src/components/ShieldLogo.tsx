/** Flat in-app version of the CloakGuard shield, cloak, and secure indicator. */
export function ShieldLogo() {
  return (
    <svg viewBox="0 0 64 64" className="brand-mark" role="img" aria-label="CloakGuard logo">
      <path
        d="M11.5 28.5C22 21 39.5 18 53 22.5v9C39.5 27 24 29.5 12 37Z"
        fill="#137A6B"
      />
      <path
        d="M11.5 36.5C21 45.5 39.5 47 52.5 37.5 49 46.5 42.5 53 32 58 20.5 52.5 13.5 44.5 11.5 36.5Z"
        fill="#10B981"
        opacity="0.82"
      />
      <path
        d="M32 4 53 13v17.5C53 44 44.7 54.3 32 60 19.3 54.3 11 44 11 30.5V13Z"
        fill="none"
        stroke="#34D399"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <rect x="16" y="27" width="32" height="13" rx="6.5" fill="#34D399" />
      <circle cx="24" cy="33.5" r="2.25" fill="#0D1112" />
      <circle cx="32" cy="33.5" r="2.25" fill="#0D1112" />
      <circle cx="40" cy="33.5" r="2.25" fill="#0D1112" />
    </svg>
  );
}
