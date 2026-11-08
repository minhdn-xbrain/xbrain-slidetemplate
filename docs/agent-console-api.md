# XBrain Agent API `agent.1`

`index.html` contains Studio, the compiler and the AI Console. Open it directly or serve it from a static host. The API is `window.XB.agent`; it does not provide an LLM, a backend or shared state. The existing `window.XB` API remains available. Candidate documents, revisions, runs, proposals, artifacts and logs live in the current page session only.

## Workflow

All operations except `subscribe` return a promise of a JSON-compatible envelope. `ok` reports whether the operation ran; inspect `validation.valid` or `qa.passed` for document quality. `revision` is an opaque session token, not a cryptographic hash. `error.code`, `error.retryable` and optional `error.details` provide machine-readable failure information.

```js
const agent = window.XB.agent;
await agent.ready();
const state = await agent.getState();
const created = await agent.setCandidate({document: deck, baseRevision: state.data.candidateRevision});
if (!created.ok) throw new Error(created.error.code);
const check = await agent.validate({revision: created.revision});
if (!check.ok || !check.data.validation.valid) throw new Error('Fix diagnostics first');
const run = await agent.render({revision: created.revision});
if (!run.ok) throw new Error(run.error.code);
const inspection = await agent.inspect({runId: run.data.runId});
if (!inspection.data.qa.passed) throw new Error('Fix findings and render again');
const output = await agent.exportArtifact({revision: created.revision, format: 'static-html', qaRunId: run.data.runId});
if (!output.ok) throw new Error(output.error.code);
const html = await agent.getArtifact({artifactId: output.data.artifactId});
```

Use an external browser tool to inspect screenshots. Geometry QA does not assess visual taste or fidelity. An agent that has actually reviewed its screenshot can call `markVisualReview({runId, status:'approved', reviewer, evidence})`; the result is labelled `agent-reported`, not independently verified. `agent-strict-reviewed` export requires both strict QA and that explicit report.

## Methods

| Method | Purpose |
| --- | --- |
| `ready()`, `capabilities({detail})`, `getSchema()`, `getContract()` | Boot readiness, feature discovery and the live compiler contract. `detail:'full'` embeds the contract. `xb-agent-ready` fires once after Studio boot. |
| `getState()`, `getDeck({source})` | Session and cloned candidate/Studio document. The default source is the candidate when present. `hasCandidate` distinguishes an empty candidate from its reset revision. |
| `setCandidate({document,baseRevision})` | Store a canonical version `1.0` object as isolated data; compiler diagnostics and ID normalization suggestions are returned without changing Studio. |
| `syncFromStudio({baseRevision,expectedStudioRevision})`, `resetCandidate({baseRevision})` | Explicit replacement or reset. Reset creates a new empty-state revision: use it as the next `baseRevision`, rather than reusing `null`. |
| `previewPatch({baseRevision,operations,scope})`, `applyPatch(...)` | Apply the same guards and patch engine. Preview does not mutate. Supported operations are `add`, `remove`, `replace`, `test`; `move` and `copy` return `PATCH_OP_UNSUPPORTED`. Paths use JSON Pointer escaping. Scope uses `{slideId,sourcePath}`. |
| `validate({revision})`, `render({revision,slides,profile})`, `inspect({runId,slideId})`, `getRun({runId})` | Strict/trusted compile and browser measurement. `slides` optionally selects zero-based indexes or slide IDs; subset runs cannot pass the export gate. `getPreview({runId,slide})` returns the authored HTML for browser preview. |
| `cancel({runId})` | Request cancellation between measurement batches. It cannot interrupt synchronous compilation or an in-progress batch; `getState().data.activeRunId` exposes the active job. |
| `proposeRepair({baseRevision,scope})`, `acceptRepair({proposalId,baseRevision,acceptScope})` | Review deterministic changes before applying. Scope escalation requires `acceptScope:'deck'`. A repair with unverified preservation is rejected. At most three proposals are allowed per candidate lineage until an explicit patch or replacement. |
| `getPreservationReport({fromRevision,toRevision})` | Conservative ordered-business-atom comparison for retained snapshots; it is not an independent proof of all semantic relationships. |
| `commitCandidate({baseRevision,expectedStudioRevision,qaRunId})` | Require dual revision checks, full strict QA. A successful commit creates one Studio undo step. |
| `exportArtifact({revision,format,profile,qaRunId})`, `getArtifact({artifactId})`, `downloadArtifact({artifactId})` | Export JSON or static HTML, preserving author markup and scripts. Strict is the default; draft export is available only for JSON. `getArtifact` marks historical output `fresh:false`; direct download rejects it after a candidate or Studio change. Download may require a browser user gesture. Editable HTML and PDF bytes are not exposed by this agent API. |
| `getLogs({after,limit})`, `clearLogs()`, `subscribe(handler)` | Bounded operation log without deck payloads. `subscribe` returns an unsubscribe function synchronously. |

Mutation calls require an explicit `baseRevision`; initially it is `null`. On `REVISION_CONFLICT`, read state and rebase rather than replaying blindly. A Studio edit or undo/redo makes the candidate diverge and makes its previous run stale. `syncFromStudio` is explicit and replaces the candidate; no patch automatically commits it.

## Quality and author content

Agent preview, browser measurement, export and Studio commit use trusted author content. HTML, SVG, CSS, JavaScript, URLs and external media are available according to the browser; authored scripts run with the page's privileges. CSS in trusted documents is preserved without slide scoping. The compiler and CLI also default to trusted; the CLI supports `--untrusted` as an optional restricted mode.

Strict export and commit require a matching fresh full-deck browser run, completed measurement, ready fonts, no error diagnostics and no blocking geometry or content findings. External image failures are reported in the asset status but do not alone block export. Enhanced-only output such as Mermaid source cannot pass strict QA. `QA_NOT_MEASURED`, `QA_STALE` and `QA_GATE_FAILED` are separate failures. HTML output includes the application CSS and sprite; external references remain references and optional fonts fall back offline.

Browser measurements run in batches in an iframe. Where a Composer wrapper can be matched to its source tree, findings carry a component path and 1920×1080 bounds. Ambiguous and legacy findings fall back to slide-level paths. Bounds are geometry evidence, not visual judgment.

Automatic repair uses the existing compiler and never silently accepts a proposal. Preservation checks compare ordered business values and, for pagination, resolve table data with the compiler and compare post-transform rows, order and headers against the fragments. If the comparison cannot be completed—for example, a referenced dataset is missing—the proposal is marked unverified and cannot be accepted. These checks do not infer business meaning; explicit agent patches remain the route for cases requiring author judgment. Revalidate and remeasure after every change.

Input limits are 10 MiB JSON, 200,000 nodes, 64 levels, 1–400 slides and 256 patch operations. Compiled output is limited to 1,048,576 UTF-16 code units per slide and 33,554,432 in total; measurement batches contain at most five slides, 1,048,576 code units of slide markup and 30,000 DOM nodes. A limit failure is reported rather than truncating the deck. Runs, proposals and artifacts are bounded to three each; four candidate snapshots and 200 log entries are retained. These are in-memory session limits, not a shared repository. A synchronous compiler call runs on the page's main thread and cannot be forcibly stopped. Font timeouts block strict output; image and media status is reported for inspection.
