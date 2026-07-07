import { useEffect, useRef, useState } from 'react';
import { generateId, validateName } from '../../lib/profiles';
import {
  MAX_CLOAK_LIST_IMPORT_BYTES,
  cloakListSaveBlocker,
  emptyPackTerms,
  parseCloakListText,
  summarizeCloakListImport,
  type CustomPack,
} from '../../lib/customPacks';
import { analyzePrivateTerms, createPrivateTermsDetector } from '../../lib/customTerms';
import { decodeText } from '../../lib/decodeText';
import { scanText } from '../../lib/scan';
import { buildCleanText } from '../../lib/sanitize';
import { TermsFeedback } from '../TermsFeedback';
import {
  QUICK_CLOAK_EXAMPLE_BEFORE,
  QUICK_CLOAK_EXAMPLE_TERMS,
} from '../PrivateTermsDialog';
import { FormatPicker } from './FormatsSection';
import {
  DEFAULT_CUSTOM_TERM_LABEL,
  DEFAULT_TEMPLATE,
  sanitizePlaceholderLabel,
  templateFor,
} from '../../lib/redaction';

interface CloakListEditorProps {
  list: CustomPack | null; // null = create new
  remember: boolean;
  initialName?: string;
  initialTermsText?: string;
  onSave: (pack: CustomPack) => void;
  onCancel: () => void;
}

/**
 * Cloak List editor: a reusable, named collection of exact terms. Under the
 * hood it is a term-only CustomPack (no registry rules, no labeled-field
 * rules) — same model, same persistence rules, nothing new to store.
 */
