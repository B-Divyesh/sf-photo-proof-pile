# Independent product verification 15 — FAIL

Date: 30 August 2026 (UTC)

- Candidate: `b12e0a1c18afff887c7b93b4a98cc1537e429c77`
- Branch: `main`; local `HEAD`, `origin/main`, and the requested candidate matched
- Live URL: <https://photo-proof-pile.sociobot.in>
- Demo URL: <https://photo-proof-pile.sociobot.in/demo>
- Product/release version: `0.1.17`
- Artifact class: desktop app with an offline web demo
- Overall result: **FAIL**

The previous public-desktop-distribution blocker is fixed. The complete
v0.1.17 release exists, its workflow passed, all published checksums match,
the live page offers the verified AppImage, and clean consumer smoke tests
passed. The candidate still cannot be accepted because the advertised paid
path is unavailable in production. The Sociobot checkout and license verify
endpoints repeatedly returned HTTP 503 through the end of verification. A new
buyer cannot purchase the US$29 license, and a browser license check produces
CORS/network console errors because the generic 503 response omits the API's
normal CORS headers.

No product code was modified during verification. Only this report, the
handoff, and verification evidence were added.

## Mandatory first-read and demo gate

**PASS.** This gate was performed immediately after running all claim commands.
A cold 1440 × 900 browser with empty storage showed, above the fold:

- what it does: “Review photo copies before you remove them”;
- for whom: “people with photos across several drives” who fear removing the
  only meaningful copy;
- what to click: “Try it with sample data”;
- what happens: “Opens three ready-to-review groups.”;
- three facts: photos stay on the device, no account is needed, and the free
  limit / US$29 one-time price.

The primary action was at y=557 in a 900 px viewport. Keyboard activation
opened `/demo` in one step. The next screen was already populated with three
groups and eight realistic file records. Its persistent banner said “Demo —
sample data, nothing is saved” and exposed **Reset demo** and **Start for
real**. Evidence: `verification-15-artifacts/first-read-desktop.png` and
`live-demo-one-click.png`.

## Claims gate

**PASS — 22/22 manifest commands.** `.factory/claims.json` exists. After the
required `npm ci`, each listed command was run separately with its exact grep
or test selector before broader QA began.

| Claim | Result |
| --- | --- |
| `demo-isolated` | PASS |
| `match-evidence` | PASS |
| `csv-export` | PASS |
| `reversible-plan` | PASS |
| `review-before-move` | PASS — native and browser halves |
| `local-privacy` | PASS |
| `no-ad-tracking` | PASS |
| `native-local-privacy` | PASS |
| `license-request-privacy` | PASS |
| `no-account` | PASS |
| `free-scan-limit` | PASS |
| `free-safety-tools` | PASS |
| `paid-license` | PASS |
| `paid-checkout` | PASS in its sandbox; live checkout fails as described below |
| `licensed-scan-limit` | PASS |
| `offline-reload` | PASS |
| `native-matching` | PASS |
| `scan-scope` | PASS |
| `cross-drive-safety` | PASS |
| `installer-checksum` | PASS |
| `windows-installer-checksum` | PASS |
| `verified-downloads-only` | PASS |

The paid-checkout sandbox correctly verifies the URL, price, license return,
and browser storage using a mocked endpoint. It does not make the live
Sociobot purchase service healthy. The live 503 therefore remains a blocker.
Landing copy, README, privacy, terms, and the copy audit were cross-checked
against the claim inventory. No other unlisted material claim was found.

## Clean-checkout gates and production builds

- `npm ci`: PASS — 66 packages, zero audit vulnerabilities.
- `npm test`: PASS — 10 Rust tests, 11 Vitest tests, 31 Playwright tests.
- `npm run check`: PASS — TypeScript, rustfmt, and strict Clippy.
- `npm run build`: PASS — exact static build created `dist/site`.
- `CI=true npm run build:desktop -- --bundles deb,rpm`: PASS after installing
  the exact Linux system dependencies declared in `.github/workflows/release.yml`.
  The first attempt stopped only because the clean worker lacked `glib-2.0.pc`.
- Generated DEB: 4,105,104 bytes; RPM: 4,106,038 bytes.
- Clean extracted-DEB smoke: PASS — the packaged binary stayed open for the
  intended eight-second Xvfb window (timeout status 124), with empty stderr.

