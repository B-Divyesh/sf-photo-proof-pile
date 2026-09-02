# Verification 26 — FAIL

**Candidate:** `b12d5727de44d71c91b4a496eece320e7247a853`  
**Live URL:** <https://photo-proof-pile.sociobot.in>  
**Verified:** 2 September 2026 UTC  
**Work order:** `photo-proof-pile-verify-26`

## Verdict

**FAIL — release-blocking production/release identity mismatch.** GitHub has a
complete, checksum-valid `v0.1.30` desktop release targeting this candidate,
but production still identifies and requests `v0.1.29`. The live download
dialog therefore exposes no desktop packages, and both live one-line
installers refuse to install. A visitor cannot obtain the candidate through
the product's documented install paths.

No product source code was changed during verification.

## Release-blocking defect

### S1 — production cannot offer its candidate-matched desktop release

- GitHub release `v0.1.30` targets
  `b12d5727de44d71c91b4a496eece320e7247a853`. Its `latest.json` names the same
  tag and commit and lists two macOS DMGs, Windows MSI and EXE, and Linux
  AppImage, DEB, and RPM packages.
- `RELEASE_TAG=v0.1.30 RELEASE_COMMIT=b12d5727… bash
  scripts/verify-published-release.sh` passed after downloading all seven
  packages and matching every byte to `SHA256SUMS`.
- GitHub Actions release run
  [33596875103](https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33596875103)
  completed successfully from the candidate. The versioned-repair workflow
  stamps that artifact as `v0.1.30`.
- Production instead renders `v0.1.29 · source b12d5727de44` and requests
  `https://api.github.com/repos/B-Divyesh/sf-photo-proof-pile/releases/tags/v0.1.29`.
  That immutable tag targets `758ba98390c5a2ba49323b7682a6a86e5eca6103`.
- The live **Check desktop downloads** dialog says “Downloads for this build
  are being published” and exposes **zero** download links.
- Live `/install.sh` and `/install.ps1` are stamped with expected tag
  `v0.1.29` and expected commit `b12d5727…`, an identity combination that does
  not exist. Running the Linux command in an isolated destination exits 1 with
  “The published Linux package does not match this site build. Nothing was
  installed.”
- A fresh `BUILD_COMMIT=b12d5727… npm run build` produced 27 publicly served
  files that matched production byte-for-byte. This confirms production is
  the candidate's ordinary `v0.1.29` source build, not the `v0.1.30`-stamped
  `release-site` artifact from the successful release run.

Deploy the `release-site` artifact from run 33596875103. Then verify that the
footer says `v0.1.30`, the dialog requests `v0.1.30` and exposes platform
links, and both live installers resolve `v0.1.30` at candidate `b12d5727…`.

## Mandatory first-read and demo gate — PASS

A cold visit on desktop and 390 px mobile answers the required questions in
the first screen:

- What: **“Review photo copies before you remove them.”**
- For whom: people with photos across several drives who fear removing the
  only meaningful copy.
- First click: **“Try it with sample data”**, beside **“Opens three
  ready-to-review groups.”**

The mobile primary action is visible, 44.39 px high, and opens `/demo` in one
click. The next screen contains three realistic groups and eight files. A
persistent **“Demo — sample data, nothing is saved”** banner provides **Reset
demo** and **Start for real**.

## Claims — PASS, 25/25

`.factory/claims.json` exists and is valid. After `npm ci`, every exact listed
command was run individually through the demo or native entry point before
the broader review. All passed:

| Claim | Result |
| --- | --- |
| `demo-isolated` | PASS |
| `match-evidence` | PASS |
| `csv-export` | PASS |
| `reversible-plan` | PASS |
| `review-before-move` | PASS |
| `local-privacy` | PASS |
| `no-ad-tracking` | PASS |
| `native-local-privacy` | PASS |
| `license-request-privacy` | PASS |
| `no-account` | PASS |
| `free-scan-limit` | PASS |
| `free-safety-tools` | PASS |
| `paid-license` | PASS |
| `license-verification-allowance` | PASS |
| `paid-checkout` | PASS |
| `licensed-scan-limit` | PASS |
| `offline-reload` | PASS |
| `native-matching` | PASS |
| `scan-scope` | PASS |
| `cross-drive-safety` | PASS |
| `installer-checksum` | PASS |
| `windows-installer-checksum` | PASS |
| `desktop-release-assets` | PASS |
| `desktop-release-identity` | PASS |
| `unsigned-package-state` | PASS |

Landing, privacy, terms, download, and README claims were cross-checked with
the registry. No uncovered material claim was found.

## Clean local gates and production build

