# Proof Pile repair 11 handoff

## Outcome

The release-blocking signing gate reported in independent verification 17 is
repaired in version `0.1.22`.

Before this repair, an environment with no operator certificates reproduced the
workflow's exact failure: all eight certificate inputs were reported missing,
then it exited with `Refusing to build or publish untrusted desktop packages.`
That prevented every package build and left the public release list empty.

The release workflow now publishes checksummed desktop packages when
certificates are absent. It records the truthful `unsigned` status in
`DESKTOP_PACKAGE_STATUS.json`; it runs Windows Authenticode or macOS
signing/notarization only after an operator explicitly enables it with complete
corresponding credentials, and keeps verification steps conditional too. No
page, README, installer, or claim now says unsigned packages are signed or
notarized.

## What changed

- Added `scripts/release-signing-status.sh`, which writes per-platform signing
  status without exposing credentials.
- Replaced the mandatory `validate-signing` workflow gate with `release-mode`.
  Release publication always requires the full macOS/Windows/Linux matrix and
  `SHA256SUMS`; signing is optional and status is recorded honestly.
- Replaced the unprovable `DESKTOP_SIGNATURES_VERIFIED.json` contract with
  `DESKTOP_PACKAGE_STATUS.json` and a `latest.json` verification record.
- Kept both macOS architectures in the download picker. It now requires the
  full package set, checksum file, and manifest rather than a signature claim.
- Changed Linux and Windows installers to verify package bytes against
  `SHA256SUMS` without requiring unrelated macOS/Windows signing assertions.
- Replaced signing-based claims with checksummed-download claims and added the
  certificate-absent regression claim. Bumped all app/package versions to
  `0.1.22` and the service-worker cache to `proof-pile-v19`.

## Verification

All commands ran from a clean `npm ci` install.

| Check | Result |
| --- | --- |
| Reproduce missing-certificate gate | PASS — exact former failure observed before repair |
| `npm test` | PASS — 11 Rust, 11 Vitest, 33 Playwright tests |
| Every `.factory/claims.json` command | PASS — 23/23; exact command list in `repair-11-artifacts/claims-exact.txt` |
| `npm run check` | PASS — TypeScript, rustfmt, Clippy with warnings denied |
| `npm run build` | PASS — `dist/site`; initial application JS 13.65 KiB gzip and CSS 5.11 KiB gzip |
| `CI=true npm run build:desktop -- --bundles deb,rpm` | PASS |
| DEB/RPM consumer smoke | PASS — `proof-pile` `0.1.22` (`amd64` DEB and `x86_64` RPM); extracted DEB stayed running under Xvfb for eight seconds (the timeout exit is expected) |
| URL/accessibility smoke | PASS — title, `lang=en`, one h1, main landmark, image alt text, and no console errors; `repair-11-artifacts/local-verify-url/verify.json` |
| Workflow syntax | PASS — parsed with PyYAML |

Local package SHA-256 values:

```text
aa8414db60a1e4dde784d94c55cfca9bd38144fa392a137c55de3c6c05223d4c  Proof Pile_0.1.22_amd64.deb
b68c54a3352fa957321e5ab587b4ea073d4f6ed5ae186d11cf65cced04440754  Proof Pile-0.1.22-1.x86_64.rpm
```

The Playwright suite covers desktop and 390px mobile, keyboard, focus return,
dark/light axe checks, 44px controls, reduced motion, privacy request logging,
offline reload, service-worker update, route behavior, and checkout/license
request policy. The new release gate test covers all published macOS, Windows,
Linux, checksum, and manifest assets.

## Deployment and release

The initial `v0.1.20` release attempt proved the former missing-certificate
gate was gone, but a nonempty invalid Apple credential caused Tauri's
`security import` to fail. The first explicit-opt-in attempt (`v0.1.21`) still
passed Apple variables to its unsigned macOS build step. In `v0.1.22`, that
build is a separate step with no Apple environment at all. `release-mode` also
requires the explicit operator variable `DESKTOP_SIGNING_ENABLED=true` before
it uses any signing credential, so unknown or placeholder values publish an
unsigned release instead of blocking it.

The next committed tag is `v0.1.22`. Publish it through
`.github/workflows/release.yml`, then verify the public GitHub release has two
DMGs, Windows MSI/EXE, Linux AppImage/DEB/RPM, `SHA256SUMS`, `latest.json`, and
`DESKTOP_PACKAGE_STATUS.json`; download one asset and run `sha256sum -c`.
After the static deployment updates, verify that the live download picker links
to all four package choices and that `/demo` remains available offline.

## Needs operator action

No operator certificate is required to publish this release. The resulting
macOS and Windows packages are intentionally unsigned, and the release status
file says so. To publish signed packages later, provide only the relevant
owner-held credentials to the repository:

- macOS: `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`,
  `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`
- Windows: `WINDOWS_CERT_PFX`, `WINDOWS_CERTIFICATE_PASSWORD`

After validating those credentials, set the repository variable
`DESKTOP_SIGNING_ENABLED` to `true`. The workflow then imports/signs and
independently verifies that platform's packages before publishing its recorded
signed status. No credentials are stored in this repository.
