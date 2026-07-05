import { describe, expect, it } from 'vitest';
import { macAddressDetector } from './hardware';
import {
  abaRoutingDetector,
  deaNumberDetector,
  einDetector,
  itinDetector,
  isValidAbaRouting,
  isValidDeaNumber,
  isValidItin,
} from './usIdentifiers';
import { passportDetector } from './passport';

const values = (detector: { detect(text: string): { value: string }[] }, text: string) =>
  detector.detect(text).map((match) => match.value);

describe('MAC address', () => {
  it('finds colon and hyphen separated hardware addresses', () => {
    expect(values(macAddressDetector, 'NIC aa:bb:cc:dd:ee:01 and 00-11-22-33-44-55')).toEqual([
      'aa:bb:cc:dd:ee:01',
      '00-11-22-33-44-55',
    ]);
  });

  it('rejects mixed separators, broadcast, and all-zero placeholders', () => {
    expect(
      values(macAddressDetector, 'aa:bb-cc:dd:ee:ff ff:ff:ff:ff:ff:ff 00:00:00:00:00:00'),
    ).toEqual([]);
  });
});

describe('US structured identifiers', () => {
  it('validates labeled ABA routing numbers with the checksum', () => {
    expect(isValidAbaRouting('021000021')).toBe(true);
    expect(isValidAbaRouting('021000022')).toBe(false);
    expect(values(abaRoutingDetector, 'Routing number: 021000021')).toEqual(['021000021']);
    expect(values(abaRoutingDetector, 'reference 021000021')).toEqual([]);
  });

  it('accepts only issued ITIN middle ranges in an explicit field', () => {
    expect(isValidItin('912-70-1234')).toBe(true);
    expect(isValidItin('912-69-1234')).toBe(false);
    expect(values(itinDetector, 'ITIN: 912-70-1234')).toEqual(['912-70-1234']);
    expect(values(itinDetector, 'reference 912-70-1234')).toEqual([]);
  });

  it('finds labeled EIN values only', () => {
    expect(values(einDetector, 'EIN: 12-3456789')).toEqual(['12-3456789']);
    expect(values(einDetector, 'build 12-3456789')).toEqual([]);
  });

  it('validates labeled DEA numbers with their checksum', () => {
    expect(isValidDeaNumber('AB1234563')).toBe(true);
    expect(isValidDeaNumber('AB1234564')).toBe(false);
    expect(values(deaNumberDetector, 'DEA number: AB1234563')).toEqual(['AB1234563']);
    expect(values(deaNumberDetector, 'reference AB1234563')).toEqual([]);
  });
});

describe('passport', () => {
  it('finds compact alphanumeric values only in an explicit passport field', () => {
    expect(values(passportDetector, 'Passport Number: X1234567')).toEqual(['X1234567']);
    expect(values(passportDetector, 'reference X1234567')).toEqual([]);
    expect(values(passportDetector, 'Passport: pending')).toEqual([]);
  });
});
