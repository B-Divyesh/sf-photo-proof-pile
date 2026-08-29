# Proof Pile independent verification 4

## Verdict: PASS

Candidate `f9b75ab5325bb78509a95013dfe494722cc2b257` is releasable.
The live product performs the brief's local duplicate-review, evidence,
quarantine-plan, CSV, and recovery job end to end. Every declared claim test,
repository gate, production build, desktop package build, accessibility check,
privacy check, deployment-identity check, and release checksum check passed.

- Work order: `photo-proof-pile-verify-4`
- Candidate: `f9b75ab5325bb78509a95013dfe494722cc2b257`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Released product source: `06e97c4935cc702650d0b3b2db3145082941b468`
  (`v0.1.3`); the candidate differs only in `.factory/handoff.md`
- Verified: 29 August 2026 UTC
- Product code changed by verifier: none

## Findings by severity

- Release blocking: none.
- Major: none.
- Minor: none.
- Operator action: packages are intentionally unsigned. Signing and macOS
  notarization still require owner certificates and workflow configuration;
  provision `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` when enabling it.

## Mandatory first-read gate — PASS

A cold 1440 x 900 visit and a cold 390 x 844 mobile visit answer all three
questions before scrolling:

- What it does: “Review photo copies before you remove them.”
- Who it is for: people with photos across several drives who fear removing
  the only meaningful copy.
- What to do first: “Try it with sample data,” with “Opens three ready-to-review
  groups” beside it.

The three plain facts say photos stay on the device, no account is required,
and the free limit / US$29 one-time price. One click opened `/demo`, immediately
showed three populated groups, and displayed the persistent “Demo — sample
data, nothing is saved” banner with Reset and Start for real actions.

Evidence: `.factory/evidence/verification-4/first-read-desktop.png` and
`first-read-mobile.png` in the local ignored evidence directory.

## Claims gate — all 15 exact commands PASS

`.factory/claims.json` exists. Each listed command was run separately before
broader QA from the clean candidate and its declared demo sandbox.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-isolated` | PASS | Separate sample state edits and resets |
| `match-evidence` | PASS | Exact, same-moment, and visual groups expose evidence |
| `csv-export` | PASS | Header plus eight sample file rows downloaded |
| `reversible-plan` | PASS | Moves persist, export/import, and restore |
| `local-privacy` | PASS | Complete sample review stays same-origin |
| `no-account` | PASS | Review desk opens with no identity fields |
| `free-scan-limit` | PASS | 1,001 valid images report 1,000 scanned and limited |
| `paid-license` | PASS | Restored license is namespaced and checked once daily |
| `paid-checkout` | PASS | US$29 checkout and returned-license flow work |
| `licensed-scan-limit` | PASS | All 1,001 images scan with a valid license |
| `offline-reload` | PASS | `/demo` reloads offline with three groups |
| `native-matching` | PASS | Exact, perceptual, and EXIF groups are produced |
| `cross-drive-safety` | PASS | Copy-before-remove, dates, and collision handling pass |
| `installer-checksum` | PASS | Linux mismatch is removed; valid package installs |
| `windows-installer-checksum` | PASS | SHA-256 mismatch removal precedes `msiexec` |

The live landing page, legal pages, README, and copy audit were cross-checked
against the manifest. No unsupported material claim or banned copy was found.

## Clean install, checks, tests, and builds

| Check | Result |
| --- | --- |
| Initial checkout | PASS — exact requested SHA, no changes |
| `npm ci` | PASS — 66 packages, 0 audit vulnerabilities |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm test` | PASS — Rust 7/7, Vitest 7/7, Playwright 21/21 |
| `npm run check` | PASS — TypeScript, Rust format, strict Clippy |
| Separate lint script | Not present; strict Clippy and TypeScript are in `check` |
| `npm run build` | PASS — exact production site in `dist/site` |
| `CI=true npm run build:desktop` | PASS — DEB, RPM, AppImage produced |
| Final product-source diff | PASS — none |

The first desktop-build attempt identified missing WebKit/GTK system libraries
in the disposable image. After installing the exact dependencies declared by
the release workflow, plus its required `file` utility, the same command
passed. Tauri temporarily added an empty feature list to `Cargo.toml`; that
tool-only rewrite was restored byte-for-byte. No product source was changed.

## End-to-end job and hostile-input checks

The live demo was exercised from empty browser storage:

1. It showed three realistic groups: exact bytes (three files), same moment
   (three files), and looks alike (two files), with paths, dimensions, sizes,
   dates, cameras, hashes, and other-drive counts.
2. Trying to quarantine the group's only kept copy was blocked with a direct
   recovery instruction.
3. “Mark exact extras” selected two copies. Running the reviewed plan reported
   two sample moves and explicitly said no device files changed.
4. CSV export produced `proof-pile-decisions.csv`, one header plus eight file
   rows, quarantine destinations, and 64-digit recovery hashes.
5. Reload kept the recovery state. Restore displayed the exact quarantine and
   original paths; Cancel/Escape moved nothing and returned focus to the
   trigger; confirmation restored the record.
6. Clearing demo storage and importing the exported CSV recovered two verified
   records. Wrong columns, an unfinished quoted value, and a validly shaped
   out-of-root record were rejected with specific next steps.
7. Reset returned the plan to zero. Start for real removed the `demo:` key and
   opened `/app` at “Choose folders to scan.”

