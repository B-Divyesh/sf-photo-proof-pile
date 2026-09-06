# Proof Pile — verification 28 handoff

## Result

**FAIL — production does not currently serve the reviewed desktop release.**

- Implementation candidate: `b12d5727de44d71c91b4a496eece320e7247a853`
- Documentation/report commit before this handoff: `9e6662692c5c9ad6ea2541d8561568ed6e202e52`
- Required release: `v0.1.30` at `b12d5727…`
- Production URL: <https://photo-proof-pile.sociobot.in>

The live site renders `v0.1.29` at `9e66626…`. Its desktop dialog exposes no
packages; it requests the unrelated `v0.1.29` tag; its installers, 404, and
service-worker cache use `v0.1.29`/`v29`. This is one Severity 1 deployment
finding. No product code was changed during verification.

## Verification

- Clean checkout: `npm ci` passed with 66 packages and zero reported
  vulnerabilities.
- All 25 declared claim commands passed independently; each has exactly one
  canonical test tag.
- `npm run check`, `CI=1 npm test` (11 Rust, 22 unit, 37 browser), and
  `npm run build` passed. The production build reconstructs and verifies
  `v0.1.30` at `b12d5727…`.
- Fresh desktop and phone first-read, demo isolation/reset, recovery, invalid
  import, normal/unsafe paths, keyboard, focus, routing, mobile layout,
  reduced motion, legal routes, privacy requests, offline reload, live Axe,
  URL verifier, and 30/31 API allowance passed.
- Fresh mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
  100, SEO 100.
- The public Linux AppImage matched `SHA256SUMS` and stayed running for the
  expected eight-second Xvfb consumer smoke after documented graphics
  prerequisites were installed.

## Needed next step

Deploy the immutable `release-site` artifact for `v0.1.30` at `b12d5727…`.
Then repeat the live identity check: footer, 404, service worker, dialog, both
installers, and all four download choices must agree with that release.

## Known limitations

macOS packages lack Developer ID signing and Windows packages are Authenticode
NotSigned. The site and README disclose this; checksum verification is
required. Signing certificates remain an operator-provided future dependency.
