# Proof Pile polish 5 handoff — 30 August 2026

## Outcome

Round 5 is repaired, pushed, deployed, and cold-checked at
<https://photo-proof-pile.sociobot.in>. The cumulative finding map is in
`.factory/polish-5.md`.

The review's blocking safety defect is closed fail-safe. Proof Pile no longer
publishes or links untrusted desktop packages. The previous v0.1.15 release is
a private GitHub draft; its public MSI and DMG URLs return 404. The browser,
shell installer, and PowerShell installer require a complete matrix,
`SHA256SUMS`, `latest.json`, and `DESKTOP_SIGNATURES_VERIFIED.json` before they
offer or write a package.

The public product remains the same Tauri 2 desktop app plus its static site.
Its archival light-table visual identity was preserved.

## Source and deployment

- Reviewed candidate: `e05605f301ebc105f7574c1a911216581086e46d`
- Review base: `a00798f9776aa2a33c821552c344bf642cf4bb79`
- Repair implementation commit: `395628297e9331e8ead19279abd7858d60288f5a`
- Product version: `0.1.16`
- Branch: `main`
- Static deployment ID: `c91cb9c6-8f16-4a3e-b8c3-fd39718b40f0`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Demo: <https://photo-proof-pile.sociobot.in/demo> or `/?demo=1`
- Release-gate run:
  <https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33282734730>

## What changed

- Reinstated a credential preflight that requires the full Apple signing and
  notarization set plus the Windows Authenticode certificate before any
  package build starts.
- Removed all unsigned Windows/macOS build and publication paths.
- Added independent Windows and macOS checks against downloaded release
  packages before checksums, marker creation, and publication.
- Made `DESKTOP_SIGNATURES_VERIFIED.json` mandatory. Its accepted states are
  exactly `authenticode-signed` for Windows and `signed-and-notarized` for
  macOS.
- Made the browser and both installers fail closed when that marker, the full
  platform matrix, or checksum data is missing.
- Changed the phone-only operating-system claim to the action guidance “Open
  this page on a desktop computer to check signed downloads.”
- Strengthened the installer and verified-download claim records and tests.
- Advanced package/site/404/service-worker identity to 0.1.16/v13.
- Updated the verb-first 90-character catalog description and full copy audit.
- Withdrew v0.1.15 from public access by changing it to a private draft. The
  twelve assets were not deleted and remain recoverable by the owner.

## Verification evidence

Evidence is stored in `.factory/polish-5-artifacts/`.

- Fresh remote clone at implementation commit `395628297e9`:
  - `npm ci`: 66 packages, zero vulnerabilities.
  - All 22 exact `.factory/claims.json` commands passed separately.
  - Claim audit: 22 IDs and 22 unique test tags, one tag per claim.
  - `npm test`: 10 Rust, 11 Vitest, and 30 Playwright tests passed.
  - `npm run check`: passed.
  - `npm run build`: passed and produced `dist/site`.
  - `actionlint 1.7.12 .github/workflows/release.yml`: passed.
- Desktop build:
  - `CI=true npm run build:desktop -- --bundles deb,rpm`: passed.
  - DEB: `proof-pile` 0.1.16 amd64, SHA-256
    `3227a1a514de2de074b596474765966c7ce37ddd6acc2854142fe1024da1db75`.
  - RPM SHA-256:
    `22cfce15efaa469b60557545322bf2d03c9e6096bb6527cf4e7fe0a43ce8f48a`.
  - Native executable stayed running for the full intentional eight-second
    Xvfb smoke window; stderr was empty.
- Release safety:
  - Actions run `33282734730` stopped at `validate-signing`; prepare, matrix,
    verification, checksums, and publication jobs were all skipped.
  - Anonymous GitHub releases API returned `[]`.
  - Old v0.1.15 MSI and DMG asset URLs returned 404.
  - Live `install.sh` exited 1 with “Nothing was installed.”
  - Live download dialog exposed zero links and stated why.
- Cold live browser QA:
  - `/`, `/demo`, `/?demo=1`, `/app`, `/privacy`, and `/terms` returned 200;
    an unknown route returned the designed 404.
  - Every route had its correct title, description, canonical, one h1, one
    main, skip link, and Privacy/Terms links.
  - The one-click demo opened three populated groups. Direct `?demo=1`, reset,
    and Start for real kept demo session storage separate from real storage.
  - Quarantine confirmation/cancel/apply, nine-row CSV export, restore-dialog
    focus, route focus, hash navigation, and Back scroll restoration passed.
  - Ordinary use made no off-origin request. The explicit download check used
    only the allow-listed GitHub API.
  - Offline `/demo` reload returned 200 with all three groups from service
    worker cache `proof-pile-v13`.
  - No unexpected browser console or page errors were recorded.
- Accessibility and mobile:
  - The worker URL verifier passed `/` and `/demo` with title, `lang=en`, one
    h1/main, complete alt text, labeled buttons, and no console errors.
  - Playwright axe found zero serious or critical issues on `/`, `/demo`,
    `/privacy`, `/terms`, and the 404 in light and dark, plus mobile.
  - At 390 px and at 200% text there was no horizontal overflow. Checked touch
    targets were at least 44 px, and reduced-motion styling was active.
- Performance:
  - Initial JS: 42.69 kB raw / 14.94 kB gzip.
  - CSS: 18.56 kB raw / 5.09 kB gzip.
  - Lighthouse mobile: performance 100, accessibility 100, best practices 100,
    SEO 100; FCP 1.03 s, LCP 1.18 s, TBT 73 ms, CLS 0, transfer 140,575 bytes.

Key files:

- `.factory/polish-5-artifacts/clean-clone-claims.txt`
- `.factory/polish-5-artifacts/live-qa.json`
- `.factory/polish-5-artifacts/live-cold-desktop.png`
- `.factory/polish-5-artifacts/live-cold-mobile-390.png`
- `.factory/polish-5-artifacts/live-demo-one-click.png`
- `.factory/polish-5-artifacts/live-demo-mobile-390.png`
- `.factory/polish-5-artifacts/live-download-gate.png`
- `.factory/polish-5-artifacts/live-release-gate.txt`
- `.factory/polish-5-artifacts/release-workflow-gate.txt`
- `.factory/polish-5-artifacts/desktop-build.txt`
- `.factory/polish-5-artifacts/lighthouse-live.json`
- `.factory/polish-5-artifacts/verify-root/verify.json`
- `.factory/polish-5-artifacts/verify-demo/verify.json`

## Run and verify

```sh
npm ci
npm test
npm run check
npm run build
CI=true npm run build:desktop -- --bundles deb,rpm
```

Run each `test` command in `.factory/claims.json` separately when verifying
claims. For live checks:

```sh
/opt/fleet/lib/verify-url.sh https://photo-proof-pile.sociobot.in <evidence-dir>
/opt/fleet/lib/verify-url.sh https://photo-proof-pile.sociobot.in/demo <evidence-dir>
node .factory/polish-5-artifacts/live-qa.mjs
```

## Known gaps and operator action

There is no public desktop package until the owner provides trusted signing
credentials. This is intentional fail-closed behavior, not an unsigned release
fallback.

Before creating the next version tag, add these GitHub Actions secrets:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`
- `WINDOWS_CERT_PFX`
- `WINDOWS_CERTIFICATE_PASSWORD`

Then increment the version and trigger `.github/workflows/release.yml` with the
matching `v*` tag. Do not make the draft public manually. The workflow must
complete both independent signature-verification jobs and publish
`DESKTOP_SIGNATURES_VERIFIED.json` itself.

No repository-controlled review finding remains open.
