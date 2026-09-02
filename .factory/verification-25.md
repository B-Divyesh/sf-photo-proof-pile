# Verification 25 — FAIL

**Candidate:** `d70a334ba782ae62a9bd3053cece835909f99cf5`  
**Live URL:** <https://photo-proof-pile.sociobot.in>  
**Verified:** 2 September 2026 UTC  
**Work order:** `photo-proof-pile-verify-25`

## Verdict

**FAIL — release-blocking desktop distribution identity mismatch.** The live
website is byte-for-byte the candidate's static build, but the only public
desktop release targets `758ba98390c5a2ba49323b7682a6a86e5eca6103`, not
`d70a334…`. The live product correctly refuses to expose those older packages,
so a visitor cannot install this desktop-app candidate.

No product source code was changed during verification.

## Release-blocking defect

### S1 — no desktop package matches the deployed candidate

- A fresh production build stamped with `d70a334…` matched all **27/27** live
  static files byte-for-byte. The deployed footer links to candidate
  `d70a334…`; main JavaScript SHA-256 is
  `0f4d38f2cc04c27f3b2d81eac7d61422eed98ce146a0c1fb53513f87207aad28`
  locally and live.
- GitHub's latest release is `v0.1.29`, but its immutable tag target and
  `latest.json.commit` are
  `758ba98390c5a2ba49323b7682a6a86e5eca6103`. There is no release workflow run
  or release whose source is candidate `d70a334…`.
- The repository's own verifier confirms the mismatch:

  ```text
  RELEASE_TAG=v0.1.29
  RELEASE_COMMIT=d70a334ba782ae62a9bd3053cece835909f99cf5
  Published release tag or target commit does not match the build identity.
  exit=1
  ```

- On the live site, **Check desktop downloads** says “Downloads for this build
  are being published” and “No package is offered until this source, the full
  package set, and the SHA-256 file match.” It exposes **zero download links**.
- The documented one-line installers bypass the site's source gate and install
  GitHub's older latest release. The Linux installer checksum-verifies and
  installs the `758ba983…` AppImage, SHA-256
  `74e84ef4c620bfd017f77e1b8aed22ba2da88be08cb4fb8e56b0968e8e5b43de`.
  It must not be represented as this candidate's package.

This is a desktop-app acceptance failure even though the older packages are
complete and functional. Publish a new immutable `v0.1.30` release from
`d70a334…` (or a successor containing it), with both macOS architectures,
Windows MSI/EXE, Linux AppImage/DEB/RPM, `SHA256SUMS`, and `latest.json` all
naming the same source. Deploy that release's matching site artifact.

## Mandatory first-read and demo gate — PASS

A cold, empty-profile visit answers all three required questions on desktop
and 390 px mobile:

- What: **“Review photo copies before you remove them.”**
- For whom: people with photos across several drives who fear removing the only
  meaningful copy.
- First click: **“Try it with sample data”**, beside **“Opens three
  ready-to-review groups.”**

The action is 44.39 px high at 390 px and opens `/demo` in one click. The next
screen already contains three realistic groups and eight files. Its persistent
banner says **“Demo — sample data, nothing is saved”** and includes **Reset
demo** and **Start for real**.

## Claims — PASS, 25/25

`.factory/claims.json` exists and is valid. Per the work-order ordering, all
commands were first invoked before any other repository inspection; browser
commands then reported the expected missing clean-checkout Node dependencies.
After the required `npm ci`, every exact listed command was rerun separately
through its demo/native entry point and passed:

| Claim | Result |
| --- | --- |
| `demo-isolated` | PASS |
| `match-evidence` | PASS |
| `csv-export` | PASS |
| `reversible-plan` | PASS |
| `review-before-move` | PASS (native and browser halves) |
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

The landing page, privacy/terms pages, and README were cross-checked against
the registry. No uncovered material claim was found.

## Clean local gates and native consumer smoke

- `npm ci`: PASS — 66 locked packages, zero reported vulnerabilities.
- `npm run check`: PASS — TypeScript, rustfmt, and warnings-denied Clippy.
- `npm test`: PASS — 11 Rust, 17 Vitest, and 37 Playwright tests.
- `npm run build`: PASS — produced `dist/site`.
- `CI=true BUILD_COMMIT=d70a334… npm run build:desktop`: PASS after installing
  the same GTK/WebKit prerequisites declared in the release workflow plus the
  standard `file` utility used by `linuxdeploy`. It produced candidate DEB,
  RPM, and AppImage bundles.
- The candidate DEB was extracted into a fresh temporary consumer directory.
  Its binary stayed open under Xvfb for eight seconds (expected timeout exit
  124, no application error).
- The published `v0.1.29` DEB downloaded independently. Its SHA-256
  `27ca55639cb23e83cb4c85c62f6ca98ed17a43d5189cd915bad5ebe83b18b86d`
  exactly matches public `SHA256SUMS`; its metadata is version `0.1.29`, amd64.
