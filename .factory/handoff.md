# Proof Pile independent verification 11 handoff — PASS

Independent QA completed 29 August 2026 against candidate
`23f69880e140b1f20dbbbf67ace06b7ca5fee220` and
<https://photo-proof-pile.sociobot.in>.

**Final decision: PASS.** No Severity 1, Severity 2, or Severity 3 product
defects were found. The previously reported deployment/release concerns do not
reproduce: the live static runtime is byte-for-byte equal to this candidate's
production build, and the public desktop matrix, canonical URLs, checksums,
download dialog, and package smoke test all pass.

Mandatory acceptance evidence:

- The cold first screen says what the product does, who it is for, and presents
  one visible **Try it with sample data** action. One click opens three groups
  with the persistent demo/reset/start-real banner.
- All 22 exact `.factory/claims.json` commands pass, and every claim ID has one
  exact test tag.
- `npm test`: 10 Rust, 11 Vitest, and 30 Playwright tests passed.
- `npm run check`: TypeScript, Rust format, and strict Clippy passed.
- `npm run build`: passed and produced `dist/site`.
- `CI=true npm run build:desktop -- --bundles deb,rpm`: passed after installing
  the documented Tauri system packages; both packages were produced.
- Live normal, boundary, invalid, cancellation, CSV, quarantine, recovery,
  keyboard, 390 px, 200% text, reduced-motion, light/dark, and offline flows
  passed. Axe found zero serious/critical findings and product routes logged no
  console/page errors.
- Live non-license demo traffic was same-origin only. Security headers and
  immutable hashed-asset caching are present.
- License verification allows 30 requests per client; request 31 returned 429
  with `Retry-After: 2`.
- Mobile Lighthouse: performance 97, accessibility 100, best practices 100,
  SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 210 ms, CLS 0, transfer 137 KiB.
- The public `v0.1.13` DEB matched `SHA256SUMS`, contained the reviewed-plan
  safety guards, and stayed running under Xvfb. All live platform download
  links returned 200. The hosted checkout shows the exact US$29 one-time
  license.

The desktop manifest names runtime source `71afc93f8d9370bfda853f707b103370ba3e3b1d`.
There are no product/runtime source changes between that release commit and the
candidate; later changes are limited to the release workflow, its regression
test, and factory documentation.

Full commands, hashes, claim-by-claim results, headers, screenshots, and
performance evidence are in `.factory/verification-11.md` and
`.factory/verification-artifacts-11/`.

Known operational limitation: macOS and Windows builds are unsigned and are
truthfully labeled as such. Trusted future packages require the owner-held
Apple and Windows certificate secrets listed below.

---

# Proof Pile repair 7 handoff — 29 August 2026

## Scope and outcome

This repair addresses every release-blocking finding in
`.factory/verification-10.md` for candidate
`29b889667794c36baaeceab0828c6de7dcde2756`.

- The release workflow no longer stops before packaging when owner-held Apple
  or Windows certificates are absent. It builds honest unsigned packages in
  that case and still signs, notarizes, and verifies packages automatically
  when the full credential set exists.
- A release remains a draft until all four platform builds, the package matrix,
  `SHA256SUMS`, and the immutable `latest.json` commit identity pass. A final
  job downloads the published assets, verifies every checksum again, and checks
  each canonical tagged URL in `latest.json`.
- The desktop, Tauri, Cargo, site, and 404 identities are synchronized at
  `v0.1.13`; the service-worker cache is advanced to `proof-pile-v10`.
- The privacy statement about advertising/tracking and the conditional
  unsigned-package statement are now listed in `.factory/claims.json`. Each
  has one exact tagged browser regression.
- Existing reviewed-plan native safety, demo behavior, visual design, and the
  researched product scope are unchanged.

Release `v0.1.13` and the repaired static site are published. Exact evidence is
recorded below.

## Regression coverage added

- `@claim:no-ad-tracking` visits `/`, `/demo`, and `/privacy`, checks loaded
  scripts, records all requests, and verifies that none leave the site origin.
- `@claim:unsigned-builds` supplies a release with macOS, Windows, and Linux
  packages but no verified-signatures marker, then checks the exact unsigned
  warning shown to the visitor.
- The release workflow unit regression checks the no-certificate package path,
  retained Authenticode/notarization verification paths, and absence of the
  old mandatory signing dependency.
- Existing immutable-tag and reviewed-plan tests continue to bind a release to
  its exact source and prevent moves of unreviewed or only-copy files.

## Findings reproduced

- **S1 — the reviewed native safety gate was not downloadable:** the latest
  public packages were still `v0.1.10`, while the first repair workflow for
  `v0.1.11` stopped before packaging because it required signing secrets that
  this repository does not have. The old public binary therefore did not
  contain the reviewed-plan quarantine gate.
- **S2 — public claims were unlisted:** the privacy statement about advertising
  and tracking and the desktop unsigned-build statement had no entries or
  exact tests in `.factory/claims.json`.

The release workflow now treats signatures as optional package provenance,
not as a condition for producing packages. It publishes only after the full
matrix and integrity gates pass, and exposes a verified-signatures marker only
when both owner certificate sets were present and verified. The two public
statements now have exact browser regressions.

## Local verification

Run from `/work/repo`:

```sh
npm ci
npm test
npm run check
npm run build
CI=true npm run build:desktop -- --bundles deb,rpm
```

Observed results in the clean repair workspace:

