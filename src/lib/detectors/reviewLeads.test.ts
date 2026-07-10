import { describe, expect, it } from 'vitest';
import {
  adGroupNameDetector,
  authorInitialsDetector,
  credentialWorkflowDetector,
  csvIdentityHeaderDetector,
  directoryAttributeDetector,
  exchangeWorkflowDetector,
  headerMetadataDetector,
  workflowArtifactDetector,
} from './reviewLeads';
import { scanText } from '../scan';
import { buildCleanText } from '../sanitize';

const values = (detector: { detect(text: string): { value: string }[] }, text: string) =>
  detector.detect(text).map((m) => m.value);

describe('AD group name detector', () => {
  it('finds group names in membership commands and New-ADGroup', () => {
    expect(
      values(adGroupNameDetector, 'Add-ADGroupMember -Identity "APP-Clinical-Users" -Members $u'),
    ).toEqual(['APP-Clinical-Users']);
    expect(
      values(adGroupNameDetector, "Remove-ADGroupMember -Identity 'LIC-M365-E3' -Members $u"),
    ).toEqual(['LIC-M365-E3']);
    expect(values(adGroupNameDetector, '-MemberOf "SEC-VPN-Access"')).toEqual(['SEC-VPN-Access']);
    expect(values(adGroupNameDetector, 'New-ADGroup -Name "APP-Kiosk" -GroupScope Global')).toEqual([
      'APP-Kiosk',
    ]);
  });

  it('ignores unquoted or variable identities', () => {
    expect(values(adGroupNameDetector, 'Add-ADGroupMember -Identity $group -Members $u')).toEqual(
      [],
    );
  });

  it('is a normal enabled finding that redacts only the group name', () => {
    const text = 'Add-ADGroupMember -Identity "LIC-M365-E3" -Members $user';
    const findings = scanText(text);
    const group = findings.find((f) => f.detectorId === 'ad-group-name');
    expect(group?.enabled).toBe(true);
    expect(buildCleanText(text, findings)).toBe(
      'Add-ADGroupMember -Identity "[AD_GROUP_1]" -Members $user',
    );
  });
});

describe('review leads start disabled', () => {
  it('marks lead findings and leaves output untouched by default', () => {
    const text = [
      'Get-ADUser $id -Properties SamAccountName, otherTelephone',
      '$cred = Import-Clixml -Path $credPath',
      'Enable-RemoteMailbox $user -RemoteRoutingAddress $route',
      '# 2024-05-01 Modified by JD cleanup pass',
      'if (Test-Path cycle_state.json) { }',
    ].join('\n');
    const findings = scanText(text);
    const leads = findings.filter((f) => f.reviewLead);
    expect(leads.length).toBeGreaterThanOrEqual(5);
    expect(leads.every((f) => !f.enabled)).toBe(true);
    // Output unchanged: nothing is silently rewritten by a lead.
    expect(buildCleanText(text, findings)).toBe(text);
  });
});

describe('directory attribute detector', () => {
  it('finds distinctive attribute names anywhere', () => {
    expect(
      values(directoryAttributeDetector, 'Select-Object SamAccountName, UserPrincipalName'),
    ).toEqual(['SamAccountName', 'UserPrincipalName']);
    expect(values(directoryAttributeDetector, '$u.pwdLastSet')).toEqual(['pwdLastSet']);
  });

  it('requires code context for the common words mail and Enabled', () => {
    expect(values(directoryAttributeDetector, 'check your mail today, Enabled by default')).toEqual(
      [],
    );
    expect(values(directoryAttributeDetector, '$user.mail and -Enabled $true')).toEqual([
      'mail',
      'Enabled',
    ]);
  });
});

