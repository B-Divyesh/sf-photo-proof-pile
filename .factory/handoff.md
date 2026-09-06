# Proof Pile — repair 22 handoff

## Result

**PASS — production now serves the reviewed desktop release.**

- Implementation release: `v0.1.30` at
  `b12d5727de44d71c91b4a496eece320e7247a853`
- Documentation commit before this repair: `1d73afa0e47256a4d2fdcfc1a57a67d16a285b2e`
- Production URL: <https://photo-proof-pile.sociobot.in>

The repair was a production static-site deployment only. No product code,
release assets, app settings, or infrastructure configuration changed. The
site was rebuilt through `npm run build`, which reconstructs the immutable
release source and stamps every release-sensitive file, then deployed to the
existing `sf-photo-proof-pile` production Static Web App.

## What is live

- Footer source link targets `b12d5727…`; its release version is `v0.1.30`.
- The desktop dialog requests GitHub release `v0.1.30` and exposes four
  platform choices: macOS Apple silicon, macOS Intel, Windows, and Linux.
- Both one-line installers require `v0.1.30` and `b12d5727…`.
- The designed 404 is present and the service worker cache is
  `proof-pile-v0.1.30`.
- All 27 served files matched the verified local `dist/site` build byte for
  byte after deployment.

## Verification

- `npm ci` completed from the documented setup.
- All 25 exact commands in `.factory/claims.json` completed from that clean
  dependency install; `CI=1 npm test` also passed (11 Rust, 22 unit, and 37
  browser tests).
- `CI=1 npm run check` passed. `npm run build` reconstructed and verified
  `v0.1.30`, including the complete public package matrix and manifest.
- Fresh live desktop and 390 px phone checks passed: first-read text, one-click
  sample, persistent sample label, realistic 3-group/8-file output, reset,
  real-data isolation, invalid-import recovery, keyboard, focus, routes,
  reduced motion, offline reload, privacy requests, and designed 404.
- Ten live Axe scans (five routes in light and dark) found no serious or
  critical violations and the browser run recorded no unexpected console
  errors. The fresh offline cache was `proof-pile-v0.1.30` and reloaded the
  demo with HTTP 200.
- Fresh mobile Lighthouse scores were Performance 100, Accessibility 100,
  Best Practices 100, and SEO 100 (FCP 1.0 s, LCP 1.1 s, CLS 0). The supplied
  headless Chromium reported a post-report tab-cleanup crash after writing the
  complete JSON report; this did not affect the completed browser or Axe run.
- The live release dialog showed four immutable `v0.1.30` package links.
  The public Linux AppImage checksum and clean Xvfb consumer smoke remain
  valid evidence from Verification 28; the immutable release was not rebuilt.

## How to run and deploy

```sh
npm ci
npm test
npm run check
npm run build
```

`npm run build` is the production-only build: it derives `dist/site` from the
release identity in `scripts/production-release.env` and rejects mismatched
installers, release metadata, 404, service worker, or package matrix. Deploy
that directory only after the same verification succeeds.

## Known limitations

macOS packages lack Developer ID signing and Windows packages are Authenticode
NotSigned. This is disclosed on the site and in the README; buyers should
verify SHA-256 values before opening a package. Signing certificates remain an
operator-provided dependency. The US$29 hosted Sociobot checkout and license
registration remain owned by the billing-registration operator.
