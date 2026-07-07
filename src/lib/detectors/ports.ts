import type { Detector, RawMatch } from '../types';

const COMMON_PORTS = new Set([
  21, 22, 23, 25, 53, 110, 143, 389, 445, 465, 587, 636, 993, 995, 1433, 1521,
  3306, 3389, 5432, 5985, 5986, 8080,
]);

const HOST_PORT_RE =
  /\b(?:[a-z0-9](?:[a-z0-9-]{0,62})?(?:\.[a-z0-9](?:[a-z0-9-]{0,62})?)+|\d{1,3}(?:\.\d{1,3}){3}):([0-9]{1,5})\b/gi;

const LABELED_PORT_RE =
  /\b(?:(?:Port|SMTP port|LDAP port|RDP port|SSH port|WinRM port)[ \t]*[:=]?[ \t]*)([0-9]{1,5})\b/gi;

function addPortMatches(text: string, pattern: RegExp, matches: RawMatch[]) {
  const re = new RegExp(pattern.source, pattern.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const value = m[1];
    if (!value) continue;
    const port = Number(value);
    if (!COMMON_PORTS.has(port)) continue;
    const start = m.index + m[0].lastIndexOf(value);
    matches.push({ start, end: start + value.length, value, confidence: 'medium' });
  }
}

export const portDetector: Detector = {
  id: 'network-port',
  name: 'Network port',
  category: 'infrastructure',
  severity: 'low',
  label: 'PORT',
  priority: 35,
  explanation: 'Service ports can reveal infrastructure, admin access, and application roles.',
  detect: (text) => {
    const matches: RawMatch[] = [];
    addPortMatches(text, HOST_PORT_RE, matches);
    addPortMatches(text, LABELED_PORT_RE, matches);
    return matches;
  },
};