describe('exchange and credential workflow detectors', () => {
  it('classifies Exchange workflow terms', () => {
    expect(
      values(
        exchangeWorkflowDetector,
        'Get-Recipient $id | Where RecipientTypeDetails -eq "RemoteUserMailbox"',
      ),
    ).toEqual(['Get-Recipient', 'RecipientTypeDetails', 'RemoteUserMailbox']);
    expect(
      values(exchangeWorkflowDetector, '$s = New-PSSession -ConfigurationName Microsoft.Exchange'),
    ).toEqual(['New-PSSession -ConfigurationName Microsoft.Exchange']);
  });

  it('classifies SMTP/credential workflow terms', () => {
    expect(
      values(credentialWorkflowDetector, '$cred = Import-Clixml $p; Send-MailMessage -From $f'),
    ).toEqual(['Import-Clixml', 'Send-MailMessage']);
  });
});

describe('author initials detector', () => {
  it('finds initials only on history/author comment lines', () => {
    expect(values(authorInitialsDetector, '# 2024-05-01 Modified by JD cleanup pass')).toEqual([
      'JD',
    ]);
    expect(values(authorInitialsDetector, '# Author: MK')).toEqual(['MK']);
    expect(values(authorInitialsDetector, '$x = 1 # JD said so')).toEqual([]);
  });

  it('skips common IT acronyms', () => {
    expect(
      values(authorInitialsDetector, '# Modified: CSV export now includes AD and UPN fields'),
    ).toEqual([]);
  });
});

describe('header metadata detector', () => {
  it('captures the value after author/company/team labels in comment headers', () => {
    expect(values(headerMetadataDetector, '# Author: Jordan Quill')).toEqual(['Jordan Quill']);
    expect(values(headerMetadataDetector, '#  Company = Contoso Health')).toEqual([
      'Contoso Health',
    ]);
    expect(values(headerMetadataDetector, '# Created by - Ops Team West')).toEqual([
      'Ops Team West',
    ]);
  });

  it('captures comment-based help .AUTHOR and .COMPANYNAME values', () => {
    expect(values(headerMetadataDetector, '  .AUTHOR Jordan Quill')).toEqual(['Jordan Quill']);
    expect(values(headerMetadataDetector, '.COMPANYNAME Contoso Health')).toEqual([
      'Contoso Health',
    ]);
  });

  it('ignores non-comment code and unlabeled lines', () => {
    expect(values(headerMetadataDetector, '$author = "Jordan"')).toEqual([]);
    expect(values(headerMetadataDetector, '# just a note about the author of the RFC')).toEqual(
      [],
    );
  });

  it('is a review lead: starts disabled and rewrites nothing by default', () => {
    const text = '# Author: Jordan Quill';
    const findings = scanText(text);
    const lead = findings.find((f) => f.detectorId === 'header-metadata');
    expect(lead?.reviewLead).toBe(true);
    expect(lead?.enabled).toBe(false);
    expect(buildCleanText(text, findings)).toBe(text);
  });
});

describe('workflow artifact detector', () => {
  it('finds state files, audit logs, snapshots, and clixml credentials', () => {
    expect(values(workflowArtifactDetector, 'reads cycle_state.json each run')).toEqual([
      'cycle_state.json',
    ]);
    expect(values(workflowArtifactDetector, 'writes weekly-audit.log and hr_snapshot.csv')).toEqual(
      ['weekly-audit.log', 'hr_snapshot.csv'],
    );
    expect(values(workflowArtifactDetector, '$cred | Export-Clixml smtp_cred.clixml')).toContain(
      'smtp_cred.clixml',
    );
  });

  it('ignores ordinary file names', () => {
    expect(values(workflowArtifactDetector, 'see readme.txt and report.csv')).toEqual([]);
  });
});

describe('CSV identity header detector', () => {
  it('flags header lines with three or more identity fields', () => {
    const header = 'Employee ID,AD Username,Email,Activation Date,Status';
    const [match] = csvIdentityHeaderDetector.detect(`${header}\n1234,jdoe,x@example.com,,active`);
    expect(match.value).toBe(header);
    expect(match.confidence).toBe('medium');
  });

  it('ignores ordinary comma-separated lines', () => {
    expect(values(csvIdentityHeaderDetector, 'red,green,blue,cyan')).toEqual([]);
    expect(values(csvIdentityHeaderDetector, 'one, two')).toEqual([]);
  });
});
