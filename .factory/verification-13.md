# Independent product verification 13 — PASS

Date: 29 August 2026 (UTC)

- Candidate: `e05605f301ebc105f7574c1a911216581086e46d`
- Branch: `main`; `origin/main` matched at the start of verification
- Live URL: <https://photo-proof-pile.sociobot.in>
- Demo URL: <https://photo-proof-pile.sociobot.in/demo>
- Release: `v0.1.15`, built from `c9e1d6eab6ccc36da27507a1dff854ac5bb22b3f`
- Artifact class: desktop app with a PWA demo/review surface
- Overall result: **PASS**

Candidate `e05605f` changes only `.factory/handoff.md` after release source
`c9e1d6e`; all product source is identical. The fresh candidate build's HTML,
service worker, CSS, and three JavaScript chunks match the live deployment
byte for byte. The previously reported deployment-only blocker is closed: a
complete public desktop release now exists, the live page offers it, and the
Linux installer downloaded, verified, and launched the released AppImage.

No product code was changed during verification.

## Mandatory first-read gate

**PASS.** A cold 1440 × 900 browser showed, without interaction:

- job: “Review photo copies before you remove them”;
- audience: “people with photos across several drives”;
- first action: “Try it with sample data”;
- adjacent outcome: “Opens three ready-to-review groups.”;
- three facts: photos stay local, no account, free 1,000-file limit and US$29
  one-time price.

The action was visible at y=557 in a 900 px viewport. One click opened `/demo`
with three populated groups plus the persistent “Demo — sample data, nothing
is saved” banner, **Reset demo**, and **Start for real**.

Evidence: `verification-artifacts-13/first-read-desktop.png`,
`live-cold-desktop.png`, and `live-qa.json` → `checks.firstRead`.

## Claims gate

**PASS — 22/22 exact commands in `.factory/claims.json`.** After the required
`npm ci`, every listed command passed independently, and every ID has exactly
one matching `@claim:<id>` registration. No claim assertion failed.

The literal pre-install invocation was attempted first and could not load
`@playwright/test`, as expected in a clone without `node_modules`. `npm ci`
installed the locked dependencies with zero audit vulnerabilities; the
installed clean-checkout run below is the claim result.

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
| `paid-checkout` | PASS |
| `licensed-scan-limit` | PASS |
| `offline-reload` | PASS |
| `native-matching` | PASS |
| `scan-scope` | PASS |
| `cross-drive-safety` | PASS |
| `installer-checksum` | PASS |
| `windows-installer-checksum` | PASS |
| `verified-downloads-only` | PASS |

Full output: `verification-artifacts-13/claims-after-install.txt`.

The landing page, policies, README, and copy audit were cross-checked against
the inventory. No unlisted product claim was found.

## Clean-checkout gates and builds

- `npm ci`: PASS; 66 packages, zero audit vulnerabilities.
- `npm test`: PASS; 10 Rust tests, 11 Vitest tests, 30 Playwright tests.
- `npm run check`: PASS; TypeScript, Rust format, strict Clippy.
- `npm run build`: PASS; fresh production site in `dist/site`.
- Native Linux binary: PASS; release build stayed alive for the full eight-
  second Xvfb smoke window.
- `npm run build:desktop -- --bundles deb,rpm`: PASS; version 0.1.15 amd64 DEB
  and RPM produced after installing the exact Linux packages from the release
  workflow.

An additional catch-all local `npm run build:desktop` compiled the application
and produced DEB/RPM, then this container's external `linuxdeploy` step failed
while creating an AppImage. This is not the shipping path: the mandated GitHub
Actions run completed all four platform jobs plus checksum and release
verification, and the public AppImage independently passed checksum and launch
smoke tests below. No source or shipped-package defect was observed.

## Real workflow and recovery cases

Fresh live browser contexts exercised the smallest useful workflow:

- normal: opened the sample, inspected exact/same-moment/looks-alike groups,
  selected exact extras, confirmed two files and the exact quarantine path,
  completed the move, exported nine CSV rows, reloaded, and opened recovery;
- cancellation: dismissed the move confirmation and retained the two-file
  plan unchanged;
- invalid safety choice: attempting to quarantine the initial kept copy was
  rejected and left the plan at zero;
- invalid import: a malformed/unverifiable CSV was rejected with an announced
  error and a concrete recovery instruction;
- persistence: recovery records survived reload; the recovery dialog named
  source/destination, initially focused **Cancel**, and closed with Escape;
- boundary values: native tests covered zero/invalid roots, 1,000 versus 1,001
  files, duplicate destinations, missing/untrusted recovery files, changed
  hashes, and cross-filesystem copy-before-remove behavior;
- repeat safety: completed plans cannot run twice, and imported records are
  validated against the chosen quarantine root and SHA-256 before restore.

Evidence: `verification-artifacts-13/live-qa.json`, `live-demo-final.png`, and
the complete local suite.

## Accessibility, mobile, and browser quality

- `/opt/fleet/lib/verify-url.sh`: PASS on `/` and `/demo`; correct title,
  `lang=en`, one h1/main, complete alt text, labeled buttons, no page/console
  errors.
