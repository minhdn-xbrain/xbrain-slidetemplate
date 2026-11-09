import React from 'react';

export const AgentConsoleView: React.FC = () => {
  return (
    <main
      id="v1-agent-console"
      className="v1-agent-console"
      data-testid="xb-agent-console"
      data-mode="agent"
      hidden
    >
      <header className="v1-agent-header">
        <div>
          <h1>XBrain / AI Console</h1>
          <p>Structured JSON workflow · trusted author content · native rendering</p>
        </div>
        <div className="v1-agent-toolbar">
          <button type="button" data-v1-agent-action="close">
            Studio
          </button>
        </div>
      </header>
      <div className="v1-agent-body">
        <div className="v1-agent-status">
          <span data-testid="xb-agent-ready" data-state="initializing" role="status">
            Initializing
          </span>
          <span>
            Candidate: <strong data-testid="xb-agent-revision">none</strong>
          </span>
          <span data-testid="xb-agent-candidate-status" data-state="empty" role="status">
            Candidate state: empty
          </span>
          <span data-testid="xb-agent-studio-status" data-state="aligned" role="status">
            Studio: <strong data-testid="xb-agent-studio-revision">none</strong> · aligned
          </span>
          <span data-testid="xb-agent-qa-summary" role="status">
            QA: not measured
          </span>
          <span data-testid="xb-agent-brand-summary" data-state="unavailable" role="status">
            Brand QA: pending
          </span>
        </div>
        <div className="v1-agent-toolbar mb-[14px]">
          <button
            type="button"
            className="v1-agent-primary"
            data-v1-agent-action="validate"
            data-testid="xb-agent-validate"
          >
            Validate
          </button>
          <label htmlFor="v1-agent-render-scope">Slides</label>
          <select id="v1-agent-render-scope" data-testid="xb-agent-render-scope">
            <option value="all">All</option>
            <option value="selected">Selected</option>
          </select>
          <button type="button" data-v1-agent-action="render" data-testid="xb-agent-render">
            Render and measure
          </button>
          <button type="button" data-v1-agent-action="cancel" data-testid="xb-agent-cancel">
            Cancel render
          </button>
          <button type="button" data-v1-agent-action="inspect" data-testid="xb-agent-inspect">
            Inspect QA
          </button>
          <button type="button" data-v1-agent-action="diff" data-testid="xb-agent-diff">
            Diff vs Studio
          </button>
          <button type="button" data-v1-agent-action="rebase" data-testid="xb-agent-rebase">
            Rebase on Studio
          </button>
          <button type="button" data-v1-agent-action="propose" data-testid="xb-agent-propose-repair">
            Propose repair
          </button>
          <button type="button" data-v1-agent-action="accept" data-testid="xb-agent-accept-repair">
            Accept repair
          </button>
          <button type="button" data-v1-agent-action="commit" data-testid="xb-agent-commit">
            Commit to Studio
          </button>
          <button type="button" data-v1-agent-action="export" data-testid="xb-agent-export-static">
            Export static HTML
          </button>
          <button
            type="button"
            data-v1-agent-action="export-reviewed"
            data-testid="xb-agent-export-reviewed"
          >
            Export reviewed HTML
          </button>
          <button type="button" data-v1-agent-action="export-json" data-testid="xb-agent-export-json">
            Export JSON
          </button>
          <button
            type="button"
            data-v1-agent-action="export-images"
            data-testid="xb-agent-export-images"
          >
            Export 1920×1080 PNGs
          </button>
          <button type="button" data-v1-agent-action="download" data-testid="xb-agent-download">
            Download artifact
          </button>
        </div>
        <div className="v1-agent-grid">
          <section className="v1-agent-panel">
            <h2>Deck structure</h2>
            <ol
              className="v1-agent-tree"
              data-testid="xb-agent-deck-tree"
              role="tree"
              aria-label="Candidate slides"
            />
            <button
              type="button"
              data-v1-agent-action="more"
              data-testid="xb-agent-more-slides"
              hidden
            >
              Show more slides
            </button>
          </section>
          <section className="v1-agent-panel">
            <h2>Rendered preview</h2>
            <div
              className="v1-agent-preview"
              data-testid="xb-agent-preview"
              role="region"
              aria-label="Rendered slide preview"
            >
              <iframe title="Slide preview" />
              <div className="v1-agent-highlight" data-testid="xb-agent-highlight" aria-hidden="true" hidden />
            </div>
            <p data-testid="xb-agent-preview-status">Visual review is performed externally.</p>
          </section>
          <section className="v1-agent-panel">
            <h2>QA inspector</h2>
            <div
              className="v1-agent-findings"
              data-testid="xb-agent-findings"
              aria-label="QA findings"
            >
              No run yet.
            </div>
          </section>
        </div>
        <section className="v1-agent-section">
          <h2>Data actions</h2>
          <div className="v1-agent-inputs">
            <div>
              <label htmlFor="v1-agent-deck-input">Candidate document JSON</label>
              <textarea
                id="v1-agent-deck-input"
                data-testid="xb-agent-deck-input"
                spellCheck={false}
              />
              <div className="v1-agent-buttons">
                <button type="button" data-v1-agent-action="load" data-testid="xb-agent-load-candidate">
                  Load candidate
                </button>
                <button type="button" data-v1-agent-action="sync" data-testid="xb-agent-sync-studio">
                  Copy Studio to candidate
                </button>
                <button type="button" data-v1-agent-action="reset" data-testid="xb-agent-reset">
                  Reset candidate
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="v1-agent-patch-input">JSON Patch operations</label>
              <textarea
                id="v1-agent-patch-input"
                data-testid="xb-agent-patch-input"
                spellCheck={false}
                defaultValue="[]"
              />
              <label htmlFor="v1-agent-scope">Optional scope JSON</label>
              <input
                id="v1-agent-scope"
                data-testid="xb-agent-scope"
                type="text"
                placeholder='{"slideId":"...","sourcePath":"/slides/0"}'
              />
              <div className="v1-agent-buttons">
                <button
                  type="button"
                  data-v1-agent-action="preview-patch"
                  data-testid="xb-agent-patch-preview"
                >
                  Dry run
                </button>
                <button
                  type="button"
                  data-v1-agent-action="apply-patch"
                  data-testid="xb-agent-apply-patch"
                >
                  Apply patch
                </button>
              </div>
              <label>
                <input
                  id="v1-agent-accept-deck"
                  data-testid="xb-agent-accept-deck"
                  type="checkbox"
                />{' '}
                Allow proposed repair to expand to deck scope
              </label>
            </div>
          </div>
        </section>
        <section className="v1-agent-section">
          <h2>Response</h2>
          <div className="v1-agent-buttons">
            <button type="button" data-v1-agent-action="state">
              Show status JSON
            </button>
            <button type="button" data-v1-agent-action="candidate">
              Show candidate JSON
            </button>
            <button type="button" data-v1-agent-action="copy-response">
              Copy response
            </button>
            <button type="button" data-v1-agent-action="artifact">
              Show artifact text
            </button>
          </div>
          <pre
            className="v1-agent-output"
            data-testid="xb-agent-response-json"
            aria-live="polite"
          >
            Ready for an action.
          </pre>
        </section>
        <section className="v1-agent-section">
          <h2>External visual review</h2>
          <p>Record a review only after inspecting screenshots outside XBrain.</p>
          <label htmlFor="v1-agent-review-evidence">Screenshot evidence reference</label>
          <input
            id="v1-agent-review-evidence"
            data-testid="xb-agent-review-evidence"
            type="text"
            maxLength={500}
          />
          <button type="button" data-v1-agent-action="review" data-testid="xb-agent-mark-reviewed">
            Record external review
          </button>
        </section>
        <section className="v1-agent-section">
          <h2>Execution log</h2>
          <div className="v1-agent-buttons">
            <label htmlFor="v1-agent-log-filter">Filter</label>
            <select id="v1-agent-log-filter" data-testid="xb-agent-log-filter">
              <option value="all">All</option>
              <option value="error">Errors</option>
              <option value="success">Success</option>
            </select>
            <button type="button" data-v1-agent-action="clear-log">
              Clear log
            </button>
          </div>
          <pre
            className="v1-agent-log"
            data-testid="xb-agent-execution-log"
            role="log"
            aria-live="polite"
          />
        </section>
      </div>
    </main>
  );
};
