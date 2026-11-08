# Agent Console baseline and verification

Historical baseline: after this report, the user requested trusted author content and removal of Agent sandbox/CSP restrictions. See the current [API reference](../../agent-console-api.md) for the revised behavior.

The implementation adds `window.XB.agent` and a click-only AI Console to the existing single-file application. Candidate data stays separate from Studio. Strict commit and static export require a fresh, full-deck browser measurement and the relevant security and quality checks. See the [API reference](../../agent-console-api.md) and [browser runbook](../../agent-console-browser-runbook.md).

## Baseline and identity

- Starting Git revision: `9f1e74430e1c51e953e0668137023338863f54ef`.
- Original `index.html` SHA-256: `5d7ee262a75fd3eecc8ae99f952333038905a5b00cbf2d87cc656ebf489537d6`.
- Tested `index.html` SHA-256: `299a1131b96d6f55d7ab3c913b2094d5ad77ba0035046bcd73278b25f419ce0c`.
- Before and after, CLI contract SHA-256 is `26e59171bd88107cfc1e6169985d95c16d5a0bb708ba472fc149dba355651d84`; derived schema SHA-256 is `20bd00de918e26a937e7aac964401d465ecc03a741e5892daf86b207a1627415` and matches the committed schema.
- Release remains `1.0.0`; document schema remains `1.0`. The runtime deploy artifact is `index.html`; tests and documentation are development artifacts.

## Verification

Environment: Chrome for Testing `156.0.8078.4`, Playwright Core, 1366 × 768 viewport unless a test changes it, external requests blocked, offline system-font fallback. HTTPS uses a temporary self-signed local certificate with certificate verification disabled in the test context. The browser and its shared libraries were supplied outside the repository.

- `python3 -m unittest discover -s tests -p 'test_*.py'` with `CHROME_PATH`: **79 tests passed, no skips**. Without a browser configured, two browser-dependent tests are skipped.
- All agent browser test scripts other than the separately run benchmark and stress scripts passed; see [agent suite log](xbrain-agent-suite.log). Tests cover API discovery, version/resource guards, escaped JSON Pointers, atomicity, CAS races and reset, cloned results, strict/untrusted rendering, partial/stale/profile-mismatched QA, cancellation, source mapping, repair, preservation, security, artifacts, commit rollback and undo/redo, session isolation, and a 400-item lazy Console tree.
- The 12-slide JS workflow validates, renders, inspects, patches, rerenders and exports. The click-only 12-slide workflow passed over local HTTP, local HTTPS and `file://`, with external requests blocked. It reads the contract, tests partial-run export rejection, applies a scoped patch, rerenders, downloads and reopens the script-free HTML. A separate click-only test verifies scoped repair and explicit deck-scope escalation.
- Strict QA rejected executable markup, forged provenance attributes, author styles that hide content, unrendered child components, external image failures and enhanced-only Mermaid output. An inline PNG passed and reopened offline. A simulated font-settle timeout was reported and blocked strict export. The tests check that untrusted code did not execute, attacker URLs did not reach the request handler, and tampering with returned QA/repair objects did not change internal decisions.
- A synthetic 10-component overflow fixture mapped at least 9 of 10 component paths; a nested child was also mapped. Ambiguous/legacy findings fall back to slide scope. The test does not establish this rate across every component or layout.
- Existing `browser_header.mjs`, `browser_improvements.mjs` and `browser_agent_engine.mjs` passed, covering Studio menus, Gallery, edit/history, import/version rejection, print, offline render and reopening editable HTML. Header screenshots at 1440 and 1366 widths match the original byte for byte. [Header results](xbrain-final-header.json) and [Studio results](xbrain-final-improvements.json) are retained.
- The required CLI sequence `repair → qa --browser --offline → build --offline` passed on `qbr-deck.json`: 12 slides, zero errors/warnings and browser measurement completed. [QA report](xbrain-qbr-qa.json).
- External browser screenshots: [Console](xbrain-agent-console-http.png) and [slide preview](xbrain-agent-preview-http.png). They show the test fixture and are evidence of the rendered UI, not an automated visual-quality judgment.

## Capacity sample

The reproducible benchmark uses the QBR fixture repeated to the requested slide count. The baseline measures compiler-only work; the new path includes candidate ingestion, compilation and full browser measurement, so the columns are different workloads and are not a speed comparison. The measurements are one local sample, not a performance guarantee.

| Slides | Baseline compiler only | Agent full browser run | Agent renderer heap after run |
| ---: | ---: | ---: | ---: |
| 12 | 38 ms | 278 ms | 6.1 MB |
| 50 | 70 ms | 754 ms | 9.8 MB |
| 100 | 118 ms | 1,514 ms | 7.8 MB |
| 400 | 316 ms | 5,766 ms | 10.3 MB |

Raw samples: [baseline](xbrain-benchmark-baseline.json), [agent](xbrain-benchmark-final.json). A separate [20-cycle render/repair-proposal/patch stress sample](xbrain-stress-final.json) retained only bounded runs; renderer heap after forced GC rose from 1.94 MB to 2.88 MB. This is a spot measurement, not proof of absence of leaks or a 100-cycle soak test.

## Remaining limits

- Only the stated Chromium build was exercised. Local HTTPS used a test certificate; no public hosting, production TLS configuration or online CDN fidelity audit was performed.
- The safety policy is deliberately conservative: raw HTML/SVG, author CSS and component styles are preview-only for agent strict output; Studio commit also rejects external asset fields and other potentially active constructs. Some harmless documents require a declarative rewrite.
- Repair preserves the tested list and nested transformed-table cases. The preservation audit cannot infer business meaning, and rejects proposals when it cannot resolve or verify transformed rows and headers. An author or external agent must decide those cases.
- Geometry QA is not computer vision. Font substitution, overlay/occlusion and design quality still require external screenshot review; an `agent-reported` review is not independently verified.
- No independent security audit, cross-browser matrix or 100-cycle memory soak was completed. The existing third-party Studio CDN scripts still execute with page privileges when online; the isolated agent preview itself blocks external requests. This report does not certify every release gate in the design plan.