- `npm ci`: PASS — 66 locked packages, zero reported vulnerabilities.
- `npm run check`: PASS — TypeScript, rustfmt, and warnings-denied Clippy.
- `CI=1 npm test`: PASS — 11 Rust, 19 Vitest, and 37 Playwright tests.
- `BUILD_COMMIT=b12d5727… npm run build`: PASS — produced `dist/site`.
- JavaScript: **15.59 KiB gzip total**; CSS: **5.11 KiB gzip**; hero image:
  **29,922 bytes**. These are below the 200/50/300 KiB budgets.
- Candidate build versus production: **27/27** served files matched SHA-256;
  `staticwebapp.config.json` was excluded because Azure consumes it as
  deployment configuration.

## Independent end-to-end exercise

The live demo was exercised from empty browser storage:

- All three match types rendered with eight records and their locations,
  dimensions, sizes, dates, cameras, identifiers, and other-drive counts.
- Attempting to quarantine without a kept copy was rejected and left the plan
  at zero.
- **Mark exact extras** created a two-file plan. Confirmation named exactly two
  files and `/Sample drive/Proof Pile Quarantine`.
- Quarantine reported that no device files changed. CSV export contained one
  header and eight decision records, including recovery destinations.
- Reload retained recovery state; restore showed both paths and completed.
  Reset removed the demo session namespace.
- An invalid decision log was rejected with recovery guidance. Arrow-key group
  selection, Space-operated decisions, and focus advancement worked.
- Native tests covered the 1,001-file free boundary, licensed boundary,
  selected-folder scope, exact/perceptual/metadata grouping, cross-drive
  copy-before-remove, preservation, collision avoidance, and hostile recovery
  records.

## Accessibility, mobile, privacy, and PWA

- Ten fresh Axe runs covered `/`, `/demo`, `/app`, `/privacy`, and `/terms` in
  light and dark: **zero serious or critical findings**.
- Each tested route has `lang=en`, one `<h1>`, one `<main>`, a route-specific
  title, and complete image alt attributes. Keyboard focus uses a visible
  outline; the skip link, listbox, decision controls, and dialogs worked.
- At 390 px, all routes and the real 404 had no horizontal overflow, no tested
  interactive target below 44 px, and no overflow at simulated 200% text.
  Reduced-motion transitions fell to `0.00001s`.
- The complete demo flow made only same-origin GET requests. It sent no sample
  photo data, analytics, advertising, third-party fonts, or uploads.
- A real invalid-license check made one bodyless GET whose only product datum
  was the token. It produced a plain invalid-token message and stored nothing.
- The service worker controlled `/demo`, had no waiting update, used cache
  `proof-pile-v29`, and reloaded the three-group demo offline with HTTP 200.
- No console errors or page exceptions occurred in the live audit.
- No sign-in is required, so an identity-provider check is not applicable.
  A runtime AI feature would conflict with the local deterministic cleanup job
  and is not missed leverage for this brief.

## Release package, headers, API allowance, and performance

- A fresh Debian consumer install verified public DEB SHA-256
  `bc41beaf2535be46bf177974c8f3ab8b62a7140f64fc271424e0981378c4a7e4`,
  installed version `0.1.30` with declared GTK/WebKit dependencies, and kept
  `/usr/bin/proof-pile` running under Xvfb for the eight-second smoke window
  (expected timeout 124; only a headless EGL warning).
- `/`, `/demo`, `/app`, `/privacy`, `/terms`, metadata files, and all rendered
  same-origin links return 200. An unknown path returns the designed HTTP 404.
  The source link returns 200 and hosted checkout returns 303.
- Browser response headers include HSTS, `nosniff`, strict-origin referrer
  policy, restrictive permissions policy, and header-delivered CSP with
  `frame-ancestors 'none'`. HTML and service worker cache for 30 seconds;
  hashed JavaScript is one-year immutable.
- License verification sends exact-origin CORS and `Cache-Control: no-store`.
  In a fresh single-client run, requests 1–30 returned 200; request 31 returned
  **429** with **`Retry-After: 3`**. Observed allowance: 30 requests per client
  window.
- Mobile Lighthouse: Performance **94**, Accessibility **100**, Best Practices
  **100**, SEO **100**; FCP 1.0 s, LCP 1.2 s, TBT 280 ms, CLS 0, transfer
  141,266 bytes.

## Evidence

- `.factory/evidence-26/live-qa.json` — routes, Axe, demo, keyboard, mobile,
  privacy request log, PWA, and live download refusal.
- `.factory/evidence-26/lighthouse-live.json` — fresh mobile Lighthouse report.
- `.factory/evidence-26/live-first-read-mobile-390.png`
- `.factory/evidence-26/live-demo-desktop.png`
- `.factory/evidence-26/live-demo-mobile-390.png`
- `.factory/evidence-26/live-download-refusal.png`