Native filesystem tests independently covered the 1,000/1,001-file licensing
boundary, actual exact/perceptual/EXIF matching, collision-safe quarantine,
cross-device copy-before-remove, timestamp and byte preservation, hash-bound
imported recovery, outside-root rejection, and restore. Source inspection also
confirmed batch rollback and existing-destination protection.

The previous verification's imported-CSV defect is closed: imports require a
full hash and selected quarantine root, native code canonicalizes containment
and rechecks bytes immediately before restore, and the named source/destination
must be confirmed in an accessible dialog. The previous cross-device wording
and mobile OS misidentification are also corrected.

## Privacy, security headers, caching, and endpoint policy

- The complete demo edit, plan, export, reload, invalid import, valid import,
  restore, reset, and exit flow made only same-origin requests. It produced no
  page exceptions. Fresh loads of `/`, `/demo`, `/privacy`, and `/terms`
  produced zero console or page errors.
- No analytics, telemetry, third-party fonts/scripts, photo uploads, Azure
  endpoints, embedded keys, or secrets were found. Expected explicit actions
  contact only GitHub release metadata and Sociobot billing.
- Root responses include HSTS, CSP with header-delivered
  `frame-ancestors 'none'`, `nosniff`, strict-origin referrer policy, and a
  restrictive permissions policy.
- HTML and `sw.js` revalidate after 30 seconds. Hashed JS/CSS assets use
  `public, max-age=31536000, immutable`. A random path returns a designed true
  HTTP 404.
- An invalid license request returned HTTP 200 with `valid:false`,
  `Cache-Control: no-store`, and the exact live-origin CORS header.
- A fresh same-client burst received 30 successful license verification
  responses. Overall request 31 returned HTTP 429 with `Retry-After: 4`.
- Hosted checkout returned HTTP 303 to Dodo with the expected live-origin CORS
  header. No payment provider is embedded in the product.
- There is no sign-in, so the Microsoft Entra tenant requirement does not
  apply. There is no product backend beyond billing and release APIs, so
  backend concurrency and persistence checks do not apply.

## Accessibility, keyboard, mobile, and PWA

- The supplied `verify-url.sh` passed live: HTTP 200, useful title, `lang=en`,
  one h1, one main, alt text, labeled buttons, and zero normal-load errors.
- Live Playwright axe checks on `/`, `/demo`, `/privacy`, `/terms`, and the 404
  route in both light and dark modes found zero serious/critical findings (and
  zero violations overall). A separate 390 px demo audit also found none.
- Keyboard checks passed skip-link focus, Up/Down group navigation, Space and
  Enter activation, native dialog focus, Escape cancellation, confirmation,
  and trigger-focus return. The focus ring is 3 px solid with 5.90:1 light and
  8.75:1 dark contrast.
- At 390 px there is no document overflow, no visible interactive target below
  44 x 44 px, and no clipped content after a 200% text-size simulation.
  Android and iPhone correctly say the desktop app requires macOS, Windows, or
  Linux.
- Reduced-motion mode collapses transitions to 0.01 ms and has zero running
  animations.
- The active `sw.js` registration completed an update check. `/demo` then
  reloaded offline with all three groups and the demo banner.

## Performance and bundle budgets

Fresh mobile Lighthouse on the live root:

| Category / metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 0.9 s |
| LCP | 1.1 s |
| Total blocking time | 20 ms |
| CLS | 0 |
| Total transfer | 136 KiB |

The main application JavaScript is 34,486 bytes raw / 12,148 bytes gzip. CSS
is 18,271 bytes raw / 5,029 bytes gzip. There are no web fonts. The mobile hero
is 29,922 bytes. Every supplied static-product budget passes.

## Deployment and release identity

- Local `HEAD` and `origin/main` both equal the requested candidate.
- A fresh site build produced 27 deployable files. Every file, including HTML,
  hashed JS/CSS, service worker, manifest, installers, 404, icons, sample art,
  hero, social image, and walkthroughs, matched the live response byte-for-byte.
- Release `v0.1.3` identifies source
  `06e97c4935cc702650d0b3b2db3145082941b468`; its only difference from the
  candidate is `.factory/handoff.md`, so all product and packaging sources are
  identical.
- GitHub Actions run `33235123807` passed release preparation, macOS arm64,
  macOS x64, Windows x64, Linux x64, and checksums.
- `latest.json` is valid and lists two choices each for macOS, Windows, and
  Linux. The live picker resolves those real v0.1.3 assets with no normal-path
  errors and renders a calm fallback when metadata is unavailable.
- All nine package/archive assets match `SHA256SUMS`.
- The live Linux installer installed the published AppImage into an isolated
  directory. SHA-256:
  `8b14b788b04846a4eedbdb11897f0711d7896c30d936178be264ffdd9dd53f7f`.
  The released application remained running under Xvfb until the 15-second
  smoke-test timeout.

## Evidence and reproduction

Ignored local evidence is under `.factory/evidence/verification-4/`, including
screenshots, URL-verifier output, live functional/request JSON, deployment
hash comparison, and Lighthouse JSON.

```sh
npm ci
npm test
npm run check
npm run build
CI=true npm run build:desktop
```

The native build requires the Linux packages in `.github/workflows/release.yml`;
minimal containers also need `file` for AppImage packaging.
