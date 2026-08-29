# Proof Pile independent verification 6

## Verdict: PASS

Candidate `d8665cbbbff21ffeaa41413a0647f7bc23129c2f` is releasable.
The required first-read and one-click demo gates pass, all 19 declared claims
pass, the real cleanup and recovery workflow works, all repository gates and
production builds pass, and the live deployment matches the candidate product
byte-for-byte. One minor version-label defect remains on the 404 page.

- Work order: `photo-proof-pile-verify-6`
- Candidate: `d8665cbbbff21ffeaa41413a0647f7bc23129c2f`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Released product source: `0046d5d7b4bb6a5288c4f5f7e7506b07bde64327`
  (`v0.1.5`); the candidate differs only in `.factory/handoff.md`
- Verified: 29 August 2026 UTC
- Product code changed by verifier: none

## Findings by severity

- S1 / release blocking: none.
- S2 / major: none.
- S3 / minor: the static 404 page footer says `v0.1.4` at
  `public/404.html:39`, while `package.json`, normal route footers, the live
  download picker, and the published release say `v0.1.5`. The 404 still
  returns a correct HTTP 404, is fully usable, and matches the candidate file;
  only its displayed build identity is stale.
- Operator action: packages are intentionally unsigned. macOS notarization
  and Windows Authenticode still require owner-held signing material.

## Mandatory first-read gate — PASS

Cold loads at 1440 × 900 and 390 × 844 answer all three questions before
scrolling:

- What: “Review photo copies before you remove them.”
- Who: people with photos across several drives who fear removing the only
  meaningful copy.
- First click: “Try it with sample data,” beside “Opens three ready-to-review
  groups.”

The first screen also states the local-photo policy, no-account use, the
1,000-file free limit, and the US$29 one-time price. One click opens three
populated groups and a persistent “Demo — sample data, nothing is saved”
banner with Reset demo and Start for real.

Evidence: `.factory/evidence/verification-6/first-read-cold.png` and
`first-read-mobile.png`.

## Claims gate — all 19 exact commands PASS

`.factory/claims.json` exists. After the required lockfile install, every
listed command was run separately and verbatim through the declared demo or
native entry point before broader QA.

| Claim | Result |
| --- | --- |
| `demo-isolated` | PASS |
| `match-evidence` | PASS |
| `csv-export` | PASS |
| `reversible-plan` | PASS |
| `local-privacy` | PASS |
| `native-local-privacy` | PASS |
| `license-request-privacy` | PASS |
| `no-account` | PASS |
| `free-scan-limit` | PASS |
| `free-safety-tools` | PASS |
| `paid-license` | PASS |
| `paid-checkout` | PASS |
| `licensed-scan-limit` | PASS |
| `offline-reload` | PASS |
| `native-matching` | PASS |
| `scan-scope` | PASS |
| `cross-drive-safety` | PASS |
| `installer-checksum` | PASS |
| `windows-installer-checksum` | PASS |

The landing page, demo, legal pages, README, and copy audit were cross-checked
against the manifest. No unlisted material product claim was found. The
complete output is in `claims-after-install.txt` in the evidence directory.

## Clean install, tests, checks, and production builds

