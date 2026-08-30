# Proof Pile independent verification 17 handoff

## Outcome

**FAIL** for candidate `8936306242232450087fcdf787e7d4eec243e4f6` at
<https://photo-proof-pile.sociobot.in> on 30 August 2026 UTC.

The site, isolated demo, native core, local packaging, accessibility,
privacy, performance, billing, and deployment parity checks pass. The product
is not releasable because no public desktop release or package exists. A new
user therefore cannot install the scanner or complete the real photo-library
job.

Full evidence is in [verification-17.md](verification-17.md).

## Blocking defect

- GitHub's public release list is empty.
- Latest release and tag release `v0.1.19` both return 404.
- The live download dialog exposes zero package links.
- `install.sh` exits 1 without creating an install target.
- Release run
  <https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33295415409>
  failed at `validate-signing`; all build, verification, checksum, and publish
  jobs were skipped.

## Verification summary

- All 22 exact `.factory/claims.json` commands passed.
- `npm test` passed: 11 Rust, 11 Vitest, 33 Playwright tests.
- `npm run check` passed.
- `npm run build` produced `dist/site`.
- Local Tauri DEB and RPM builds passed after installing the workflow's Ubuntu
  prerequisites; a fresh extracted DEB launched cleanly under Xvfb.
- All 24 live non-map files matched the candidate build byte-for-byte.
- Live normal, boundary, invalid-input, cancel, reset, CSV export/import,
  persistence, quarantine, and restore flows passed.
- Live privacy logging found only same-origin requests during the complete demo
  flow. License checks sent a token-only GET.
- The license API allowed 30 requests; request 31 returned 429 with
  `Retry-After: 4`.
- Offline reload and service-worker update checks passed.
- Axe reported zero serious/critical findings across desktop/mobile and
  light/dark checks. Keyboard, focus, 44 px targets, 200% text, and reduced
  motion passed.
- Lighthouse mobile scored 98 performance, 100 accessibility, 100 best
  practices, and 100 SEO; LCP was 1.06 s and CLS was 0.

## How to reproduce

```sh
npm ci
npm test
npm run check
npm run build
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf rpm xvfb
CI=true npm run build:desktop -- --bundles deb,rpm
curl -i https://api.github.com/repos/B-Divyesh/sf-photo-proof-pile/releases/latest
```

Open the live first screen and choose **Try it with sample data**. Open
**Check desktop downloads** to reproduce the blocking no-package state.

## Needs operator action

Provide the signing credentials expected by `.github/workflows/release.yml`
and rerun the `v0.1.19` release workflow. The workflow expects:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`
- `WINDOWS_CERT_PFX`
- `WINDOWS_CERTIFICATE_PASSWORD`

After publication, independently verify both macOS architectures, Windows,
AppImage and DEB assets, `SHA256SUMS`, `latest.json`,
`DESKTOP_SIGNATURES_VERIFIED.json`, a downloaded package checksum, and the
live detected-platform link. No product-code change was made in this work
order.
