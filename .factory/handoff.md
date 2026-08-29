# Proof Pile verification handoff

## Result

**PASS — candidate `f9b75ab5325bb78509a95013dfe494722cc2b257` is releasable and matches the live product.**

- Work order: `photo-proof-pile-verify-4`
- Independent report: `.factory/verification-4.md`
- Candidate: `f9b75ab5325bb78509a95013dfe494722cc2b257`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Release: <https://github.com/B-Divyesh/sf-photo-proof-pile/releases/tag/v0.1.3>
- Release run: <https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33235123807>
- Verified: 29 August 2026 UTC
- Product code changed by verifier: none

## Findings

- Release blocking: none.
- Major: none.
- Minor: none.
- Operator action: macOS and Windows packages remain unsigned. Add signing
  workflow configuration and provision `APPLE_CERTIFICATE` and
  `WINDOWS_CERT_PFX` when owner certificates are available.

## Verification summary

- The mandatory cold first screen names the job, audience, first action, and
  three plain facts. “Try it with sample data” opens the populated isolated
  demo in one click.
- All 15 commands in `.factory/claims.json` passed separately before broader
  QA.
- `npm ci`, `npm audit`, `npm test` (Rust 7/7, Vitest 7/7, Playwright 21/21),
  `npm run check`, `npm run build`, and `CI=true npm run build:desktop` passed.
- The normal plan/export/import/restore/reset/exit flow passed. Unsafe only-copy
  selection, malformed CSV, legacy CSV, and out-of-root recovery input fail
  safely with specific guidance.
- The prior arbitrary imported-CSV restore, unsupported cross-device wording,
  and mobile OS-label defects are fixed and independently reproduced as fixed.
- The complete photo-review flow sent only same-origin requests. Live normal
  routes had zero console/page errors. Security headers and caching are correct.
- Live axe checks across root, demo, privacy, terms, and 404 in light/dark found
  zero serious/critical findings. Keyboard, focus, 390 px, 200% text, reduced
  motion, and offline service-worker reload passed.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 20 ms, CLS 0, transfer 136 KiB.
- All 27 deployable files match production byte-for-byte. The release source
  differs from the candidate only in this handoff document.
- All nine released package/archive assets pass `SHA256SUMS`. The live Linux
  installer installed and launched the v0.1.3 AppImage. Its SHA-256 is
  `8b14b788b04846a4eedbdb11897f0711d7896c30d936178be264ffdd9dd53f7f`.
- Billing verification allowed 30 successful burst requests; request 31
  returned HTTP 429 with `Retry-After: 4`. Checkout returned 303 to Dodo.

## How to verify

```sh
npm ci
npm test
npm run check
npm run build
CI=true npm run build:desktop
```

For a Linux desktop build, install the packages in
`.github/workflows/release.yml`; minimal containers also need `file`.

## Known gaps and operator action

- Native packages are unsigned. Signing/notarization needs the owner's macOS
  and Windows certificates. Configure the workflow for
  `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX`; store them as repository secrets,
  never in source.
- Decision logs from v0.1.1 or earlier have no full quarantine hash and are
  intentionally rejected for automatic recovery. Those files can be moved
  back manually.
- There is no analytics, telemetry, updater, backend, sign-in, or AI runtime.

Ignored local screenshots, request logs, deployment hashes, and Lighthouse
JSON are in `.factory/evidence/verification-4/`.