| Check | Result |
| --- | --- |
| Candidate identity | PASS — exact requested SHA; no pre-existing tracked changes |
| `npm ci` | PASS — 66 packages installed |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm test` | PASS — 9 Rust, 8 Vitest, 24 Playwright tests |
| `npm run check` | PASS — TypeScript, Rust formatting, strict Clippy |
| Separate lint script | Not present; TypeScript and strict Clippy are in `check` |
| `npm run build` | PASS — exact site produced in `dist/site` |
| `CI=true npm run build:desktop` | PASS — DEB, RPM, and AppImage produced |
| Final product-source diff | PASS — none |

The first desktop build attempt found the clean worker missing GTK/WebKit
development libraries. After installing the exact Linux prerequisites listed
in `.github/workflows/release.yml`, the unchanged build passed. Tauri inserted
an empty feature list in `Cargo.toml`; that tool-generated change was restored
byte-for-byte before handoff.

## End-to-end product exercise

The deployed demo was exercised from empty browser state:

1. Three exact-byte, same-moment, and looks-alike groups showed 3, 3, and 2
   files with locations, dimensions, sizes, dates, cameras, identifiers, and
   other-drive-copy counts.
2. Quarantining a group's only kept copy was rejected with a corrective
   message and left the plan at zero.
3. Mark exact extras selected two files. Cancelling confirmation moved none.
   Accepting it created two unique recovery records, changed the pending plan
   to zero, disabled the run control, and repeat selection stayed idempotent.
4. CSV export contained one header and eight file rows, quarantine paths, and
   64-character recovery hashes.
5. Reload preserved recovery state. The restore dialog named both paths,
   focused Cancel, supported Escape, returned focus to its trigger, and a
   confirmed restore succeeded.
6. Wrong columns, an unfinished quoted value, and a validly shaped path
   outside the sample quarantine root were each rejected with specific
   recovery text. Reimporting the valid CSV recovered two verified records.
7. Reset removed demo storage and returned the plan to zero. Start for real
   discarded demo state and opened `/app`.

Native Rust tests independently exercised the 1,000/1,001-file boundary,
selected-folder containment, exact/perceptual/EXIF grouping, collision-safe
quarantine, copy-before-remove, byte/date preservation, hash-bound import,
outside-root rejection, and restore.

## Accessibility, mobile, keyboard, and PWA

- `/opt/fleet/lib/verify-url.sh` passed the live root: HTTP 200, useful title,
  `lang=en`, one h1, one main, complete alt text, labeled buttons, and no load
  errors.
- Fresh live axe runs on `/`, `/demo`, `/privacy`, `/terms`, and the true 404
  in light and dark modes found zero violations and zero serious/critical
  findings. The 390 px demo also had zero violations.
- Keyboard review with Space moved focus from the chosen second file to the
  next file's Keep control; the following Tab/Space choice stayed in that row.
  The visible focus outline is 3 px solid, with 5.90:1 light and 8.75:1 dark
  contrast. The 44 px skip link moves focus to `main`.
- At 390 px, document width remained 390 px, no visible interactive target was
  below 44 × 44 px, and a 200% text-size simulation introduced no overflow.
- Reduced-motion matched, left zero running animations, and reduced transition
  durations to 0.01 ms.
- The active `sw.js` controlled the deployed page, accepted an update check,
  and reloaded `/demo` offline with all three groups and its sandbox banner.

## Privacy, security, links, and endpoint policy

- The complete live demo flow made 22 same-origin requests, zero off-origin
  requests, zero failed requests, zero console errors, and zero page errors.
- A live returned-license check stored and then stripped the token from the
  URL. The browser sent exactly one token-only GET to Sociobot with no body and
  displayed the inactive-license result for the deliberately invalid token.
- Source and runtime inspection found no analytics, telemetry, third-party
  fonts/scripts, photo uploads, Azure model endpoints, embedded secrets, or
  alternate identity provider. There is no sign-in, so the Microsoft Entra
  tenant requirement does not apply.
- HTML responses include HSTS, CSP with header-delivered
  `frame-ancestors 'none'`, nosniff, strict-origin referrer policy, and a
  restrictive permissions policy. HTML and `sw.js` revalidate after 30
  seconds; hashed JS/CSS is immutable for one year; the web manifest has the
  correct MIME type.
- All discovered links resolved to HTTP 200, expected download redirects,
  hosted-checkout HTTP 303, or explicit `mailto:` links. The unknown route is
  a designed HTTP 404.
- The invalid-license endpoint returned `valid:false`, `Cache-Control:
  no-store`, and the exact live-origin CORS header. In a fresh 45-request
  burst, requests 1–30 returned 200 and requests 31–45 returned 429. Every 429
  included `Retry-After` (1–2 seconds). Observed allowance: 30 requests per
  burst window.
- Hosted checkout returned HTTP 303 to Dodo. No payment provider is embedded
  in the product. There is no product-owned backend beyond the external
  release and billing APIs, so backend concurrency and persistence checks do
  not apply.

## Performance and budgets

Three fresh Lighthouse 12.8.2 mobile runs scored 98, 99, and 97 for
Performance; the median is 98. Accessibility, Best Practices, and SEO scored
100 in every run. LCP ranged from 1.12 to 1.35 seconds, median total blocking
time was 157 ms, CLS was 0, and transfer was about 140 kB.

The production build reports 13.11 kB gzip for the initial application JS and
5.08 kB gzip for CSS. The two small lazy/native chunks are 1.03 kB and 0.54 kB
gzip. There are no web fonts. The hero image is 29,922 bytes. All supplied
static-product budgets pass.

## Deployment and desktop release identity

- A fresh build produced 27 deployable files excluding deployment-only
  `staticwebapp.config.json`; every file matched its live response
  byte-for-byte, including HTML, hashed JS/CSS, maps, service worker,
  installers, 404, manifest, icons, sample art, hero, and walkthroughs.
- Tag `v0.1.5` and `latest.json` identify product source
  `0046d5d7b4bb6a5288c4f5f7e7506b07bde64327`. The requested candidate differs
  only in the previous handoff document.
- GitHub Actions release run `33243636254` completed successfully for release
  setup, Linux, Windows, both macOS architectures, and checksums.
- The release has 11 assets. `latest.json` lists two macOS, two Windows, and
  two Linux choices. All nine package/archive files match `SHA256SUMS`.
- The live Linux installer installed the published AppImage into an isolated
  directory and verified SHA-256
  `26098423aeee79d5472fc0d6cf0ced1c30c2f1ef738167b0505d4fb1e5ab713a`.
  The released application stayed running for the full 15-second Xvfb smoke
  window.

## Evidence and reproduction

Ignored runtime evidence is under `.factory/evidence/verification-6/`.

```sh
npm ci
npm audit --audit-level=high
# Run every command in .factory/claims.json separately
npm test
npm run check
npm run build
CI=true npm run build:desktop
```

The native build requires the Linux packages named in the release workflow;
minimal containers also need `file` for AppImage packaging.