export function CloakListEditor({
  list,
  remember,
  initialName = '',
  initialTermsText = '',
  onSave,
  onCancel,
}: CloakListEditorProps) {
  const importInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<CustomPack>(
    list
      ? JSON.parse(JSON.stringify(list))
      : {
          id: generateId('pack'),
          name: initialName,
          description: '',
          detectorIds: [],
          rules: [],
          terms: emptyPackTerms(),
          enabled: true,
        },
  );
  const [termsText, setTermsText] = useState(
    list ? draft.terms.values.join('\n') : initialTermsText,
  );
  const [importNotice, setImportNotice] = useState<string | null>(
    initialTermsText ? 'Imported terms — content stays in memory only.' : null,
  );

  // The editor header (title, privacy status, Cancel/Save) must be visible
  // immediately, wherever the packs page was scrolled to.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const nameError = draft.name.length > 0 ? validateName(draft.name) : null;
  const analysis = analyzePrivateTerms(termsText, draft.terms.caseSensitive);
  // A NEW list must contain at least one valid term; an existing list may be
  // edited or cleared (unsaved term values legitimately vanish on reload).
  const saveBlocker = cloakListSaveBlocker(list === null, analysis.terms.length);
  const canSave = draft.name.trim().length > 0 && nameError === null && saveBlocker === null;

  const exampleAfter = buildCleanText(
    QUICK_CLOAK_EXAMPLE_BEFORE,
    scanText(QUICK_CLOAK_EXAMPLE_BEFORE, {
      enabledDetectorIds: [],
      extraDetectors: [
        createPrivateTermsDetector(
          QUICK_CLOAK_EXAMPLE_TERMS,
          {
            ...draft.terms,
            template: templateFor(
              draft.terms.termFormat ?? {
                id: 'indexed',
                customTemplate: DEFAULT_TEMPLATE,
              },
            ),
            label: draft.terms.termLabel,
          },
          'Cloak List term',
        ),
      ],
    }),
  );

  const save = () =>
    onSave({
      ...draft,
      name: draft.name.trim(),
      terms: { ...draft.terms, values: analysis.terms },
    });

  const importTermsFile = async (file: File) => {
    if (!file.name.toLocaleLowerCase().endsWith('.txt')) {
      setImportNotice('Import a plain .txt file with one term per line.');
      return;
    }
    if (file.size > MAX_CLOAK_LIST_IMPORT_BYTES) {
      setImportNotice('That list is too large. Import a .txt file under 256 KB.');
      return;
    }
    try {
      const decoded = decodeText(new Uint8Array(await file.arrayBuffer()));
      if (decoded === null) {
        setImportNotice('Could not decode that .txt file.');
        return;
      }
      const currentTerms = analyzePrivateTerms(termsText, draft.terms.caseSensitive).terms;
      const result = parseCloakListText(decoded, currentTerms, draft.terms.caseSensitive);
      setTermsText(result.terms.join('\n'));
      setImportNotice(summarizeCloakListImport(result));
    } catch {
      setImportNotice('Could not read that .txt file.');
    }
  };

  return (
    <section className="panel settings-panel" aria-label="Cloak List editor">
      <div className="panel-head">
        <div className="panel-title">
          <h2>{list ? `Edit Cloak List: ${list.name}` : 'Create Cloak List'}</h2>
          <span className="muted">
            {remember
              ? draft.terms.saveTerms
                ? 'List and terms will be saved on this device'
                : 'List saved on this device — terms stay session-only until you opt in below'
              : 'Session-only (preference storage is off)'}
          </span>
        </div>
        <div className="panel-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" disabled={!canSave} onClick={save}>
            Save Cloak List
          </button>
        </div>
      </div>
      <div className="settings-body">
        {saveBlocker && (
          <p className="template-error" role="status">
            {saveBlocker}
          </p>
        )}
        <div className="pack-editor-grid">
          <label>
            <strong>List name</strong>
            <input
              className="rule-search"
              value={draft.name}
              maxLength={40}
              aria-label="Cloak List name"
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            {nameError && (
              <span className="template-error" role="alert">
                {nameError}
              </span>
            )}
          </label>
          <label>
            <strong>Description (optional)</strong>
            <input
              className="rule-search"
              value={draft.description ?? ''}
              maxLength={200}
              aria-label="Cloak List description"
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </label>
        </div>

        <div className="section-heading-row">
          <h3>Exact terms ({analysis.terms.length})</h3>
          <button type="button" className="btn btn-mini" onClick={() => importInput.current?.click()}>
            Import .txt
          </button>
          <input
            ref={importInput}
            type="file"
            accept=".txt,text/plain"
            className="visually-hidden"
            aria-label="Import terms from .txt"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importTermsFile(file);
              event.target.value = '';
            }}
          />
        </div>
        <p className="muted">
          Exact words or phrases — organization names, domains, hostnames, usernames, project
          names, team names. One per line, never as a regular expression. Common apostrophe,
          dash, and horizontal-spacing variants match automatically.
        </p>
        {importNotice && (
          <p className="muted" role="status">
            {importNotice}
          </p>
        )}
        <textarea
          className="terms-input"
          rows={6}
          value={termsText}
          aria-label="Cloak List terms"
          spellCheck={false}
          onChange={(e) => setTermsText(e.target.value)}
          placeholder={'One term per line, e.g.\nContoso General\ncontoso.org\nSRV-APP01'}
        />
        <TermsFeedback analysis={analysis} />

        <div className="terms-format-control">
          <h3>How these terms are cloaked</h3>
          <FormatPicker
            choice={
              draft.terms.termFormat ?? {
                id: 'indexed',
                customTemplate: DEFAULT_TEMPLATE,
              }
            }
            onChange={(termFormat) =>
              setDraft({ ...draft, terms: { ...draft.terms, termFormat } })
            }
            compact
            showPreview={false}
            ariaLabel="Cloak List redaction format"
          />
          <label>
            <strong>Placeholder label</strong>
            <input
              className="template-input"
              value={draft.terms.termLabel ?? DEFAULT_CUSTOM_TERM_LABEL}
              maxLength={20}
              spellCheck={false}
              aria-label="Cloak List placeholder label"
              onChange={(event) =>
                setDraft({
                  ...draft,
                  terms: { ...draft.terms, termLabel: event.target.value },
                })
              }
              onBlur={() =>
                setDraft({
                  ...draft,
                  terms: {
                    ...draft.terms,
                    termLabel: sanitizePlaceholderLabel(
                      draft.terms.termLabel,
                      DEFAULT_CUSTOM_TERM_LABEL,
                    ),
                  },
                })
              }
            />
          </label>
        </div>

        <div className="terms-toggles">
          <label className="terms-toggle-row">
            <input
              type="checkbox"
              checked={draft.terms.caseSensitive}
              onChange={(e) =>
                setDraft({ ...draft, terms: { ...draft.terms, caseSensitive: e.target.checked } })
              }
            />
            Case-sensitive matching
          </label>
          <label className="terms-toggle-row">
            <input
              type="checkbox"
              checked={draft.terms.matchInsideWords}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  terms: { ...draft.terms, matchInsideWords: e.target.checked },
                })
              }
            />
            Also match inside longer words (more aggressive)
          </label>
        </div>

        <div className="terms-example">
          <span className="muted">Example with terms “Contoso”, “srv-app01”, “Project Nightjar”:</span>
          <code className="rule-preview-before">{QUICK_CLOAK_EXAMPLE_BEFORE}</code>
          <code className="rule-preview-after">{exampleAfter}</code>
        </div>

        <label className="terms-toggle-row terms-save-row">
          <input
            type="checkbox"
            checked={draft.terms.saveTerms}
            onChange={(e) =>
              setDraft({ ...draft, terms: { ...draft.terms, saveTerms: e.target.checked } })
            }
          />
          Save this Cloak List's terms on this device.
        </label>
        <p className="muted terms-save-warning">
          Saved terms are readable local data on this device and are not encrypted. Nothing is
          uploaded. Term values persist only when preference storage AND this option are both on;
          otherwise they vanish on reload. Clearing preferences deletes saved terms.
        </p>
      </div>
    </section>
  );
}
