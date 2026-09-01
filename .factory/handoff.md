# Proof Pile — repair handoff

## Outcome

The two release-blocking findings in `verification-20.md` are repaired.

- Public desktop release: [Proof Pile v0.1.23](https://github.com/B-Divyesh/sf-photo-proof-pile/releases/tag/v0.1.23)
- Release target commit: `10c5525cc2c227d275296ba1cb583b1a83f3c8d1` (the requested candidate)
- Static deployment: `https://photo-proof-pile.sociobot.in`
- Repair commits: `ce5d695`, `c1c6e88`, `197f232`, `aa57a11`, `3fe68e1`, and `76f2ede`.

The release contains two macOS DMGs, Windows MSI and EXE, Linux AppImage,
DEB, and RPM, plus `SHA256SUMS` and `latest.json`. Packages are intentionally
and clearly disclosed as unsigned; the website, release notes, and installers
tell people to verify SHA-256 before opening them.

## Findings repaired

### 1. No installable desktop release

I reproduced the original absence first: the public releases endpoint had no
`v0.1.23` release or downloadable desktop package set. The website therefore
failed closed, but there was nothing to install.

The release workflow now builds macOS Apple-silicon and Intel DMGs, Windows
MSI/EXE, and Linux AppImage/DEB/RPM. `scripts/prepare-release-assets.sh`
flattens GitHub Actions' nested artifact layout, normalizes asset names before
checksumming, writes the manifest, validates the platform matrix, and runs
`sha256sum -c SHA256SUMS`. Its regression fixture recreates the nested layout
that caused the initial publishing failure.

GitHub Actions run
[`33566865116`](https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33566865116)
built all four platform artifact groups from the exact candidate. Its release
integration still returned GitHub's `403 Resource not accessible by
integration` despite `Contents: write`; the release was therefore created as a
draft from those Actions-built artifacts with the authorized product-repository
token, verified, then published. No published desktop binary was built in the
worker.

Published assets:

- `Proof-Pile_0.1.23_aarch64.dmg`
- `Proof-Pile_0.1.23_x64.dmg`
- `Proof-Pile_0.1.23_x64_en-US.msi`
- `Proof-Pile_0.1.23_x64-setup.exe`
- `Proof-Pile_0.1.23_amd64.AppImage`
- `Proof-Pile_0.1.23_amd64.deb`
- `Proof-Pile-0.1.23-1.x86_64.rpm`
- `SHA256SUMS` and `latest.json`

The public release API reports nine assets and target commit
`10c5525cc2c227d275296ba1cb583b1a83f3c8d1`. `latest.json` reports the same
commit and a 2/2/3 macOS/Windows/Linux package matrix. I downloaded the public
AppImage and matched it to `SHA256SUMS`:

```text
535d0350d26a52325be481edc27fe94c018ac56d5994a00b6fc77be7cc106983  Proof-Pile_0.1.23_amd64.AppImage
```

The live `install.sh` downloaded that same public AppImage into an isolated
`XDG_BIN_HOME`, checked its SHA-256, marked it executable, and printed its
installed path. A fresh browser context opened the live download dialog,
showed all four platform links and the unsigned-package warning, with no
console errors.

### 2. License verification did not visibly rate-limit

I first replayed the verifier's invalid-token request shape against the live
product endpoint. The old 38-success failure could not be reproduced during
this repair: requests 1–30 returned HTTP 200 and request 31 returned HTTP 429
with `Retry-After: 4`. The browser origin was accepted by CORS. The gateway
does not expose the `Retry-After` header to browser JavaScript, so the UI uses
an exact delay when a header is readable and otherwise says to try again in a
few minutes; it never automatically retries or changes a saved license.

The documented and tested product allowance is now: 30 verification requests
per client window; request 31 is HTTP 429 with `Retry-After`. It appears in
`README.md`, `.factory/claims.json`, and the copy audit. The new
`@claim:license-verification-allowance` Playwright regression supplies 30
recorded 200 responses then a 429 with `Retry-After: 4`, asserts the raw
response header, the safe user-facing notice, preserved license state, and no
automatic 32nd request.

## Verification

| Check | Result |
| --- | --- |
| Clean install | `npm ci` passed; 66 packages, 0 vulnerabilities. |
| Full test suite | `CI=1 npm test` passed: 11 Rust, 13 Vitest, 34 Playwright tests. |
| Registered claims | All 23 exact commands from `.factory/claims.json` passed, including desktop release assets and the 30/429 allowance. |
| Type, format, lint | `npm run check` passed (`tsc`, `cargo fmt --check`, Clippy with warnings denied). |
| Production build | `npm run build` passed; app JS 13.73 KiB gzip and CSS 5.11 KiB gzip. |
| Native consumer smoke | Local DEB/RPM build passed; extracted DEB stayed open under Xvfb for eight seconds (expected timeout 124). |
| Desktop release | Public release API, manifest, package matrix, and a public AppImage SHA-256 were verified. |
| Live installer | `install.sh` fetched and checksum-verified the published AppImage in an isolated directory. |
| Accessibility | Playwright Axe light/dark/mobile baseline passed with no serious or critical issues; keyboard, 390 px, 200% text, touch targets, offline and route tests are in the full browser suite. |
| Live URL verifier | `/` and `/demo` passed title, `lang`, one h1, main landmark, alt text, labeled controls, and zero console errors. |
| Response policy and identity | Live CSP is self-only except the GitHub release API and Sociobot verification API; `frame-ancestors 'none'`, `nosniff`, restrictive Permissions-Policy, canonical URL, and product metadata were verified. |

## Deployment

`dist/site` was deployed to the product-owned Static Web App
`sf-photo-proof-pile` in resource group `sociobot`. The deployment completed at
`https://yellow-meadow-033c5f710.7.azurestaticapps.net`; the custom product URL
was rechecked afterwards at `https://photo-proof-pile.sociobot.in` and
`https://photo-proof-pile.sociobot.in/demo`.

## How to run and verify

```sh
npm ci
CI=1 npm test
npm run check
npm run build
npm run preview
```

Open `/demo` for the isolated sample. To build native Linux packages locally:

```sh
npm run build:desktop -- --bundles deb,rpm
```

For the published Linux installer:

```sh
curl -fsSL https://photo-proof-pile.sociobot.in/install.sh | sh
```

## Known gap and operator action

The current public packages are unsigned. This is prominently disclosed and
the installer verifies SHA-256, but macOS notarization and Windows
Authenticode require owner-held certificates. Configure
`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`,
`APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`, `WINDOWS_CERT_PFX`, and
`WINDOWS_CERTIFICATE_PASSWORD` before a signed future release.

GitHub Actions release creation also remains blocked by GitHub's integration
403 even after the repository's default workflow permission was changed from
read to write. This release is complete and public; for future fully automated
releases, the repository owner needs to allow the Actions integration to create
releases or supply a product-scoped release credential. Do not store a
broad personal token in repository secrets.
