# Proof Pile handoff

## What was built

- A Tauri 2 desktop app with a Vite and TypeScript interface.
- Local recursive scanning for JPEG, PNG, WebP, GIF, TIFF, and BMP files.
- SHA-256 exact matching, 64-bit visual difference hashes, and EXIF same-minute grouping.
- Evidence rows for paths, dimensions, bytes, capture dates, cameras, hashes, and other selected drives.
- A review-first quarantine plan with confirmation, collision-safe moves, cross-drive copies, date preservation, rollback on a failed batch, and restore.
- A portable CSV decision and move log.
- A separate one-click demo with eight records across three realistic groups.
- A US$29 one-time license flow through the Sociobot billing API. The license removes the 1,000-file scan limit.
- A responsive static product site with legal pages, offline support, release downloads, and three real app walkthrough frames.
- Original generative hero art and hand-authored sample illustrations. Provenance is in `.factory/design.md`.
- A GitHub Actions matrix for unsigned macOS arm64/x86_64, Windows, and Linux bundles, plus `SHA256SUMS` and `latest.json`.

## How to run

```sh
npm ci
npm run dev
npm run dev:desktop
```

The demo URL is `/demo`. The production site build command is `npm run build:site`, and its output root is `dist/site`.

## Verification completed

- `npm test`: passed.
  - Rust: 3 passed, including a real 1,001-image free-limit scan and quarantine/restore.
  - Vitest: 3 passed.
  - Playwright: 11 passed across claims, mobile layout, routing, console, and axe checks.
- `npm run build`: passed; `dist/site/index.html` exists.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ .factory/evidence`: passed with no console errors, one h1, one main landmark, `lang`, title, and complete alt text.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100.
- Lab metrics: LCP 1.4 s, CLS 0, total blocking time 60 ms, speed index 0.9 s.
- Initial app JavaScript: 28.53 KB raw and 10.51 KB gzip. CSS: 17.28 KB raw and 4.85 KB gzip. Hero WebP: 29.92 KB.
- JSON, shell syntax, workflow YAML, and `git diff --check`: passed.

Local desktop core tests run without GUI libraries. The full Linux desktop bundle was not built in this container because GLib/WebKitGTK development packages are absent. The release workflow installs those packages before Tauri builds.

## Known gaps

- HEIC and camera RAW formats are not decoded in v0.1. The scanner reports unreadable files as skipped.
- “Same moment” currently means matching EXIF capture minute and dimensions. It does not identify a camera burst across a minute boundary.
- Quarantine moves are reversible from the current app session. The exported CSV remains the durable record after the app closes.
- A matching copy count is not a restore test. The interface warns users to open important backups.
- Desktop packages are unsigned until owner certificates are available.

## Needs operator action

1. Register `photo-proof-pile` with the Sociobot billing API at US$29 and set its return URL to `https://photo-proof-pile.sociobot.in/`.
2. Add macOS signing secrets when certificates are available: `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`.
3. Add Windows signing secrets when a certificate is available: `WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`, then wire the certificate import into the release workflow.
4. Submit the resulting signed installers to platform stores only if desired. The current release route is direct download.