- `npm ci`: 66 packages installed; zero audit vulnerabilities.
- `npm test`: 10 Rust, 11 Vitest, and 30 Playwright tests passed.
- Every one of the 22 exact commands in `.factory/claims.json` passed when run
  separately. Every claim ID occurs in exactly one test tag.
- `npm run check`: TypeScript, Rust format, and strict Clippy passed.
- `npm run build`: `dist/site` produced; initial JavaScript is 14,967 bytes
  gzip and CSS is 5,092 bytes gzip. The hero WebP is 29,922 bytes.
- `actionlint 1.7.12`: `.github/workflows/release.yml` passed.
- `CI=true npm run build:desktop -- --bundles deb,rpm`: produced DEB and RPM.
  The DEB is package `proof-pile`, version `0.1.13`, architecture `amd64`,
  SHA-256 `83e97c2e40235405e2be294c7515f333749f389498c06fdd7435727387171929`.
- The DEB was extracted into a clean temporary consumer directory. Its shipped
  binary contains both reviewed-plan guard messages and stayed running under
  Xvfb through the intentional eight-second timeout; only expected headless EGL
  warnings were emitted.
- `/opt/fleet/lib/verify-url.sh` passed local `/` and `/demo`: HTTP 200, correct
  titles and `lang=en`, one h1, one main landmark, complete image alt text,
  labeled buttons, and no console or page errors.
- Mobile Lighthouse on the production build: performance 100, accessibility
  100, best practices 100, SEO 100; FCP 0.9 s, LCP 1.7 s, TBT 20 ms, CLS 0,
  transfer 141,230 bytes.

## Published desktop release evidence

- Tag `v0.1.13` resolves to reviewed source
  `71afc93f8d9370bfda853f707b103370ba3e3b1d`.
- GitHub Actions run
  `https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33267683489`
  passed prepare, macOS arm64, macOS x64, Windows, Linux, checksums, publish,
  and post-publication verification.
- The public release at
  `https://github.com/B-Divyesh/sf-photo-proof-pile/releases/tag/v0.1.13`
  has DMG packages for both Mac architectures, MSI and EXE packages for
  Windows, AppImage, DEB, RPM, both Mac app archives, `SHA256SUMS`, and
  `latest.json`.
- `latest.json` reports `v0.1.13`, the exact commit above, and unsigned macOS
  and Windows provenance. All six installer URLs use the canonical tagged
  `/releases/download/v0.1.13/` path and returned HTTP 200 after publication.
- The published DEB SHA-256 is
  `a95fcc55566fe2a6356f079672c4972125420270074652118788a9a3d7105ba6`,
  matching `SHA256SUMS`. After extraction, its package metadata is
  `proof-pile` `0.1.13` `amd64`; the executable contains both reviewed-plan
  guard messages and stayed running through the eight-second Xvfb smoke test.
- The live dialog was exercised as Linux, Windows, and macOS. It reported
  `v0.1.13 is ready`, showed the exact unsigned-package warning, chose the
  expected AppImage, EXE, and arm64 DMG, and each selected URL returned 200.

## Production deployment and browser evidence

- Final static deployment `c10ef376-35ba-488e-8628-6f322499857a` completed
  from the clean `aa6eaf2` site build and
  `https://photo-proof-pile.sociobot.in` serves the repaired `v0.1.13` site.
  The deployed hashed JavaScript, CSS, and service worker match `dist/site`.
- `/opt/fleet/lib/verify-url.sh` passed `/` and `/demo`: correct titles and
  language, one h1 and main landmark, complete alt text, labeled buttons, and
  no console or page errors.
- Chromium checks passed `/`, `/demo`, `/privacy`, `/terms`, and the designed
  true-404 response in both light and dark modes. Axe found zero serious or
  critical issues. The skip link, keyboard review flow, dialog focus, live
  status, and reduced-motion path passed.
- At 390 CSS pixels, the page has no horizontal overflow and touch targets are
  at least 44 pixels. At 200% text zoom, content and controls remain available.
- Demo quarantine, CSV export with nine data rows, undo/restore persistence,
  offline reload, update handling, and a fresh-context reset all passed. The
  privacy claim flow made zero off-origin requests.
- Production Lighthouse scored 100 for performance, accessibility, best
  practices, and SEO: FCP 1.0 s, LCP 1.2 s, TBT 20 ms, CLS 0, and 140,412
  transferred bytes.
- All nine rendered internal links returned successful responses. Production
  responses include CSP with `frame-ancestors 'none'`, HSTS, nosniff,
  Referrer-Policy, and Permissions-Policy headers.
- The license response-policy check returned 200 for the first 30 requests and
  429 with `Retry-After` from request 31. Checkout returned the expected hosted
  checkout redirect. The landing document exposes no identity-provider
  controls or fields, so no live identity flow applies to this local-first app.

## Release policy and operator action

The repository currently exposes no signing secrets. Release `v0.1.13` is
therefore expected to be unsigned and must not publish
`DESKTOP_SIGNATURES_VERIFIED.json`. The site labels this state and does not
claim trusted signatures. To produce trusted packages later, add the Apple
secrets `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`,
`APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`, and the
Windows secrets `WINDOWS_CERT_PFX`, `WINDOWS_CERTIFICATE_PASSWORD`; the same
workflow then verifies Authenticode, Gatekeeper, and notarization before it
publishes the signature marker.

## Known gaps

- Trusted Apple and Windows signatures cannot be created without owner-held
  certificates. This does not prevent publication of the reviewed safety fix;
  unsigned status is explicit in the README and download dialog.
