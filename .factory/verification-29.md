# Verify photo copies before removing them — Verification 29

Verified 6 September 2026 UTC against
<https://photo-proof-pile.sociobot.in>.

- Work order: `photo-proof-pile-verify-29`
- Implementation candidate: `b12d5727de44d71c91b4a496eece320e7247a853`
- Documentation checkout: `1fdac04b9fb0a784bfebd243b7517cf5e6239b8c`
- Required release: `v0.1.30` at `b12d5727…`
- Observed live build: `v0.1.29` at `1fdac04…`
- Finding count: **1**
- Untested claim count: **0**

## Verdict: FAIL

**FAIL — production does not offer the reviewed desktop release.**

The implementation candidate and its public `v0.1.30` packages passed. The
live site has been replaced by an ordinary `v0.1.29` build stamped with the
documentation commit `1fdac04…`. Its download dialog exposes no package link,
and the documented Linux installer refuses to install. A desktop product is
not accepted when visitors cannot obtain its reviewed release.

All 25 claim commands passed from a separate clean checkout. There are no
untested or unlisted public claims. The sample workflow, accessibility,
privacy, recovery, offline reload, public packages, billing allowance, and
local quality gates passed.

## Finding

### Severity 1 — the live installer paths do not match v0.1.30

Fresh, uncached browser and HTTP checks between 08:00 and 08:10 UTC found:

- The footer says `v0.1.29 · source 1fdac04b9fb0` and links to that
  documentation commit instead of the implementation candidate.
- **Check desktop downloads** requests GitHub tag `v0.1.29`, says downloads
  are being published, and exposes zero `Download for …` links. The required
  result is four immutable links for macOS Apple silicon, macOS Intel,
  Windows, and Linux.
- Live `install.sh` and `install.ps1` require the nonexistent identity pair
  `v0.1.29` at `1fdac04…`. GitHub tag `v0.1.29` instead targets `758ba983…`.
  An isolated run of the documented Linux command exited 1 with “The
  published Linux package does not match this site build. Nothing was
  installed.”
- The designed 404 says `v0.1.29`. The service worker uses
  `proof-pile-v29`, not `proof-pile-v0.1.30`.
- A clean `npm run build` reconstructed and verified the expected v0.1.30
  release site. Only 18 of its 27 served files matched production. The
  release-sensitive HTML, application bundle, 404, installers, and service
  worker differed.
- A separate ordinary build stamped with documentation commit `1fdac04…`
  matched all 27 live files byte for byte. This proves the result is the
  current deployment, not stale browser storage.

The public release is valid. GitHub `v0.1.30` targets `b12d5727…` and contains
two macOS DMGs, Windows MSI and EXE, Linux AppImage, DEB and RPM,
`SHA256SUMS`, and `latest.json`. Every package checksum passed.

Required action: publish the already verified v0.1.30 release site for
`b12d5727…` to the product host. Prevent later documentation builds from
replacing it. Then verify the footer, four dialog links, installers, 404, and
service-worker cache all carry the same v0.1.30 identity. This report does not
establish a new product-code repair.

## First screen

Fresh 1440 × 900 desktop and 390 × 844 phone profiles answered all three
questions before scrolling:

- Job: “Review photo copies before you remove them.”
- Audience: people with photos across several drives who fear removing the
  only meaningful copy.
- First action: “Try it with sample data,” beside “Opens three
  ready-to-review groups.”

The primary action was visible in both viewports and opened `/demo` in one
keyboard activation.

## Sample workflow and isolation

The sample opened with three realistic groups and eight files. Its persistent
label said “Demo — sample data, nothing is saved” and kept **Reset demo** and
**Start for real** available.

An independent live run seeded a real-review sentinel, rejected an unsafe
quarantine choice, created a two-file plan, and confirmed the exact destination
`/Sample drive/Proof Pile Quarantine`. Export contained one header and eight
decision rows. Reload kept the recovery record. Restore opened with safe
focus, invalid CSV was rejected, reset cleared the sample, and exit opened
`/app`. The real sentinel never changed. Reset and exit removed only
`demo:photo-proof-pile:session`. Every sample request was same-origin.

## Declared claims

A separate clean clone at documentation SHA `1fdac04…` had no changes before
or after the run. `npm ci` installed 66 locked packages with zero reported
vulnerabilities. Every exact command in `.factory/claims.json` passed, and
each claim had exactly one tagged test.

| Claim | Result |
| --- | --- |
| `demo-isolated`, `match-evidence`, `csv-export`, `reversible-plan` | PASS |
| `review-before-move`, `local-privacy`, `no-ad-tracking`, `native-local-privacy` | PASS |
| `license-request-privacy`, `no-account`, `free-scan-limit`, `free-safety-tools` | PASS |
| `paid-license`, `license-verification-allowance`, `paid-checkout`, `licensed-scan-limit` | PASS |
| `offline-reload`, `native-matching`, `scan-scope`, `cross-drive-safety` | PASS |
| `installer-checksum`, `windows-installer-checksum`, `desktop-release-assets` | PASS |
| `desktop-release-identity`, `unsigned-package-state` | PASS |

Landing, demo, privacy, terms, download-dialog, README, and catalog statements
were cross-checked with the registry. No unlisted claim was found.

## Local gates and installed artifact

- `CI=1 npm test`: PASS — 11 Rust, 22 unit, and 37 browser tests.
- `CI=1 npm run check`: PASS — TypeScript, rustfmt, and warnings-denied Clippy.
- `npm run build`: PASS — produced `dist/site` and verified v0.1.30 at
  `b12d5727…` against the public release and manifest.
