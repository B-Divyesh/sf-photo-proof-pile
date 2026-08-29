# Independent verification 13 handoff — PASS — 29 August 2026

Candidate `e05605f301ebc105f7574c1a911216581086e46d` is **accepted** at
<https://photo-proof-pile.sociobot.in>. Fresh verification found no Severity 1,
2, or 3 product defects. The previous deployment-only failure is closed.

- First-read and one-click demo gates pass.
- All 22 exact `.factory/claims.json` commands pass after `npm ci`.
- `npm test`, `npm run check`, and `npm run build` pass.
- Live desktop/mobile, keyboard, axe, privacy, headers, offline reload, and
  response caching checks pass.
- The billing verifier allows 30 requests from one client; request 31 returns
  429 with `Retry-After: 4`, and service recovers after that interval.
- Public v0.1.15 has the full Linux/Windows/two-architecture macOS matrix. The
  live Linux installer downloaded a checksum-matched AppImage, which passed an
  eight-second Xvfb smoke test.
- Live HTML, service worker, JS, and CSS match the fresh candidate build byte
  for byte. Candidate changes after release source `c9e1d6e` are documentation
  only.
- Lighthouse mobile: performance 92, accessibility 100, best practices 100,
  SEO 100; LCP 1.2 s, CLS 0, 137 KiB transferred.

Full report: `.factory/verification-13.md`. Fresh evidence is in
`.factory/verification-artifacts-13/`.

Known operator action remains unchanged: macOS and Windows builds are
truthfully unsigned. Add the Apple notarization and Windows Authenticode
secrets named in `.github/workflows/release.yml` to remove first-launch
warnings. This is allowed by the work order and does not block acceptance.

---

# Proof Pile repair 8 handoff — 29 August 2026

## Outcome

Release blocker fixed and deployed. Proof Pile v0.1.15 is publicly installable
for Linux, Windows, macOS Apple silicon, and macOS Intel. The live download
dialog resolves to those assets, and the published Linux installer downloads a
checksum-matched AppImage.

The root cause was the release workflow's unconditional signing preflight. The
repository has no Apple or Windows signing secrets, so the preflight skipped
all four package builds, including Linux. The workflow now builds every target
without certificates, signs when owner credentials are present, records the
truthful status in `latest.json`, and publishes only after the matrix and
checksums pass.

This follows the work order's desktop rule to ship unsigned macOS and Windows
packages when certificates are unavailable and state that clearly. The site,
README, and PowerShell installer warn that those two packages are unsigned.
No package is described as signed unless CI emits
`DESKTOP_SIGNATURES_VERIFIED.json` after native signature checks.

## Source, release, and deployment

- Repair commit and release source:
  `c9e1d6eab6ccc36da27507a1dff854ac5bb22b3f`
- Release tag: `v0.1.15`
- Public release:
  <https://github.com/B-Divyesh/sf-photo-proof-pile/releases/tag/v0.1.15>
- Successful release workflow:
  <https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33278280973>
- Static deployment ID: `8d962e16-4ada-401c-98bc-b20f348cc375`
- Live site: <https://photo-proof-pile.sociobot.in>
- Release marker binds the package matrix to commit
  `c9e1d6eab6ccc36da27507a1dff854ac5bb22b3f`.

## Finding closure and regression coverage

- Removed the credential preflight that prevented every package build.
- Kept conditional Authenticode and Apple signing/notarization checks for a
  future run with owner credentials.
- Added `DESKTOP_RELEASE_VERIFIED.json`. CI writes it only after all four build
  jobs succeed; it records source commit, matrix state, checksum scheme, and
  truthful per-platform signature state.
- `latest.json` contains canonical v0.1.15 URLs for two DMGs, MSI/EXE, AppImage,
  and DEB. `SHA256SUMS` covers all package assets and the release marker.
- The browser requires the full matrix, `latest.json`, `SHA256SUMS`, and the
  completed release marker before showing any download.
- Both one-line installers require the completed release marker and verify the
  selected package against `SHA256SUMS` before opening or installing it.
- `tests/model.test.ts` prevents restoration of the signing deadlock and checks
  the conditional-signing/release-verification contract.
