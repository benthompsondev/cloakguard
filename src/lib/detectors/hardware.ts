import type { Detector } from '../types';
import { regexMatches } from './helpers';

/** Six hexadecimal octets using one consistent separator. */
const MAC_RE = /(?<![0-9A-Fa-f])(?:[0-9A-Fa-f]{2})([:-])(?:[0-9A-Fa-f]{2}\1){4}[0-9A-Fa-f]{2}(?![0-9A-Fa-f])/g;

export const macAddressDetector: Detector = {
  id: 'mac-address',
  name: 'MAC address',
  category: 'infrastructure',
  severity: 'medium',
  label: 'MAC_ADDRESS',
  priority: 66,
  explanation: 'A hardware address can identify a device on an internal network.',
  detect: (text) =>
    regexMatches(text, MAC_RE, {
      confidenceFor: (value) => {
        const compact = value.replace(/[:-]/g, '').toUpperCase();
        if (compact === '000000000000' || compact === 'FFFFFFFFFFFF') return null;
        return 'high';
      },
    }),
};
