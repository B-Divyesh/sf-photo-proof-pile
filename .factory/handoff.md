# Proof Pile repair handoff

## Result

**PASS — verifier report `6ddf24e2aef0ed3f39d5e1be1b051d6e73942547`
is repaired and released.**

- Repair commit: `5461ae675995fa91739856f13fcf925688af5a4c`
- Release: [`v0.1.1`](https://github.com/B-Divyesh/sf-photo-proof-pile/releases/tag/v0.1.1)
- Release workflow: [`33230591124`](https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33230591124), successful
- Production: <https://photo-proof-pile.sociobot.in>
- Static deployment ID: `2aaa0ddd-6421-491f-9678-9fe18c04ca53`

## Repairs

1. Native quarantine results now append to the durable move log. A Tauri-bridge
   regression runs two batches, reloads, and restores one file from each batch.
2. Fresh invalid, expired, and revoked license verdicts now use the same
   24-hour cache as valid verdicts. The regression reloads twice and observes
   no verification request.
3. The live Sociobot product is registered as Proof Pile at USD 2900. The page
   states US$29 once, opens hosted checkout, stores the returned license, and
   retains license paste/restore.
4. Licensed scans above 1,000 images and the Windows installer checksum gate
   now have dedicated claims and regression coverage. The release workflow
   executes the PowerShell harness on Windows before packaging.
5. Version `0.1.1` is consistent in npm, Cargo, Tauri, and the UI. Release
   metadata includes its source commit, and release caching is versioned so a
   stale v0.1.0 browser entry cannot win.
6. Privacy, Terms, and 404 links meet the 44 px target baseline. The 390 px
   review no longer clips at 200% text size.
7. Service-worker cache generation `proof-pile-v5` replaces the prior shell.

The researched brief, demo behavior, matching rules, kept-copy guard, local
storage model, CSV recovery, and every previously passing claim were preserved.

## Verification

Run from the repaired tree:

```sh
npm ci
npm test
npm run check
npm run build:site
CI=true npm run build:desktop
```

Results on 29 August 2026:

- `npm ci`: 66 packages installed; 0 audit vulnerabilities.
- `npm test`: Rust 6/6, Vitest 6/6, Playwright 19/19.
- Every command in `.factory/claims.json` passed independently (15 claims).
- `npm run check`: TypeScript, `cargo fmt --check`, and strict Clippy passed.
- `npm run build:site`: passed; built JS totals 13.10 KiB gzip, CSS is
  4.96 KiB gzip, and the hero image is 29.9 KB.
- `CI=true npm run build:desktop`: produced and launched a Linux AppImage and
  produced DEB/RPM packages. The rendered desktop window is recorded at
  `.factory/evidence/repair-2/local-app.png`.
- Playwright covered desktop, 390 x 844 mobile, 200% text, light/dark axe,
  keyboard and dialog focus, privacy request logging, offline reload/update,
  license return/cache, and the native multi-batch boundary.
- `/opt/fleet/lib/verify-url.sh` passed locally and live with one h1, one main,
  `lang=en`, alt text, labeled buttons, and zero console errors. Evidence is in
  `.factory/evidence/repair-2/verify-url-local/` and `verify-url-live/`.
- Live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.9 s, LCP 0.9 s, TBT 20 ms, CLS 0, transfer 135 KiB.
  Report: `.factory/evidence/repair-2/lighthouse-live-mobile.json`.
- Live root, service worker, installers, 404, hero, manifest, and all seven
  built assets match `dist/site` byte for byte.
- The live demo/offline/keyboard smoke made 18 same-origin requests and no
  console errors. The release chooser linked only to v0.1.1 assets.

## Release and policy evidence

GitHub Actions built both macOS architectures, Windows, and Linux from repair
commit `5461ae6`. The release contains two DMGs, MSI, EXE, AppImage, DEB, RPM,
application archives, `SHA256SUMS`, and `latest.json`.

- `latest.json`: version `v0.1.1`, commit
  `5461ae675995fa91739856f13fcf925688af5a4c`, and two advertised assets for
  each platform.
- Downloaded DEB: package `proof-pile`, version `0.1.1`, architecture `amd64`;
  published SHA-256
  `fad13fdd2ceec2b0cf07d4d099a12c64072768e08aa59bd9b55d833f9757315d` matched.
- Root response: HSTS, CSP, `nosniff`, strict-origin referrer policy,
  Permissions Policy, and 30-second revalidation.
- Hashed asset response: one-year immutable cache.
- Unknown route: HTTP 404 with the designed page.
- Checkout: HTTP 303 to Dodo hosted checkout with production-origin CORS.
- Invalid license check: `{valid:false, reason:"invalid"}`, `Cache-Control:
  no-store`, and production-origin CORS.
- No analytics, trackers, third-party fonts, photo uploads, or raw Azure keys.

## Known gaps and operator action

There are no known release-blocking gaps. Native packages are intentionally
unsigned, and the download dialog says so. Signing requires owner certificates;
use `APPLE_CERTIFICATE` for macOS and `WINDOWS_CERT_PFX` for Windows when the
workflow is extended to sign releases. The app does not check for native
updates, so no updater manifest is shipped.
