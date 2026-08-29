# Proof Pile polish round 2 handoff

## Result

The cumulative repair is live at <https://photo-proof-pile.sociobot.in>.
First-screen copy, demo isolation, claims, native safety, routing, metadata,
legal pages, 404, mobile layout, offline use, accessibility, privacy, and
performance checks pass.

Functional repair commit: `419957b`

Release: `v0.1.8`

Static deployment: `14bbb7d7-1b38-4e0f-847f-fcad14fd9db4`

The complete finding map is `.factory/polish-2.md`.

## What changed

- Closed review-2's 404 version, daily license boundary, refund link,
  provenance copy, and installer wording findings.
- Reverified every review-1 fix, including `?demo=1` isolation, complete
  evidence tests, route metadata, scroll restoration, the shared 404 shell,
  terminology, and mobile controls.
- Removed an untested social metadata claim and replaced metaphorical 404 copy.
- Added Windows Authenticode and macOS signing/notarization paths with
  post-build verification when owner credentials exist.
- Updated the catalog description to an 85-character verb-first sentence.

## Exact verification

```sh
npm ci
npm test
npm run check
npm run build
```

Results on 29 August 2026:

- Rust: 9 passed.
- Vitest: 9 passed.
- Playwright: 24 passed, including keyboard, phone, 200% text, offline,
  light/dark axe, privacy, routing, and claims.
- All 19 exact `.factory/claims.json` commands passed from a fresh clone.
- Build: `dist/site`; initial JS 13.12 kB gzip; CSS 5.10 kB gzip.
- Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.1 s; CLS 0; 137 KiB total transfer.
- Cold production: `/`, `/demo`, `/?demo=1`, `/app`, `/privacy`, and `/terms`
  returned 200; `/missing-frame` returned 404.
- Cold demo edit/reset/exit changed only
  `demo:photo-proof-pile:session`; the real review stayed byte-for-byte intact.
- Offline `/demo` reload passed. Light/dark axe found zero serious or critical
  violations. Browser and verifier logs contained zero console errors.

Evidence:

- `.factory/evidence/polish-2/screenshot-desktop.png`
- `.factory/evidence/polish-2/screenshot-mobile.png`
- `.factory/evidence/polish-2/live-demo-mobile.png`
- `.factory/evidence/polish-2/live-404-mobile.png`
- `.factory/evidence/polish-2/verify.json`
- `.factory/evidence/polish-2/lighthouse.json`

## Release and deployment

```sh
npm run build:site
/opt/fleet/lib/deploy-static.sh photo-proof-pile dist/site
```

The desktop workflow builds macOS arm64/x86_64, Windows x64, and Linux x64,
then publishes `SHA256SUMS` and `latest.json`.

## Needs operator action

Trusted signing cannot finish inside this work order because the repository
has no Apple or Windows signing secrets. The workflow expects:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`
- `WINDOWS_CERT_PFX`
- `WINDOWS_CERTIFICATE_PASSWORD`

Until those owner-held values are added, macOS and Windows packages remain
unsigned and the site states that limitation. No key is committed.

## Known gaps

- F-1-34/F-2-2 requires the credentials above and a replacement
  signed/notarized release. No code, site, privacy, accessibility, or
  performance gap remains from the cumulative reports.
