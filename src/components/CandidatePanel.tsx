import { useState } from 'react';
import type { CloakCandidate } from '../lib/candidates';
import { candidateKey } from '../lib/candidates';
import { suggestMapping } from '../lib/mappingSuggestions';

interface CandidatePanelProps {
  candidates: CloakCandidate[];
  onHideCandidate: (term: string) => void;
  onDismissCandidate: (term: string) => void;
  /** Open the Cloak List editor pre-filled with the given terms. */
  onBuildCloakList: (terms: string[]) => void;
}

export function CandidatePanel({
  candidates,
  onHideCandidate,
  onDismissCandidate,
  onBuildCloakList,
}: CandidatePanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Selection follows the visible list: a candidate that was hidden or
  // dismissed since being ticked silently drops out.
  const visibleKeys = new Set(candidates.map((c) => candidateKey(c.text)));
  const selected = selectedKeys.filter((key) => visibleKeys.has(key));
  const selectedTerms = candidates
    .filter((c) => selected.includes(candidateKey(c.text)))
    .map((c) => c.text);
  const likelyCount = candidates.filter((c) => !c.generic).length;

  const toggleSelected = (term: string) => {
    const key = candidateKey(term);
    setSelectedKeys((keys) =>
      keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key],
    );
  };

  const selectLikely = () =>
    setSelectedKeys(candidates.filter((c) => !c.generic).map((c) => candidateKey(c.text)));

  return (
    <section className="panel candidate-panel" aria-label="Possible names and terms to review">
      <button
        type="button"
        className="candidate-panel-head"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((value) => !value)}
      >
        <span className="finding-section-caret" aria-hidden="true">
          {collapsed ? '▸' : '▾'}
        </span>
        <span>
          <strong>Possible names &amp; terms to review</strong>
          <span className="candidate-count">
            {candidates.length} suggestion{candidates.length === 1 ? '' : 's'}
          </span>
        </span>
      </button>

      {!collapsed && (
        <>
          <p className="muted candidate-note">
            These are guesses, not detections — nothing here is redacted until you add it. Built-in
            rules can't safely detect arbitrary names or company terms, so review these and hide the
            ones that matter. Dismiss removes a suggestion for this session only.
          </p>
          <div className="candidate-bulk" role="group" aria-label="Bulk suggestion actions">
            <button
              type="button"
              className="btn btn-mini"
              disabled={likelyCount === 0}
              onClick={selectLikely}
            >
              Select likely terms{likelyCount > 0 ? ` (${likelyCount})` : ''}
            </button>
            <button
              type="button"
              className="btn btn-mini"
              disabled={selected.length === 0}
              onClick={() => setSelectedKeys([])}
            >
              Clear selection
            </button>
            <span className="toolbar-spacer" aria-hidden="true" />
            <button
              type="button"
              className="btn btn-primary btn-mini"
              disabled={selected.length === 0}
              onClick={() => onBuildCloakList(selectedTerms)}
            >
              Build Portfolio Cloak List ({selected.length})
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-mini"
              disabled={selected.length === 0}
              onClick={() => selectedTerms.forEach(onHideCandidate)}
            >
              Hide selected this session
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-mini"
              disabled={selected.length === 0}
              onClick={() => selectedTerms.forEach(onDismissCandidate)}
            >
              Dismiss selected
            </button>
          </div>
          <ul className="candidate-list">
            {candidates.map((candidate) => {
              const key = candidateKey(candidate.text);
              const suggestion = suggestMapping(candidate.text);
              return (
                <li
                  className="candidate-row"
                  key={`${candidate.firstStart}:${candidate.text}`}
                  aria-label={`Suggested term ${candidate.text}`}
                >
                  <label className="candidate-select">
                    <input
                      type="checkbox"
                      checked={selected.includes(key)}
                      onChange={() => toggleSelected(candidate.text)}
                      aria-label={`Select ${candidate.text}`}
                    />
                  </label>
                  <span className="candidate-value">
                    {candidate.text}
                    {candidate.generic && (
                      <span className="chip chip-generic" title="Well-known product or IT phrase — usually safe to publish">
                        common term
                      </span>
                    )}
                    <span className="muted">
                      {candidate.count} occurrence{candidate.count === 1 ? '' : 's'}
                      {!candidate.generic && (
                        <> · map to <code>{suggestion.replacement}</code></>
                      )}
                    </span>
                  </span>
                  <span className="candidate-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-mini"
                      onClick={() => onHideCandidate(candidate.text)}
                    >
                      Hide this session
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-mini"
                      onClick={() => onBuildCloakList([candidate.text])}
                    >
                      Add to a Cloak List
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-mini"
                      aria-label={`Dismiss ${candidate.text}`}
                      title="Dismiss for this session"
                      onClick={() => onDismissCandidate(candidate.text)}
                    >
                      Dismiss
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
