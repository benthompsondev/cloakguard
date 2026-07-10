import { describe, expect, it } from 'vitest';
import { suggestMapping, suggestMappings, suggestionsToMappings } from './mappingSuggestions';
import { validateMappingEntry } from './cloakMappings';

describe('suggestMapping', () => {
  it('suggests SourceSystemID for terms ending in ID, matching suffix casing', () => {
    expect(suggestMapping('NirvSystemID')).toEqual({
      term: 'NirvSystemID',
      replacement: 'SourceSystemID',
      categoryLabel: 'Code Identifier',
    });
    expect(suggestMapping('NirvSystemId').replacement).toBe('SourceSystemId');
  });

  it('suggests ProviderLicenseId for license-shaped terms', () => {
    expect(suggestMapping('LIC-M365-E3-Standard').categoryLabel).toBe('License Group');
    expect(suggestMapping('LIC-M365-E3-Standard').replacement).toBe('ProviderLicenseId');
  });

  it('suggests TicketingSystem for ticketing terms', () => {
    expect(suggestMapping('ContosoHelpdesk')).toEqual({
      term: 'ContosoHelpdesk',
      replacement: 'TicketingSystem',
      categoryLabel: 'Ticketing System',
    });
  });

  it('suggests an access group for directory-group-shaped terms', () => {
    expect(suggestMapping('APP-NirvPortal-Users').categoryLabel).toBe('Access Group');
  });

  it('suggests SourceSystem for short acronyms', () => {
    expect(suggestMapping('NWRH')).toEqual({
      term: 'NWRH',
      replacement: 'SourceSystem',
      categoryLabel: 'Organization',
    });
  });

  it('suggests SourceOrg for multi-word title phrases', () => {
    expect(suggestMapping('Northwind Regional Health')).toEqual({
      term: 'Northwind Regional Health',
      replacement: 'SourceOrg',
      categoryLabel: 'Organization',
    });
  });
});

describe('suggestMappings', () => {
  it('numbers duplicate replacements so different terms stay distinguishable', () => {
    const suggestions = suggestMappings(['NWRH', 'ABCX', 'Nirv']);
    expect(suggestions.map((s) => s.replacement)).toEqual([
      'SourceSystem',
      'SourceSystem2',
      'SourceSystem3',
    ]);
  });

  it('numbers ID-suffixed duplicates before the suffix', () => {
    const suggestions = suggestMappings(['NirvSystemID', 'OtherSystemID']);
    expect(suggestions.map((s) => s.replacement)).toEqual(['SourceSystemID', 'SourceSystem2ID']);
  });
});

describe('suggestionsToMappings', () => {
  it('produces valid, code-only mapping entries', () => {
    let n = 0;
    const entries = suggestionsToMappings(
      suggestMappings(['NirvSystemID', 'APP-NirvPortal-Users', 'Northwind Regional Health']),
      (prefix) => `${prefix}-${(n += 1)}`,
    );
    expect(entries).toHaveLength(3);
    for (const entry of entries) {
      expect(validateMappingEntry(entry)).toBeNull();
      expect(entry.strategy).toBe('code-only');
      expect(entry.codeSafe).toBe(true);
    }
  });
});