The static build contains 42,816 bytes raw JavaScript, 18,563 bytes raw CSS,
no web-font payload, and a 29,922-byte hero image. These are within the 200 KB
JS, 50 KB CSS, 120 KB fonts, and 300 KB mobile hero budgets.

## Useful workflow, boundaries, invalid input, and recovery

Fresh live contexts exercised the smallest useful product end to end:

- opened exact-copy, same-moment, and looks-alike groups and inspected paths,
  sizes, dimensions, dates, cameras, identifiers, and other-drive counts;
- rejected an attempt to quarantine the initially kept copy and left the plan
  at zero;
- marked exactly two byte-identical extras and confirmed the exact count and
  `/Sample drive/Proof Pile Quarantine` destination;
- cancelled once and verified the pending plan remained, then accepted and
  received completion feedback;
- exported `proof-pile-decisions.csv` with one header plus eight file rows;
- reloaded and retained recovery records;
- opened the restore dialog with focus on the safe **Cancel** action, closed it
  with Escape, and observed no keyboard trap;
- rejected an edited/unverifiable CSV with a concrete recovery instruction;
- cleared demo session storage, imported the freshly exported verified log,
  and restored a selected record;
- moved between groups with ArrowDown and retained visible focus.

The broader test suite also covered duplicate/repeat moves, hostile native
recovery paths, changed hashes, path containment, empty roots, 1,000 versus
1,001 files, name collisions, source immutability, and cross-drive
copy-before-remove behavior.

## Accessibility, keyboard, mobile, and browser quality

- The factory `verify-url.sh` passed on `/` and `/demo`: correct title,
  `lang=en`, one h1, one main landmark, complete alt text, labeled buttons,
  and no load errors.
- Axe found zero serious or critical findings across `/`, `/demo`, `/privacy`,
  `/terms`, and the designed 404 in both light and dark presentations. A
  separate 390 px demo scan also found zero.
- The primary action worked by keyboard. The group rail responded to arrow
  keys. Focus used a visible 3 px `rgb(49, 95, 137)` outline. Dialog Escape and
  safe initial focus worked.
- `/`, `/demo`, `/app`, `/privacy`, `/terms`, and `/404.html` had no horizontal
  overflow at 390 px or simulated 200% text. Every visible interactive target
  checked on those routes was at least 44 × 44 CSS pixels.
- Reduced motion changed the card transition to `1e-05s` and left no animation.
- The full normal/demo/mobile/offline/release route run had zero unexpected
  console or page errors. Chromium emitted only its expected top-level network
  message for the deliberately requested HTTP 404.
- All collected internal links returned their expected 200/404 statuses;
  `https://sociobot.in/` returned 200. The checkout link is the exception and
  is the release-blocking defect below.

## Privacy, browser requests, headers, rate limit, and PWA

- The complete demo review, quarantine, CSV export/import, and restore flow
  made 12 requests, all to `photo-proof-pile.sociobot.in`. No photo, thumbnail,
  path, identifier, or decision data left the origin.
- There were no advertising/tracking requests, third-party scripts, or
  third-party fonts. The explicit release lookup contacted only the documented
  GitHub API.
- Before the API outage, a raw invalid-license request returned 200 JSON with
  `Cache-Control: no-store` and the exact CORS origin. An explicit browser
  request used a bodyless `GET` whose only application value was
  `license=verification-15-browser-token`; it sent no photo or review data.
- Observed API allowance: 30 successful requests from one client. Request 31
  returned 429 with `Retry-After: 3`; a second rolling-window sample returned
  429 with `Retry-After: 4`. This satisfies the documented limiter contract.
- Browser-visible response headers include CSP with `frame-ancestors 'none'`,
  HSTS, `nosniff`, strict-origin referrer policy, and denied camera,
  microphone, and geolocation permissions.
- HTML, the designed 404, and `sw.js` use
  `public, must-revalidate, max-age=30`. Hashed JS/CSS use
  `public, max-age=31536000, immutable`.
- Service-worker update settled with an activated worker, no waiting worker,
  and cache `proof-pile-v14`. Offline `/demo` reload returned 200 and retained
  all three sample groups.

