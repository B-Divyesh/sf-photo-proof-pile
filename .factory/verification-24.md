# Verification 24 — FAIL

**Candidate:** `758ba98390c5a2ba49323b7682a6a86e5eca6103`  
**Live URL:** <https://photo-proof-pile.sociobot.in>  
**Verified:** 2026-09-02

## Verdict

**FAIL — release-blocking desktop distribution identity mismatch.** The deployed
web files are exactly the candidate build, but no desktop package has been
published from that candidate. This is a desktop-app product and cannot be
accepted while its download path deliberately offers no current package.

## Blocking defect

### Blocker — no published desktop release for the deployed candidate

- The local candidate and deployed static bundle identify
  `758ba98390c5a2ba49323b7682a6a86e5eca6103`. The live CSS and main JavaScript
  filenames and SHA-256 values exactly matched a fresh `npm run build` from
  this checkout.
- The only version-matching public release, `v0.1.28`, has GitHub
  `target_commitish` and `latest.json.commit` of
  `d58ab4e725a2498ca4be8232f050a1c6355d0f72`, not the candidate.
- The repository's own public-release verifier reproduced the failure:

  ```text
  RELEASE_TAG=v0.1.28 RELEASE_COMMIT=758ba983... \
    REPOSITORY=B-Divyesh/sf-photo-proof-pile \
    bash scripts/verify-published-release.sh
  Published release tag or target commit does not match the build identity.
  exit=1
  ```

- On the live site, **Check desktop downloads** says: “Downloads for this
  build are being published. No package is offered until this source, the full
  package set, and the SHA-256 file match.” It exposes zero package links.
- `public/install.sh` did checksum-verify and install an AppImage into an
  isolated temporary bin directory, but it installed the older `v0.1.28`
  artifact (`81854031f167055313df3a63abf65a5f4b767969ec0f4a9258a4fbbfa83c945c`)
  because it follows GitHub’s latest release without checking the candidate
  source identity. It must not be presented as a current-candidate installer
  until a release matching the deployed build is published.

## Required repair

Publish a new immutable version/tag built from `758ba983…`, with the complete
macOS arm64/x64, Windows MSI/EXE, and Linux AppImage/DEB/RPM set, `SHA256SUMS`,
and `latest.json` all naming that exact commit. Deploy the matching site build
and verify that the live dialog exposes its package links. If the intended
desktop source is still `d58ab4e…`, deploy that source instead; do not leave a
site that names `758ba983…` beside an older installer.

## Required claims — clean checkout

`npm ci` installed the locked 66 packages with no reported vulnerabilities.
Every exact command listed in `.factory/claims.json` passed separately from
the `/demo` entry point: **25/25 passed**.

This includes demo isolation; evidence for exact, similar, and same-moment
groups; CSV export; reversible quarantine/restore; native review gates;
browser and native local privacy; no account; free and licensed scan limits;
license storage/privacy/rate limit; hosted checkout; offline reload; native
matching/scope/cross-drive safety; installer checksum contracts; release asset
and identity refusal; and unsigned-package disclosure.

## Build and repository checks

- `npm test` passed: 11 Rust tests, 17 Vitest tests, and 37 Playwright tests.
- `npm run check` passed TypeScript, rustfmt, and warnings-denied Clippy.
- `npm run build` passed. Fresh output: 14.05 KiB gzip JS and 5.11 KiB gzip
  CSS; `dist/site/` was produced.
- `npm run build:desktop` fails in this worker’s inherited `CI=1` environment
  because Tauri rejects `--ci 1` (it accepts only `true` or `false`). With
  `CI=true`, it progressed through the web build and then correctly stopped on
  this worker’s missing `glib-2.0.pc`/GTK-WebKit native prerequisite. The
  release workflow declares and installs those Linux prerequisites, so this is
  not the release blocker above; however, the `CI=1` incompatibility makes the
  advertised local desktop build command fragile in common CI environments.

## Live product QA

### First read and product flow

Fresh cold desktop read passed. The first screen says it reviews photo copies
before removal, says it is for people with photos across several drives who
fear removing the only meaningful copy, and supplies **Try it with sample
data** with the result “Opens three ready-to-review groups.”

On live `/demo`, the eight realistic sample records and all three groups
loaded. The verifier marked exact extras, accepted the exact-count quarantine
confirmation, observed two sample moves, exported/imported the log path, and
tested invalid log recovery. The invalid input reports:

```text
The decision log was not imported. This CSV is not a Proof Pile decision log.
Choose a Proof Pile CSV and try again.
```

At 390 px, the primary action was 316 × 44.39 px; 200% text had no horizontal
overflow. Keyboard Space changed a decision and moved focus to the next
**Keep** button, whose visible focus was `rgb(49, 95, 137) solid 3px`.

### Accessibility, errors, PWA, privacy, and headers

- `/`, `/demo`, `/privacy`, and `/terms` each returned 200 with one `h1` and
  one `main`, correct titles, `lang=en`, image alt text, and no console or
  page errors in both light and dark media schemes.
- Axe found **0 serious/critical** violations on those four routes in both
  schemes. The intentionally missing route returns HTTP 404 and Chrome logs
  its expected failed-resource network message; it has no page exception and
  no axe serious/critical finding.
- `verify-url.sh` passed against live root: title, language, main landmark,
  one H1, alt text, unlabeled buttons, and console checks were clean.
- After service-worker control, live `/demo` reloaded offline with HTTP 200,
  its banner visible and all three groups present. `registration.update()`
  completed; the active worker controlled the site and had no waiting update.
- The full live demo flow requested only same-origin HTML, JS, CSS, and sample
  SVGs. No photo data, analytics, or third-party tracking request was seen.
  A seeded live license test made exactly one bodyless GET to
  `https://api.sociobot.in/api/v1/products/photo-proof-pile/verify?license=…`;
  seeded photo paths, identifiers, hashes, thumbnails, and recovery records
  were not sent.
- The documented verification allowance is live: requests 1–30 returned 200;
  request 31 returned **429** with **`Retry-After: 3`**.
- Root, service-worker, and 404 responses send HSTS, `nosniff`, strict-origin
  referrer policy, a restrictive permissions policy, and header-delivered
  `frame-ancestors 'none'`. HTML/SW cache for 30 seconds; hashed assets use
  one-year immutable cache.
- Mobile Lighthouse recorded Performance **90**, Accessibility **100**, Best
  Practices **100**, and SEO **100**; LCP 1.18 s, CLS 0, total transfer
  141,203 bytes. Lighthouse emitted a post-audit Chromium tab-crash message,
  but wrote a complete report with those category results.

## Documentation and handoff status

No product source was modified by this verification. The only repository
changes are this verification report and the current handoff outcome.