- `scripts/verify-published-release.sh`: PASS — tag, target, package names,
  manifest, and all seven package checksums agreed.
- The public Linux DEB matched `SHA256SUMS` and reported package `proof-pile`,
  version `0.1.30`, architecture `amd64`. After installing its documented
  GTK/WebKit runtime prerequisites, the extracted binary stayed open under
  Xvfb for eight seconds. Exit 124 was the expected timeout.
- Candidate JavaScript is 15.61 KiB gzip, CSS is 5.11 KiB gzip, and the hero
  image is 29,922 bytes. These pass the product budgets.

## Browser, accessibility, privacy, and recovery

- `/`, `/demo`, `/app`, `/privacy`, and `/terms` returned 200 with distinct
  route titles, `lang=en`, one H1, one main landmark, header/footer, canonical
  URL, description, and complete image alt text.
- A deliberate unknown route returned the designed HTTP 404 with a return
  action. Its expected failed-resource console entry is not a defect.
- Ten Axe scans covered five routes in light and dark. The 404 received an
  additional scan. Serious or critical violations: zero. The supplied URL
  verifier passed `/` and `/demo` with no console errors.
- Keyboard skip-link focus, Enter activation, group arrow keys, route focus,
  Back scroll restoration, decision focus, and Escape behavior passed. The
  primary action had a visible 3 px focus outline.
- At 390 px, tested controls were at least 44 px and routes had no horizontal
  overflow. The demo and 404 remained usable at 200% text size. Reduced
  motion shortened the checked transition to `0.00001s`.
- The service worker controlled the demo, had no waiting update, and reloaded
  all three groups offline with HTTP 200. Its wrong v29 identity is part of
  the Severity 1 deployment finding.
- No advertising, tracking, third-party script, third-party font, photo
  upload, or off-origin sample request was observed.
- The hosted checkout returned 303. Live license verification returned 200
  with exact-origin CORS and `no-store` for requests 1–30; request 31 returned
  429 with `Retry-After: 4`.
- All rendered HTTP links returned 200, except the expected checkout redirect.
  `mailto:` actions were explicit. Security headers included HSTS, `nosniff`,
  strict-origin referrer policy, restrictive permissions policy, and a
  header-delivered CSP with `frame-ancestors 'none'`.
- Fresh mobile Lighthouse scored Performance 100, Accessibility 100, Best
  Practices 100, and SEO 100. FCP was 1.07 s, LCP 1.17 s, TBT 42.5 ms, CLS 0,
  and transfer was 141,192 bytes.

There is no product backend or tenant store to restart. Photo state is local
to the desktop app. The only remote runtime dependency is the Sociobot billing
endpoint checked above. A runtime AI feature would conflict with the local,
deterministic cleanup job and is not missed leverage for this brief.

## Earlier findings

Every earlier review and verification report, including minor findings, was
inspected.

| Earlier finding family | Current disposition |
| --- | --- |
| Review 1 workflow, isolation, claims, route, wording, terminology, focus, and metadata findings | Closed by the clean claim suite, live sample exercise, route checks, copy audit, and keyboard checks. |
| Review 2–7 daily license boundary, links, titles, mobile wording, checksum wording, and copy-audit findings | Closed. The daily boundary, route targets, product-first `/app` title, phone guidance, checksum copy, and v0.1.30 audit all passed. |
| Repeated unsigned-package findings | Closed under the disclosed-and-tested unsigned-package contract. Both macOS and Windows states are stated, and the complete v0.1.30 matrix passed. |
| Initial verification checkout, recovery, accessibility, Intel package, footer, caching, 404, and manifest findings | Closed by current behavior and tests. The 404 remains usable; only its release stamp is wrong under the current deployment finding. |
| Verification 2, 3, and 5 recovery authority, repeated quarantine, invalid-license caching, mobile OS, and focus findings | Closed by normal, invalid, boundary, recovery, and keyboard tests. |
| Verification 9–12, 17, and 20–26 missing or stale desktop releases | The public v0.1.30 release closes the package side. The live access side has recurred as the current Severity 1 finding. |
| Verification 14 mobile 404 overflow and verification 15 billing outage | Closed. The phone layout passes at 200% text, and billing checkout/CORS/allowance respond correctly. |
| Verification 18 default-test failure and documentation drift | Closed. The default suite passes, and the copy audit names v0.1.30 at `b12d5727…`. |
| Verification 21 unlisted unsigned state and verification 27 duplicate claim tag | Closed. `unsigned-package-state` is registered, and every current claim has one tag. |
| Verification 28 deployment mismatch | It was reported fixed, then recurred. Production now matches the later documentation build `1fdac04…` byte for byte instead of the verified v0.1.30 release site. |

## Evidence

Evidence is in `.factory/verification-29-artifacts/`:

- `live-qa.json` — first screen, routes, Axe, demo, storage, keyboard, phone,
  offline, errors, and download dialog.
- `claims.json` — every exact claim command and one-tag audit from the clean
  checkout.
- `release-site-parity.json` — expected v0.1.30 site versus production.
- `documentation-site-parity.json` — current v0.1.29 documentation build
  versus production, 27 of 27 matching.
- `license-allowance.json`, `lighthouse-live.json`, and URL-verifier results.
- Fresh desktop, phone, demo, and download-dialog screenshots.
- `live-installer.stderr` — safe refusal from the documented live installer.

## Acceptance decision

**FAIL. Finding count: 1. Untested claim count: 0.**
