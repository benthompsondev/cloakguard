import type { Detector } from '../types';
import { regexMatches } from './helpers';

export function isValidAbaRouting(value: string): boolean {
  const digits = value.replace(/[ -]/g, '');
  if (!/^\d{9}$/.test(digits) || digits === '000000000') return false;
  const d = [...digits].map(Number);
  return (
    (3 * (d[0] + d[3] + d[6]) +
      7 * (d[1] + d[4] + d[7]) +
      (d[2] + d[5] + d[8])) %
      10 ===
    0
  );
}

const ABA_RE =
  /\b(?:ABA(?:[ \t]+routing)?|routing(?:[ \t]+transit)?(?:[ \t]+number)?|bank[ \t]+routing)\b[ \t]*[:#=][ \t]*["']?(\d{9})(?!\d)/gi;

export const abaRoutingDetector: Detector = {
  id: 'us-aba-routing',
  name: 'US ABA routing number',
  category: 'personal',
  severity: 'high',
  label: 'ROUTING_NUMBER',
  priority: 64,
  packOnly: true,
  explanation: 'A checksummed routing number identifies a financial institution and payment route.',
  detect: (text) =>
    regexMatches(text, ABA_RE, {
      group: 1,
      confidenceFor: (value) => (isValidAbaRouting(value) ? 'high' : null),
    }),
};

export function isValidItin(value: string): boolean {
  const digits = value.replace(/[ -]/g, '');
  if (!/^9\d{8}$/.test(digits)) return false;
  const middle = Number(digits.slice(3, 5));
  return (
    (middle >= 70 && middle <= 88) ||
    (middle >= 90 && middle <= 92) ||
    (middle >= 94 && middle <= 99)
  );
}

const ITIN_RE =
  /\b(?:ITIN|Individual[ \t]+Taxpayer[ \t]+Identification(?:[ \t]+Number)?)\b[ \t]*[:#=][ \t]*["']?(9\d{2}[ -]?\d{2}[ -]?\d{4})(?!\d)/gi;

export const itinDetector: Detector = {
  id: 'us-itin',
  name: 'US ITIN',
  category: 'personal',
  severity: 'high',
  label: 'ITIN',
  priority: 63,
  packOnly: true,
  explanation: 'An ITIN is a sensitive US tax identifier.',
  detect: (text) =>
    regexMatches(text, ITIN_RE, {
      group: 1,
      confidenceFor: (value) => (isValidItin(value) ? 'high' : null),
    }),
};

const EIN_RE =
  /\b(?:EIN|Employer[ \t]+Identification(?:[ \t]+Number)?|Federal[ \t]+Tax[ \t]+ID)\b[ \t]*[:#=][ \t]*["']?(\d{2}-\d{7})(?!\d)/gi;

export const einDetector: Detector = {
  id: 'us-ein',
  name: 'US Employer Identification Number',
  category: 'personal',
  severity: 'high',
  label: 'EIN',
  priority: 62,
  packOnly: true,
  explanation: 'An EIN is a sensitive organization tax identifier.',
  detect: (text) => regexMatches(text, EIN_RE, { group: 1, confidenceFor: () => 'high' }),
};

export function isValidDeaNumber(value: string): boolean {
  if (!/^[A-Z]{2}\d{7}$/i.test(value)) return false;
  const digits = [...value.slice(2)].map(Number);
  const checksum =
    (digits[0] + digits[2] + digits[4] + 2 * (digits[1] + digits[3] + digits[5])) % 10;
  return checksum === digits[6];
}

const DEA_RE =
  /\b(?:DEA(?:[ \t]+registration)?(?:[ \t]+number|[ \t]+no)?|DEA#)\b[ \t]*[:#=]?[ \t]*["']?([A-Z]{2}\d{7})(?![A-Z0-9])/gi;

export const deaNumberDetector: Detector = {
  id: 'us-dea-number',
  name: 'US DEA registration number',
  category: 'personal',
  severity: 'high',
  label: 'DEA_NUMBER',
  priority: 63,
  packOnly: true,
  explanation: 'A checksummed DEA registration number identifies a controlled-substance registrant.',
  detect: (text) =>
    regexMatches(text, DEA_RE, {
      group: 1,
      confidenceFor: (value) => (isValidDeaNumber(value) ? 'high' : null),
    }),
};
