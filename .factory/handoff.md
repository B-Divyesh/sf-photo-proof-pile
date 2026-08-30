# Proof Pile repair 9 handoff — PASS

## Outcome

Both product-QA findings in independent verification commit
`7d72f6e319b0f7a58dd55f7724deca0d23bbae86` are repaired. The repaired
desktop source is commit `f7726242ecbf6aff35187fde4d55ed44114c59e1`, tagged
`v0.1.17`. The static site is deployed at
<https://photo-proof-pile.sociobot.in>.

The public release is at
<https://github.com/B-Divyesh/sf-photo-proof-pile/releases/tag/v0.1.17>.
It contains Linux AppImage, DEB, and RPM packages; Windows MSI and EXE
packages; macOS arm64 and x86_64 DMGs; `SHA256SUMS`; `latest.json`; and
`DESKTOP_RELEASE_VERIFIED.json`.

## Repairs

### Public desktop distribution

Root cause: the release workflow made absent Apple and Windows signing secrets
a global preflight failure. That stopped every platform build, including
Linux, and prevented any public release.

The workflow now always builds the four required targets. It signs and
notarizes macOS packages or signs Windows packages only when the complete
credential set is present. With no credentials, it publishes honest unsigned
packages and records that status in the release manifest. Publication still
requires the complete platform matrix, source-commit binding, and verified
SHA-256 checksums. The site and both installers reject an incomplete release
and disclose unsigned macOS and Windows packages before download.

Exact regression coverage:

- `tests/model.test.ts` proves absent signing credentials do not prevent the
  distribution workflow and that the complete release gate remains.
- `tests/app.spec.ts` claim `@claim:verified-downloads-only` proves a complete
  unsigned release is offered with a warning and an incomplete release is
  refused.
- `tests/installer.test.ts` proves both installers require the immutable
  release marker and checksum verification.

GitHub Actions run
<https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33285804179>
passed prepare, Windows x64, Linux x64, macOS arm64, macOS x86_64, checksums,
and release verification. All ten entries in the public `SHA256SUMS` were
downloaded independently and matched. The live shell installer downloaded the
74.9 MiB AppImage and matched SHA-256
`cc92305442f011d78e45c60a9f3b5ee5f0308f7890b7cba80f5adfed2c40652b`.
The public AppImage stayed open during an eight-second Xvfb smoke test using
`--appimage-extract-and-run` and wrote no errors to stderr.

### Standalone 404 at 390 px and 200% text

Root cause: the standalone page kept its header navigation on one line. Its
content expanded beyond the 390 px visual viewport at enlarged text.

The header and footer now reflow without horizontal overflow. The exact
Playwright regression sets a 390 px viewport, simulates 200% text, and checks
the document and every header/footer action stay within 390 px. The live 404
returns status 404, measures 390 px wide, and has no serious or critical axe
findings.

## Verification evidence

From a fresh shallow clone of tag `v0.1.17`:

```text
npm ci          PASS — 66 packages, 0 vulnerabilities
npm test        PASS — 10 Rust + 11 Vitest + 31 Playwright tests
npm run check   PASS — TypeScript, rustfmt, strict Clippy
npm run build   PASS — dist/site produced
```

Additional checks:

- All 22 commands in `.factory/claims.json` passed separately. There are 22
  unique claim IDs and exactly one matching test tag for each.
- `CI=true npm run build:desktop -- --bundles deb,rpm` passed locally. The
  generated DEB and RPM were packaged, and the extracted DEB binary stayed
  open during its Xvfb smoke test with empty stderr.
- Desktop and 390 px mobile workflows passed for the landing page, demo,
  review, quarantine, restore, CSV export, recovery import, history, focus,
  and direct routes.
- Keyboard navigation, skip link, dialog focus restoration, 44 px targets,
  200% text, reduced motion, light/dark presentation, and axe checks passed.
  Axe found zero serious or critical issues on five routes in both themes,
  plus mobile and the standalone 404.
- The demo remained isolated, reset cleanly, and reloaded offline from service
  worker cache `proof-pile-v14` with all three sample groups.
- Ordinary use made no off-origin requests. The explicit release lookup used
  only `api.github.com`. No analytics or tracking requests occurred.
- CSP, HSTS, content-type, referrer, permissions, caching, and 404 response
  policies passed. `frame-ancestors` is present only in the response header.
- Invalid-license verification returned `no-store` JSON with the expected
  CORS origin. The paid checkout returned the expected hosted redirect.
- Local production files and deployed files matched by SHA-256. The live
  route suite recorded no unexpected console errors.
- Live mobile Lighthouse: performance 99, accessibility 100, best practices
  100, SEO 100; LCP 1.18 s, total blocking time 97.5 ms, CLS 0.
- Initial JavaScript is 42,816 bytes raw, CSS is 18,563 bytes raw, and the
  hero image is 29,922 bytes.
- The plain-language audit passes: every landing sentence is at most 22 words
  and the catalog description is 90 characters.

Detailed machine-readable results, screenshots, release metadata, checksum
records, installer logs, and Lighthouse output are in
`.factory/repair-9-artifacts/`.

Static deployment ID: `c56e082a-5644-4580-8820-8e4fb79f26f5`.

## Run locally

```sh
npm ci
npm test
npm run check
npm run build
npm run dev
```

For a local Linux desktop package, install the WebKit/Tauri system packages
declared in `.github/workflows/release.yml`, then run:

```sh
CI=true npm run build:desktop -- --bundles deb,rpm
```

## Needs operator action

The factory provided no Apple or Windows signing credentials. Release 0.1.17
therefore contains unsigned macOS and Windows packages, and the product says so
before download. This matches the current desktop-app contract: build unsigned
when certificates are unavailable and disclose it.

For signed and notarized packages, add these GitHub Actions secrets and rerun
the tag workflow:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`
- `WINDOWS_CERT_PFX`
- `WINDOWS_CERTIFICATE_PASSWORD`

When both credential sets are present, the existing workflow performs native
signing checks and emits `DESKTOP_SIGNATURES_VERIFIED.json`. No application,
site, installer, or release-matrix gap remains.
