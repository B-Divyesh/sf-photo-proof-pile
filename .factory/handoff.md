# Proof Pile polish 6 handoff

## Outcome

Proof Pile `0.1.19` is deployed at
<https://photo-proof-pile.sociobot.in>. Every finding in reviews 1–6 is mapped
to its repair and evidence in [polish-6.md](polish-6.md).

The release path now fails closed. The site and both one-line installers offer
no package unless the release contains `DESKTOP_SIGNATURES_VERIFIED.json`, the
complete platform matrix, the release manifest, and the published verification
file. Windows packages must pass Authenticode checks; both macOS builds must
pass signing, Gatekeeper, and notarization checks before publication.

The previously public v0.1.17 and v0.1.18 packages are private drafts. The
unauthenticated GitHub release list is empty, `/releases/latest` returns 404,
the live dialog exposes zero package links, and the live Linux installer exits
without writing a file.

## Changes

- Restored the hard signing gate and independent post-upload verification in
  `.github/workflows/release.yml`.
- Required trusted signature proof in the website, Linux installer, and
  Windows installer; removed all unsigned fallback behavior.
- Changed the first-screen action to **Check desktop downloads** and kept the
  general all-platform chooser behavior.
- Changed the GitHub browser lookup to the public release-list endpoint so an
  unavailable release produces a calm state without a console 404.
- Rewrote the README checksum sentence in plain words and removed the unlisted
  signed-build reporting promise.
- Updated all related claims and regression tests, synchronized version
  identity to `0.1.19`, and refreshed the service-worker cache.
- Updated the verb-first, 88-character catalog description.
- Preserved the contact-sheet visual system and the desktop-app/static-site
  artifact and deployment classes.

Implementation commits are `c43d88f` and `c5be1f3`; both are pushed to
`origin/main`. Tag `v0.1.19` points to `c5be1f3`.

## Verification

All checks ran on 30 August 2026 UTC.

- Fresh clean clone of `c5be1f3`: `npm ci` installed 66 packages, audited 67,
  and found zero vulnerabilities.
- Every exact `.factory/claims.json` command passed separately: 22/22. Every
  claim tag occurs exactly once.
- `npm test`: 11 Rust, 11 Vitest, and 33 Playwright tests passed.
- `npm run check`: TypeScript, rustfmt, and strict Clippy passed.
- `npm run build`: `dist/site` produced. JavaScript totals 43.30 kB raw and
  15.15 kB gzip; CSS is 18.64 kB raw and 5.11 kB gzip.
- `actionlint 1.7.12 .github/workflows/release.yml`: passed.
- Worker URL verification passed live `/` and `/?demo=1`: HTTP 200, correct
  titles and language, one h1, one main, no missing alt text, no unlabelled
  buttons, and no console errors.
- Live browser QA passed `/`, `/demo`, `/?demo=1`, `/app`, `/privacy`,
  `/terms`, and an unknown HTTP 404 route. Titles, descriptions, canonicals,
  shared landmarks, skip links, and legal links are correct.
- The live sample completed quarantine, nine-row CSV export, and restore-dialog
  focus. Demo storage stayed separate, reset cleared it, and **Start for real**
  preserved real storage.
- Route focus, Back/scroll restoration, cross-route `#how` focus, same-origin
  ordinary traffic, offline demo reload, and zero unexpected console errors
  passed.
- Axe found zero serious or critical findings on five routes in light and dark
  themes and on the 390 px demo. At 390 px and 200% text there was no overflow;
  tested targets were at least 44 px and reduced motion was active.
- Lighthouse mobile: performance 100, accessibility 100, best practices 100,
  SEO 100, LCP 1.13 s, TBT 14 ms, CLS 0, 140,830 transferred bytes.
- Live root and 404 responses include HSTS, nosniff, referrer, permissions, and
  CSP headers; the unknown route returns HTTP 404.
- Public release gate: no public releases; no v0.1.19 release object; live
  dialog has zero package links; live `install.sh` exited 1 and wrote zero
  files.

Evidence is under `.factory/polish-6-artifacts/`, with the cumulative mapping
in `.factory/polish-6.md`.

## Deployment

`npm run build:site` produced `dist/site`, which was deployed to the existing
Azure Static Web App `sf-photo-proof-pile` production environment. No
prohibited service or resource was read or changed. The custom domain served
the current `index-DpHBUDvZ.js` bundle during the final cold check.

## Needs operator action

GitHub Actions run
<https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33295415409>
failed at `validate-signing` exactly as designed. The repository has no Actions
secrets, so every build and publication job was skipped and no untrusted
package was created.

To publish desktop installers, the owner must add these repository secrets and
rerun the `v0.1.19` release workflow:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`
- `WINDOWS_CERT_PFX`
- `WINDOWS_CERTIFICATE_PASSWORD`

After those credentials are present, the workflow itself builds every target,
independently downloads and verifies the signed packages, creates checksums
and `latest.json`, writes `DESKTOP_SIGNATURES_VERIFIED.json`, and only then
publishes. There is no repository-controlled defect left open; public desktop
distribution remains intentionally unavailable until that operator action.