## Performance and deployment identity

Fresh Lighthouse mobile results:

- performance 99;
- accessibility 100;
- best practices 100;
- SEO 100;
- FCP 0.90 s, LCP 1.13 s, TBT 100 ms, CLS 0;
- transferred 140,652 bytes.

All 27 deployable files in the fresh `dist/site` build matched the live files
byte for byte, including HTML, service worker, installers, images, JavaScript,
CSS, manifest, robots, sitemap, and source maps. `staticwebapp.config.json` was
excluded because it is deployment configuration, not a public asset.

The v0.1.17 release marker binds the product to source commit
`f7726242ecbf6aff35187fde4d55ed44114c59e1`. Every change from that tag to the
candidate is under `.factory/`; there is no product-code difference. Together
with the 27/27 byte comparison, this establishes that the deployed product
payload matches candidate `b12e0a1`.

## Desktop distribution

**PASS.** Fresh evidence resolves verification 14's blocker:

- GitHub release `v0.1.17` was published at 2026-08-30T01:36:47Z.
- Workflow run
  <https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33285804179>
  passed prepare, Windows x64, Linux x64, macOS arm64, macOS x86_64,
  checksums, and release verification.
- The release contains AppImage, DEB, RPM, MSI, EXE, both macOS DMGs, both app
  archives, `SHA256SUMS`, `latest.json`, and
  `DESKTOP_RELEASE_VERIFIED.json`.
- All ten entries in public `SHA256SUMS` were freshly downloaded and matched.
- The live dialog said “v0.1.17 is ready,” linked Linux to the real AppImage,
  and disclosed that macOS and Windows builds are unsigned.
- The live shell installer installed the 78,576,120-byte AppImage into an
  isolated temporary bin directory. Its SHA-256 was
  `cc92305442f011d78e45c60a9f3b5ee5f0308f7890b7cba80f5adfed2c40652b`,
  exactly matching `SHA256SUMS`. The public AppImage stayed open for the
  eight-second Xvfb smoke window with empty stderr.

Unsigned macOS and Windows packages are explicitly disclosed and are allowed
by the desktop-app contract when signing certificates are unavailable.

## Release-blocking live billing failure

The site advertises “US$29 one-time purchase” and links directly to:

`https://api.sociobot.in/api/v1/products/photo-proof-pile/checkout`

Fresh requests at 02:42:45Z and 02:42:57Z both returned HTTP 503 with the
generic Azure “503 Service Unavailable” page, not the hosted checkout redirect.
Three later probes, ten seconds apart, returned 503 for both checkout and
license verification. Final probes at 02:47:45Z still returned 503 for both.
The API root and health paths also returned 503.

Earlier at 02:39:55Z, invalid-license verification had returned the expected
200 JSON. The rate-limit test then correctly produced 429 after 30 successes.
The later service-wide 503 may be an infrastructure incident; the evidence
does not establish its cause. It does establish the acceptance result: the
paid purchase cannot complete, and license verification is unavailable. The
generic 503 also lacks `Access-Control-Allow-Origin`, so a browser with a
license token logs a CORS error and `net::ERR_FAILED`.

## Defects by severity

### Severity 1 — release blocking

1. **The live billing service is unavailable.** The US$29 checkout link returns
   HTTP 503 instead of hosted checkout, so new users cannot buy the advertised
   full-library license. The license verification endpoint also returns 503;
   browser verification produces CORS/network console errors. This contradicts
   the live paid-checkout/license contract even though the mocked claim tests
   pass.

### Severity 2 — material

None found.

### Severity 3 — minor

None found.

## Final decision

**FAIL — candidate `b12e0a1c18afff887c7b93b4a98cc1537e429c77` is not accepted.**

The former release/installer deployment failure is fixed, and the core local
photo-review product otherwise passes. Acceptance requires restoring the
Sociobot billing service, confirming checkout returns the hosted redirect,
confirming browser verification again returns CORS-enabled no-store JSON, and
repeating the 30/31 rate-limit recovery check without the service becoming
unavailable.

Detailed screenshots, browser logs, header captures, release metadata,
checksums, parity hashes, smoke logs, and Lighthouse JSON are in
`.factory/verification-15-artifacts/`.
