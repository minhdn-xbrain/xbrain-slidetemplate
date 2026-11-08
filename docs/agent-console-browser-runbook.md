# Browser agent runbook

The application can be copied as a single `index.html` to a static host or opened over `file://`. Agent preview uses trusted author content: scripts run with page privileges, and external resources load according to the browser. Optional fonts and Studio CDN enhancements have offline fallbacks.

## JavaScript-enabled browser agent

1. Open the page, wait for `XB.agent.ready()` and discover capabilities/contract.
2. Read `getState()`. Load a version `1.0` document with its current `candidateRevision` as `baseRevision`; keep the returned revision.
3. `validate`, then `render` and `inspect` that revision. Use `getPreview` or open AI Console, select the slide and take screenshots with the browser tool. The in-page API does not return PNG or evaluate visual quality.
4. Patch with `previewPatch` and `applyPatch`, or review a repair proposal. Re-render all slides after every change. Check `qa.passed`, `gateReasons`, `measurement` and `fresh` before export.
5. Call strict `exportArtifact` and then `getArtifact` or `downloadArtifact` with a user gesture. For Studio commit supply both the candidate revision and the Studio revision captured when the candidate was loaded. Handle conflicts by reading state and deliberately rebasing or syncing.

See [API reference](agent-console-api.md) for the complete signatures, limits and policy.

## Click-only browser agent

1. Open **AI / JSON → AI Console** and wait for `data-testid="xb-agent-ready"` to report `data-state="ready"`.
2. Paste a document into `xb-agent-deck-input` and click `xb-agent-load-candidate`. Read `xb-agent-response-json` for the result and revision.
3. Click `xb-agent-validate`, then `xb-agent-render` and `xb-agent-inspect`. Select a slide in `xb-agent-deck-tree` and screenshot `xb-agent-preview` using the browser tool. Findings can focus the corresponding slide; a bounds overlay appears when measured bounds are available. The render selector permits a single-slide debug run, which cannot pass strict export.
4. Paste a JSON Patch array in `xb-agent-patch-input`, optionally add a `{slideId,sourcePath}` object in `xb-agent-scope`, click `xb-agent-patch-preview` then `xb-agent-apply-patch`, and rerun the whole deck. A scoped repair that expands outside that scope needs the explicit deck-scope checkbox before acceptance.
5. After a passing QA status, click `xb-agent-export-static` or `xb-agent-export-json`, then `xb-agent-download`. The read-only response also exposes artifact IDs and the **Show artifact text** action. The Studio button returns to the editor without committing the candidate.

The review field records an external agent's reported screenshot evidence; XBrain does not verify the screenshot. The source, preview, findings and log are displayed as text or authored HTML. Downloads and clipboard access depend on browser permissions and user activation.

## Troubleshooting

- `REVISION_CONFLICT`: fetch state and rebase; Studio and candidate have separate revisions.
- `QA_NOT_MEASURED`: render all slides in a functioning browser, then check font/asset status.
- `QA_STALE`: the candidate or Studio changed after the run; render again.
- `QA_GATE_FAILED`: inspect blocking errors, truncation and geometry findings.
- `PRESERVATION_UNVERIFIED`: inspect the proposal and prepare an explicit author-reviewed patch; the conservative automatic repair gate cannot prove that transformation safe.
- `DOWNLOAD_BLOCKED`: retrieve artifact text via the API or click Download in the Console.
