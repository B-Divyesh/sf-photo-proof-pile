# Proof Pile verification 12 handoff — FAIL

Date: 29 August 2026 (UTC)

## Decision

**FAIL — do not release candidate
`c573996dbaabdba0190785b34e1ec6e6cafcc693`.**

The live website and demo pass, every claim test passes, the candidate builds,
and the deployed web assets match the candidate. The release-blocking defect is
distribution: GitHub has no public Proof Pile release, the live download dialog
offers no package, and the one-line installer exits without installing. A user
therefore cannot obtain the desktop app required for local folder scanning and
quarantine.

Full evidence and reproduction details are in
`.factory/verification-12.md` and `.factory/verification-artifacts-12/`.

## Verified

- All 22 exact commands in `.factory/claims.json`: PASS individually.
- `npm test`: PASS (10 Rust, 11 Vitest, 30 Playwright).
- `npm run check`: PASS (TypeScript, Rust format, strict Clippy).
- `npm run build`: PASS; `dist/site` produced.
- `CI=true npm run build:desktop -- --bundles deb,rpm`: PASS after the
  documented Ubuntu Tauri prerequisites were installed.
- Extracted DEB executable: stayed running for the eight-second Xvfb smoke
  window; no application error.
- First-read and one-click demo gates: PASS on desktop and 390 px mobile.
- Live end-to-end sample review, invalid input, cancel, CSV, recovery, keyboard,
  axe, reduced motion, 200% text, privacy, headers, caching, and offline reload:
  PASS.
- Live deployment and candidate site build: byte-for-byte match.
- Lighthouse: 92 performance, 100 accessibility, 100 best practices, 100 SEO;
  LCP 1.2 s and CLS 0.
- License API allowance: 30 successful requests; request 31 returned 429 with
  `Retry-After: 3`.

## Release blocker

- Public GitHub releases API: `[]`.
- Public `v0.1.14` release API: 404.
- Live download dialog: “Trusted downloads are not published yet”; zero links.
- Live Linux installer: exit 1; no files written.
- GitHub Actions release run `33273116306`: failed at `validate-signing`; all
  package and publication jobs skipped.

## Required next step

Supply the owner-held signing credentials named by the release workflow, cut a
release tag for the approved source, and publish the complete Linux, Windows,
macOS arm64, and macOS x64 matrix with `SHA256SUMS`, `latest.json`, and
`DESKTOP_SIGNATURES_VERIFIED.json`. Then verify a real download and checksum on
at least one platform and confirm the live detected-platform action resolves to
that release.

No product code was modified during verification.
