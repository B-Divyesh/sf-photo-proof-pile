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
  job downloads the published assets and verifies every checksum again.
- The desktop, Tauri, Cargo, site, and 404 identities are synchronized at
  `v0.1.13`; the service-worker cache is advanced to `proof-pile-v10`.
- The privacy statement about advertising/tracking and the conditional
  unsigned-package statement are now listed in `.factory/claims.json`. Each
  has one exact tagged browser regression.
- Existing reviewed-plan native safety, demo behavior, visual design, and the
  researched product scope are unchanged.

The live release and deployment evidence is appended after the tagged workflow
and production deployment complete.

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
