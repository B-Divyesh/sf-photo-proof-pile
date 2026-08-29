# Proof Pile verification 6 handoff

## Result: PASS

Candidate `d8665cbbbff21ffeaa41413a0647f7bc23129c2f` was independently
verified against <https://photo-proof-pile.sociobot.in> on 29 August 2026 UTC.
The first-read/demo gates, all 19 claim commands, full test/check suite, exact
web and desktop builds, end-to-end recovery workflow, privacy, accessibility,
mobile, offline, performance, billing throttling, release assets, and live
deployment identity pass. No product code was changed.

The full evidence-backed report is `.factory/verification-6.md`.

## Defects by severity

- S1 / release blocking: none.
- S2 / major: none.
- S3 / minor: `public/404.html:39` displays stale footer version `v0.1.4`;
  the candidate, normal routes, and published release are `v0.1.5`.
- Operator action: release packages remain intentionally unsigned. macOS
  notarization and Windows Authenticode require owner-held signing material.

## Verification summary

- Mandatory first-read passes at desktop and 390 px, with a visible one-click
  “Try it with sample data” action.
- All 19 commands in `.factory/claims.json` pass after `npm ci`.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- `npm test`: 9 Rust, 8 Vitest, and 24 Playwright tests pass.
- `npm run check`: TypeScript, Rust format, and strict Clippy pass.
- `npm run build`: `dist/site` produced; initial JS 13.11 kB gzip, CSS 5.08
  kB gzip, hero 29,922 bytes.
- `CI=true npm run build:desktop`: DEB, RPM, and AppImage produced after
  installing the release workflow's system prerequisites.
- Live full demo: 22 same-origin requests, zero off-origin requests, zero
  console/page/request errors; normal, cancellation, invalid CSV, import,
  restore, reset, exit, and repeated-plan paths pass.
- Axe: zero violations on all routes in light and dark modes and on the 390 px
  demo. Keyboard decision focus, visible focus, 44 px targets, 200% text,
  reduced motion, and offline reload pass.
- Billing: 30 successful verification requests per observed burst; requests
  31–45 returned 429 and all included `Retry-After`.
- Lighthouse mobile runs: Performance 98/99/97; Accessibility, Best Practices,
  and SEO 100/100/100 each; LCP 1.12–1.35 s, median TBT 157 ms, CLS 0.
- Deployment: all 27 deployable candidate files match live byte-for-byte.
- Release `v0.1.5`: 11 assets; all nine packaged artifacts pass published
  SHA-256 checks. The live installer verifies the AppImage, whose SHA-256 is
  `26098423aeee79d5472fc0d6cf0ced1c30c2f1ef738167b0505d4fb1e5ab713a`;
  the installed app passed a 15-second Xvfb smoke run.

## Reproduce

```sh
npm ci
npm audit --audit-level=high
npm test
npm run check
npm run build
CI=true npm run build:desktop
```

Ignored runtime logs, screenshots, request traces, Lighthouse JSON, header
captures, checksum output, and comparison results are in
`.factory/evidence/verification-6/`.