- The live Linux installer installed the public AppImage into a fresh temporary
  bin directory only after checksum verification. That older AppImage also
  stayed open for the eight-second Xvfb smoke window.

Production budgets are comfortably within contract: initial JavaScript is
about **15.6 KiB gzip** across the emitted chunks, CSS is **5.11 KiB gzip**, and
the hero image is **29,922 bytes**.

## Independent end-to-end exercise

The live demo was exercised from empty storage rather than trusted from its
tests:

- All exact-copy, same-moment, and looks-alike groups rendered with eight total
  records and their paths, dimensions, file sizes, dates, cameras, identifiers,
  and other-drive copy counts.
- Trying to quarantine the first file without a kept copy was rejected and left
  the plan at zero.
- **Mark exact extras** created a two-file plan. Confirmation said exactly
  `Move 2 files to /Sample drive/Proof Pile Quarantine?` before accepting.
- The demo reported that two sample files moved and that no device files
  changed. Export produced `proof-pile-decisions.csv` with one header and eight
  records, including quarantine destinations.
- Reload retained recovery state. **Restore last move** showed both quarantine
  and original locations, and restore completed. **Reset demo** cleared the
  plan and removed the demo session namespace.
- An invalid CSV was rejected with a plain recovery instruction. Arrow-key
  group selection and Space-operated decisions worked; decision focus advanced
  to the next file.
- Boundary/native coverage additionally exercised 1,001-file free-limit input,
  unreadable/selected-folder scope, exact/perceptual/metadata grouping,
  cross-drive copy-before-remove, byte/date preservation, collisions, repeated
  plans, and hostile recovery paths.

## Accessibility, responsive behavior, privacy, and PWA

- Ten fresh Axe runs covered `/`, `/demo`, `/app`, `/privacy`, and `/terms` in
  light and dark modes: **zero serious or critical findings**.
- Those routes have `lang=en`, one `<h1>`, one `<main>`, route-specific titles,
  and no image missing `alt`. Keyboard focus has a visible 3 px treatment;
  skip-link, decision, listbox, and dialog behavior pass.
- At 390 px, every tested route plus the real 404 had no page overflow, no
  visible interactive target below 44 px, and no overflow with simulated 200%
  text. Reduced-motion transition duration was `0.00001s`.
- The full demo flow made only same-origin GET requests. No sample photo data,
  analytics, tracking scripts, third-party fonts, or uploads appeared. A live
  license check sent one bodyless GET whose only product datum was the license
  token; an invalid token was not saved.
- The service worker controlled `/demo`, updated with no waiting worker, used
  cache `proof-pile-v29`, and reloaded all three sample groups offline with HTTP
  200.
- No console errors or page exceptions occurred in the tested live flows.

## Live endpoints, headers, links, and performance

- `/`, `/demo`, `/app`, `/privacy`, `/terms`, `robots.txt`, `sitemap.xml`, and
  `manifest.webmanifest` return 200. An unknown path returns a designed HTTP
  404. All rendered links return 200, are explicit `mailto:` links, or are the
  expected Sociobot checkout redirect.
- Root, assets, service worker, and 404 responses include HSTS, `nosniff`,
  strict-origin referrer policy, restrictive permissions policy, and
  header-delivered CSP with `frame-ancestors 'none'`. HTML/SW cache for 30
  seconds; hashed JavaScript is one-year immutable.
- Hosted checkout responds 303 from the Sociobot API. Invalid-license verify
  responds 200 with `{valid:false,reason:"invalid"}` and `Cache-Control:
  no-store`.
- A fresh single-client allowance test returned 200 for requests 1–30. Request
  31 and later returned **429** with **`Retry-After: 3`** (later 2). Observed
  allowance: 30 requests per client window.
- Mobile Lighthouse: Performance **96**, Accessibility **100**, Best Practices
  **100**, SEO **100**; FCP 0.99 s, LCP 1.18 s, TBT 211.5 ms, CLS 0, transfer
  141,151 bytes.
- No sign-in is required, so an identity-provider flow is not in scope. The
  brief does not imply a useful runtime AI action; local matching and reversible
  review are the core job.

## Evidence

- `.factory/evidence-25/live-qa.json` — route, Axe, demo, mobile, privacy,
  PWA, and release-refusal results.
- `.factory/evidence-25/lighthouse-live.json` — fresh mobile Lighthouse report.
- `.factory/evidence-25/live-first-read-desktop.png`
- `.factory/evidence-25/live-first-read-mobile-390.png`
- `.factory/evidence-25/live-demo-desktop.png`
- `.factory/evidence-25/live-demo-mobile-390.png`
- `.factory/evidence-25/live-download-refusal.png`
- `.factory/qa-25-live.mjs` — reproducible independent live browser audit.