- Axe: zero serious or critical findings on `/`, `/demo`, `/app`, `/privacy`,
  and `/terms` in both light and dark presentation; mobile axe also clean.
- Keyboard: skip link, ArrowDown listbox navigation, Space/Enter decisions,
  safe dialog focus, and Escape dismissal passed; selected-group focus is a
  visible 3 px `rgb(49, 95, 137)` outline.
- 390 × 844: no horizontal overflow, all checked buttons/header/footer links
  at least 44 × 44 px, and no overflow after 200% text sizing.
- Reduced motion: card transition resolves to `0.00001s`; nothing loops.
- Routes: `/`, `/demo`, `/?demo=1`, `/app`, `/privacy`, and `/terms` return
  200; an unknown route returns the designed HTTP 404. Link crawl found no
  dead internal or external links; hosted checkout returns its expected 303.
- Console/page errors: none except the browser's expected resource message for
  the intentionally tested 404.

Evidence: `verification-artifacts-13/verify-root/`, `verify-demo/`,
`live-qa.json`, `link-crawl.json`, and mobile/desktop screenshots.

## Privacy, headers, PWA, and rate limit

- The complete demo decision/quarantine/export/import flow made only six
  same-origin requests; no photo, thumbnail, path, or decision data left the
  origin. No tracking/advertising script or third-party font was found.
- License verification used a bodyless GET carrying only the test token. The
  response was JSON with `Cache-Control: no-store` and CORS restricted to
  `https://photo-proof-pile.sociobot.in`.
- Observed allowance: one client received **30 successful verification
  requests**; request 31 returned **429** with **`Retry-After: 4`**. A new
  request after five seconds returned 200.
- Browser response headers include CSP with `frame-ancestors 'none'`, HSTS,
  `nosniff`, strict-origin referrer policy, and denied camera/microphone/
  geolocation permissions.
- Service-worker update completed. Active cache `proof-pile-v12` served an
  offline `/demo` reload with status 200 and all three sample groups.
- HTML and the service worker use 30-second revalidation. Hashed assets return
  `Cache-Control: public, max-age=31536000, immutable`.

Evidence: `verification-artifacts-13/browser-response-headers.json`,
`license-response-*`, `license-rate-limit.json`, and `live-qa.json`.

## Performance and deployment identity

- Initial JavaScript: 42,810 bytes raw / 15,046 bytes gzip total (budget 200
  KB).
- CSS: 18,563 bytes raw / 5,092 bytes gzip (budget 50 KB).
- No downloaded fonts. Hero WebP: 29,922 bytes (budget 300 KB).
- Fresh Lighthouse mobile: performance 92, accessibility 100, best practices
  100, SEO 100; FCP 1.0 s, LCP 1.2 s, CLS 0, transfer 137 KiB. Lighthouse's
  lab TBT was 360 ms; navigation-lab runs do not report field INP.
- Live and local SHA-256 values match for `index.html`, `sw.js`, all three JS
  chunks, and CSS.
- Candidate product tree equals release source `c9e1d6e`; only handoff
  documentation differs between that release and candidate `e05605f`.

Evidence: `verification-artifacts-13/lighthouse-live.json` and
`browser-response-headers.json`.

## Desktop distribution

- GitHub release workflow run
  [33278280973](https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33278280973):
  PASS for prepare, Linux, Windows, both macOS architectures, checksums, and
  public-release verification.
- Public release `v0.1.15`: 11 assets, including two DMGs, EXE, MSI, AppImage,
  DEB, RPM, two app archives, `latest.json`, `SHA256SUMS`, and
  `DESKTOP_RELEASE_VERIFIED.json`.
- Manifest and marker bind the matrix to source commit `c9e1d6e`, state
  `matrix: complete`, `checksums: sha256`, and truthfully report unsigned
  macOS/Windows builds.
- The live dialog offers four detected-platform choices and visibly warns
  that macOS/Windows are unsigned.
- Fresh live `install.sh` download: 78,576,120-byte AppImage; downloaded and
  published SHA-256 both
  `d57111a8df898743e02327b73dc693aa596a758b960cb3488b0de62ffaadbd07`.
  The public AppImage stayed running for the full eight-second Xvfb window.

Evidence: `verification-artifacts-13/github-release.json`, `latest.json`,
`DESKTOP_RELEASE_VERIFIED.json`, `SHA256SUMS`, `workflow-*.json`,
`live-install-sh.txt`, and `live-download-gate.png`.

## Defects by severity

- Severity 1 / release blocking: none.
- Severity 2 / material: none.
- Severity 3 / minor: none found.

Known, disclosed constraint: macOS and Windows packages are unsigned. This is
allowed by the desktop work order and the site warns before download. Signing
still requires the operator certificates named in the release workflow.

## Final decision

**PASS — candidate `e05605f301ebc105f7574c1a911216581086e46d` is accepted.**
The prior distribution blocker is resolved from fresh public evidence, all
claims and quality gates pass, the live product matches the candidate product
source, and the smallest useful local review/quarantine/recovery job works end
to end.
