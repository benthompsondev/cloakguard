import type { Finding } from './types';
import type { CloakCandidate } from './candidates';
import type { CodeWarning } from './codeWarnings';
import type { OutputMode } from './sanitize';

/**
 * Sanitization readiness: one honest summary of what still deserves a look
 * before the output ships. This is guidance, not a guarantee — automated
 * detection can always miss something, and the UI must keep saying so.
 * Computed from in-memory scan state only; nothing here is persisted.
 */

export type ReadinessTone = 'warn' | 'info';

export interface ReadinessItem {
  kind:
    | 'high-kept'
    | 'review-leads'
    | 'candidates'
    | 'code-warnings';
  count: number;
  message: string;
  tone: ReadinessTone;
}

export interface ReadinessReport {
  /** 'review' whenever any item is present; 'ready' means no open items. */
  status: 'ready' | 'review';
  items: ReadinessItem[];
  /** How many findings carry a code-safe replacement (mode comparison). */
  replacementCount: number;
}

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function assessReadiness(input: {
  findings: readonly Finding[];
  candidates: readonly CloakCandidate[];
  codeWarnings: readonly CodeWarning[];
  outputMode: OutputMode;
}): ReadinessReport {
  const { findings, candidates, codeWarnings, outputMode } = input;
  const items: ReadinessItem[] = [];

  const highKept = findings.filter(
    (f) => !f.enabled && f.severity === 'high' && f.reviewLead !== true,
  );
  if (highKept.length > 0) {
    items.push({
      kind: 'high-kept',
      count: highKept.length,
      message: `${plural(highKept.length, 'high-severity finding')} kept as-is — the original value${
        highKept.length === 1 ? ' is' : 's are'
      } still in the output.`,
      tone: 'warn',
    });
  }

  const openLeads = findings.filter((f) => f.reviewLead === true && !f.enabled);
  if (openLeads.length > 0) {
    items.push({
      kind: 'review-leads',
      count: openLeads.length,
      message: `${plural(openLeads.length, 'review lead')} flagged — nothing is rewritten, but check those lines before sharing.`,
      tone: 'info',
    });
  }

  const orgCandidates = candidates.filter((c) => !c.generic);
  if (orgCandidates.length > 0) {
    items.push({
      kind: 'candidates',
      count: orgCandidates.length,
      message: `${plural(orgCandidates.length, 'suggested term')} not reviewed yet — hide, map, or dismiss them below.`,
      tone: 'info',
    });
  }

  if (codeWarnings.length > 0) {
    items.push({
      kind: 'code-warnings',
      count: codeWarnings.length,
      message:
        outputMode === 'safe-share'
          ? `${plural(codeWarnings.length, 'spot')} may no longer be valid PowerShell — Portfolio-code mode with a code-safe mapping usually fixes this.`
          : `${plural(codeWarnings.length, 'spot')} may no longer be valid PowerShell — add code-safe replacements for the terms involved.`,
      tone: 'warn',
    });
  }

  return {
    status: items.length === 0 ? 'ready' : 'review',
    items,
    replacementCount: findings.filter((f) => f.replacement !== undefined).length,
  };
}
