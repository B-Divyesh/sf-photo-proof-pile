# Proof Pile repair handoff

## Result

**PASS — verifier findings S1, S2, and S3 are repaired and release v0.1.3 is live.**

- Work order: `photo-proof-pile-repair-3`
- Repaired candidate: `2d009a4742a1ff2ffdb2f2159a02e58277ee720e`
- Verifier report: `.factory/verification-3.md` at `a57f3f56f358459f8ce46de4a2d53e9f8cfddd84`
- Product repair: `a64b0fac5405ae4cbd6bd9ac184eba0ede194edf`
- Release-workflow repair and released source: `06e97c4935cc702650d0b3b2db3145082941b468`
- Live site: <https://photo-proof-pile.sociobot.in>
- Release: <https://github.com/B-Divyesh/sf-photo-proof-pile/releases/tag/v0.1.3>
- GitHub Actions: <https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33235123807>
- Verified: 29 August 2026 UTC

## Repairs

### S1 — imported CSV could authorize an arbitrary file move

- Every new quarantine record now stores the full SHA-256 and canonical quarantine root.
- CSV exports include `quarantine_sha256`. Old or edited rows without a 64-digit hash are rejected.
- Desktop import asks the user to select the matching quarantine folder before records enter saved recovery state.
- Rust canonicalizes the selected root and quarantined file, requires the file to be directly inside that root, and hashes its current bytes.
- Rust repeats containment and hash validation immediately before every restore. A forged frontend record therefore fails closed too.
- Restore opens a keyboard-accessible confirmation dialog showing the exact quarantine and original paths. Cancel performs no native call.
- Regression coverage exercises the verifier's hostile `/tmp/new-location/important.txt` and `/tmp/unrelated/important.txt` shape, outside-root rejection, hash mismatch, valid recovery, exact path preview, and cancellation.

### S2 — unsupported cross-device recovery claim

- README no longer promises recovery on another device.
- The registered claim now says recovery is on the same computer and documents the selected-folder, hash-bearing flow.

### S3 — phones were labeled as desktop operating systems

- Android, iPhone, iPad, iPod, and mobile user agents now see: “The desktop app requires macOS, Windows, or Linux.”
- Exact Android and iPhone regressions assert that Linux/macOS download labels are absent.

### Release matrix race found during handoff

- The first v0.1.2 matrix run built the Intel DMG but lost a simultaneous GitHub Release creation race.
- The workflow now creates the release once in a prerequisite job. All matrix uploads wait for it.
- v0.1.3 then completed both macOS architectures, Windows, Linux, and checksums successfully.

## Verification evidence

### Install, tests, claims, and builds

- `npm ci`: 66 packages installed; 0 vulnerabilities.
- All 15 commands in `.factory/claims.json`: PASS when run separately.
- `npm test`: PASS — Rust 7/7, Vitest 7/7, Playwright 21/21.
- `npm run check`: PASS — TypeScript, Rust format, strict Clippy.
- `npm run build`: PASS — production site in `dist/site`.
- `CI=true npm run build:desktop`: PASS after installing the release workflow's WebKit/GTK prerequisites and the clean image's missing `file` utility; DEB, RPM, and AppImage produced.
- Local AppImage stayed running under Xvfb until the 12-second smoke-test timeout.

### Security regression

- `tests/model.test.ts` rejects the verifier's legacy three-column CSV and invalid hashes.
- `tests/app.spec.ts` proves an outside-root CSV reaches native validation but never becomes a recovery record.
- `src-tauri/src/lib.rs` proves an outside-root file is unchanged, a hash mismatch is rejected, and only a contained matching file restores.
- The browser test proves both paths are visible and that Cancel causes zero native restore calls.

### Browser, accessibility, privacy, and offline

- Supplied `verify-url.sh`: PASS locally and live; title, `lang=en`, one h1, main landmark, alt text, labels, and zero console errors.
- Playwright axe: zero serious or critical findings on `/`, `/demo`, `/privacy`, `/terms`, and 404 in light and dark.
- Direct axe CLI: 0 violations on `/`, `/demo`, `/privacy`, and `/terms`.
- Keyboard: skip link, group Arrow keys, decision controls, and restore dialog cancellation/confirmation pass. The restore dialog receives initial focus and exposes named native dialog controls.
- 390 × 844: touch targets, horizontal overflow, Android/iPhone copy, and 200% text pass.
- Reduced motion: transitions collapse to 0.01 ms and no animation loops.
- Live iPhone flow: corrected message present, wrong macOS label absent, three demo groups survive offline reload, no console errors, and no off-origin requests.
- The full demo review/privacy test records only same-origin requests.

### Performance and deployment

- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.6 s, TBT 30 ms, CLS 0, transfer 137 KiB.
- Initial app JavaScript: 34,490 bytes raw / 12,146 bytes gzip. CSS: 18,270 bytes raw / 5,024 bytes gzip. Hero: 29,922 bytes.
- Azure Static Web Apps production deployment succeeded for `sf-photo-proof-pile`.
- All 27 deployable files match the live custom-domain responses byte-for-byte.
- Live response checks: root 200, true 404, HSTS, CSP with header-delivered `frame-ancestors`, nosniff, referrer policy, permissions policy, and 30-second HTML revalidation.
- Hosted checkout returns 303 to Dodo. Invalid license verification returns HTTP 200, `valid:false`, `Cache-Control: no-store`, and the exact live-origin CORS header.

### Packages and consumer path

- GitHub Actions run `33235123807`: release preparation, macOS arm64, macOS x64, Windows x64, Linux x64, and checksums all PASS.
- `latest.json` is valid, identifies v0.1.3 and source `06e97c4935cc702650d0b3b2db3145082941b468`, and lists two choices for each platform.
- All nine published package archives pass `sha256sum -c SHA256SUMS`.
- The live Linux installer downloaded and verified the v0.1.3 AppImage into an isolated directory. SHA-256: `8b14b788b04846a4eedbdb11897f0711d7896c30d936178be264ffdd9dd53f7f`.
- The live download dialog resolves v0.1.3 links for macOS arm64, macOS Intel, Windows, and Linux with zero console errors.

Local screenshots, the URL verifier JSON, and Lighthouse JSON are in ignored `.factory/evidence/repair-3/`.

## How to verify

```sh
npm ci
npm test
npm run check
npm run build
CI=true npm run build:desktop
```

Linux desktop builds require the packages declared in `.github/workflows/release.yml`; minimal containers also need the `file` utility for AppImage packaging.

## Known gaps and operator action

- Native packages are unsigned. Add `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` before enabling signing/notarization.
- Decision CSVs exported by v0.1.1 or earlier have no full quarantine hash and are intentionally rejected for automatic recovery. Users can move those quarantine files back manually.
- No analytics, telemetry, updater, backend, or AI runtime was added. The researched brief, local-first boundary, artifact class, and existing passed behavior remain unchanged.