- `tests/app.spec.ts` proves a complete unsigned release is usable with a clear
  warning and an incomplete release exposes no package.
- `tests/installer.test.ts` and `tests/install-windows.ps1` prove incomplete or
  checksum-mismatched releases never reach installation.

## Clean-clone verification

A fresh local clone of repair commit `c9e1d6e` was used.

- `npm ci`: passed; 66 packages installed and zero audit vulnerabilities.
- Every exact command in `.factory/claims.json`: 22 of 22 passed separately.
- Claim registration audit: 22 IDs, each with exactly one matching test tag.
- `npm test`: passed — 10 Rust tests, 11 Vitest tests, 30 Playwright tests.
- `npm run check`: passed — TypeScript, Rust format, and strict Clippy.
- `npm run build`: passed and produced `dist/site`.
- `actionlint 1.7.12 .github/workflows/release.yml`: passed.
- Initial JavaScript: 42,810 bytes raw / 15,000 bytes gzip total.
- CSS: 18,563 bytes raw / 5,094 bytes gzip.
- Hero WebP: 29,922 bytes.

## Native and release verification

- `CI=true npm run build:desktop -- --bundles deb,rpm`: passed after installing
  the same Ubuntu prerequisites declared in the workflow.
- Local DEB metadata: `proof-pile`, version `0.1.15`, architecture `amd64`.
- Local executable stayed running for the full eight-second Xvfb smoke window.
- GitHub Actions passed prepare, both macOS architectures, Windows, Linux,
  checksum publication, and independent public-release verification.
- The public release contains 12 assets: two DMGs, two app archives, MSI, EXE,
  AppImage, DEB, RPM, `latest.json`, `SHA256SUMS`, and the release marker.
- A fresh invocation of the live `install.sh` installed the 78,576,120-byte
  AppImage. Its SHA-256 matched the published value:
  `d57111a8df898743e02327b73dc693aa596a758b960cb3488b0de62ffaadbd07`.
- The downloaded public DEB reported `proof-pile 0.1.15 amd64`; its extracted
  executable stayed running for the full eight-second Xvfb smoke window.

## Live product verification

- `/opt/fleet/lib/verify-url.sh` passed both `/` and `/demo`: correct title,
  `lang=en`, one h1/main, complete image alternatives, labeled buttons, and no
  console or page errors.
- `/`, `/demo`, `/app`, `/privacy`, and `/terms` return 200. The tested unknown
  route returns the designed HTTP 404.
- Desktop keyboard skip navigation works. The one-click demo opens three sample
  groups and its persistent isolation banner.
- Playwright axe found zero serious or critical issues on all five routes.
- At 390 px there is no horizontal overflow, checked targets are at least 44
  px, reduced-motion makes the card transition effectively instant, and axe
  reports zero serious or critical issues.
- Demo decision interactions made no off-origin request. The license endpoint
  accepts only the product origin, returns JSON with `Cache-Control: no-store`,
  and rejected the invalid test token.
- Offline reload returned 200 with all three demo groups. The active worker uses
  cache `proof-pile-v12`, proving the deployed update replaced v11.
- CSP, HSTS, `nosniff`, strict-origin referrer policy, and denied camera,
  microphone, and geolocation permissions are live.
- The deployed HTML and primary JavaScript SHA-256 values match `dist/site`.
- A fresh desktop browser shows four v0.1.15 download links and the unsigned
  first-launch warning with zero console errors.
- Lighthouse mobile: performance 100, accessibility 100, best practices 100,
  SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 10 ms, CLS 0, 137 KiB transfer.
- Sociobot checkout returns its expected hosted-checkout 303 response.

## Known gaps and operator action

The macOS and Windows packages are unsigned because the repository has no owner
certificates. This does not block the work order's unsigned desktop delivery,
but those operating systems will show a first-launch warning.

To remove that warning, add the Apple notarization and Windows Authenticode
secrets already named in `.github/workflows/release.yml`, increment the version,
and tag the source. The same workflow will sign, verify, and publish a
`DESKTOP_SIGNATURES_VERIFIED.json` marker automatically.
