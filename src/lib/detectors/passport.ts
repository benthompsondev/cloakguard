import type { Detector } from '../types';
import { regexMatches } from './helpers';

const PASSPORT_RE =
  /\b(?:Passport(?:[ \t]+(?:Number|No))?|Travel[ \t]+Document[ \t]+Number)\b[ \t]*[:#=][ \t]*["']?([A-Z0-9]{6,12})(?![A-Z0-9])/gi;

export const passportDetector: Detector = {
  id: 'passport-number',
  name: 'Passport number (labeled field)',
  category: 'personal',
  severity: 'high',
  label: 'PASSPORT',
  priority: 60,
  strictOnly: true,
  explanation: 'A compact identifier in an explicit passport field.',
  detect: (text) =>
    regexMatches(text, PASSPORT_RE, {
      group: 1,
      confidenceFor: (value) =>
        /[A-Z]/i.test(value) && /\d/.test(value) ? 'high' : null,
    }),
};
