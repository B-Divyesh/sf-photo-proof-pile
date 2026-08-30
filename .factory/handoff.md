# Proof Pile independent verification 14 handoff — FAIL

## Outcome

Candidate `0c4d72a226e3f67041d9f8aa87dae94d2e344a4d` was independently tested on
30 August 2026 against <https://photo-proof-pile.sociobot.in>.

**FAIL.** The web product and native source pass their functional and quality
gates, but the required desktop distribution does not exist. GitHub reports
zero public releases, `/releases/latest` returns 404, and the live download
control and installer offer no package. This is a release-blocking Severity 1
defect, not a passing deployment caveat.

The complete evidence and defect list are in
[`.factory/verification-14.md`](verification-14.md).

No product code was changed during verification.

## Verification summary

- Mandatory first-read and one-click populated demo: PASS.
- All 22 `.factory/claims.json` commands: PASS.
- `npm ci`: PASS; zero audit vulnerabilities.
- `npm test`: PASS; 10 Rust, 11 Vitest, 30 Playwright tests.
- `npm run check`: PASS.
- `npm run build`: PASS; `dist/site` produced.
- `CI=true npm run build:desktop -- --bundles deb,rpm`: PASS after installing
  the Linux packages declared in the release workflow.
- Native Linux binary eight-second Xvfb smoke: PASS; no stderr.
- Live workflow, invalid input, recovery, privacy, headers, keyboard, 390 px
  mobile, reduced motion, axe, caching, service-worker update/offline reload,
  and rate limiting: PASS.
- Lighthouse mobile: 100 performance / 100 accessibility / 100 best practices
  / 100 SEO; LCP 1.08 s and CLS 0.
- Live static files match the fresh candidate build byte for byte.
- Public desktop distribution: **FAIL**.

## Defects

1. **Severity 1 / release blocking:** no public signed desktop release or
   downloadable package exists for Linux, Windows, or macOS. Release workflow
   run
   <https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33282734730>
   failed at signing preflight and skipped all build/publish jobs.
2. **Severity 3 / minor:** the standalone 404 page expands from a 390 px
   visual viewport to 535 px under simulated 200% text because its header
   navigation does not reflow.

## How to reproduce

```sh
npm ci
npm test
npm run check
npm run build
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
CI=true npm run build:desktop -- --bundles deb,rpm
```

Claims must be run separately using every `test` value in
`.factory/claims.json`. For the public distribution failure:

```sh
curl -i https://api.github.com/repos/B-Divyesh/sf-photo-proof-pile/releases/latest
curl -fsSL https://photo-proof-pile.sociobot.in/install.sh | sh
```

The first command returns 404. The second exits 1 without installing anything.

## Required operator action

Provide the GitHub Actions secrets required by `.github/workflows/release.yml`:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`
- `WINDOWS_CERT_PFX`
- `WINDOWS_CERTIFICATE_PASSWORD`

Then tag the exact 0.1.16 source and rerun the release workflow. Do not claim
PASS until the public release contains both macOS architectures, Windows,
Linux, `SHA256SUMS`, `latest.json`, and
`DESKTOP_SIGNATURES_VERIFIED.json`, and the live detected-platform download
successfully downloads a package whose checksum matches.
