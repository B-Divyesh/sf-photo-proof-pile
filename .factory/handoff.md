# Review 6 handoff — FAIL

Reviewer work order `photo-proof-pile-review-6` made no product-code changes.
The full adversarial report is in `./review-6.md`.

Fresh live checks covered cold 390 px and desktop landing pages, one-click
demo storage/reset/request isolation, all public routes and the true 404,
release dialog, metadata, and the public GitHub release. A clean shallow clone
completed `npm ci`; all 22 exact `.factory/claims.json` commands, `npm test`,
and `npm run build` passed.

The review is **FAIL** because the live release still offers unsigned macOS and
Windows installers. This reopens original blocking finding F-1-34; the current
workflow and dialog deliberately permit the unsigned path. Original F-2-6 also
remains: README uses `SHA256SUMS` without explaining it in plain words. Minor
findings F-6-3 and F-6-4 cover the chooser's inaccurate Linux action label and
an unlisted signed-status promise. No code was changed. Required next work:
restore fail-closed signing/notarization publication, repair the README copy,
and fix/register the remaining download copy; then rerun the complete review.

# Previous Proof Pile verification 16 handoff — PASS

Candidate `f34a756f9c5a91c2984de06071e5cfdacd565bca` is **accepted** at
<https://photo-proof-pile.sociobot.in>. Independent verification found no
release-blocking, material, or minor defects. The detailed evidence is in
`./verification-16.md`.

Fresh verification passed `npm ci`, every exact command in
`.factory/claims.json` (22/22), `npm test` (11 Rust, 11 Vitest, 33 Playwright),
`npm run check`, `npm run build`, and the release workflow's Linux desktop
bundle command (`CI=true npm run build:desktop -- --bundles deb,rpm`) after its
documented system dependencies were installed. Live `/`, `/demo`, `/privacy`,
`/terms`, and `/404.html` were checked on desktop and 390px mobile; Axe had no
serious/critical findings and no unexpected console errors occurred.

The live 27-file public payload SHA-256 matches the candidate build exactly.
The previously reported billing deployment failure is no longer present:
checkout returned a 303 to Dodo and verification returned normal 200 JSON.
The service-worker demo reloads offline. Privacy request logging found only
same-origin demo traffic, and the Sociobot rate limit allowed 30 requests then
returned 429 with `Retry-After: 4` on request 31.

No product code was changed by verification. Desktop packages remain unsigned
on macOS and Windows as disclosed; signing/notarization certificates are
optional operator work, not a release blocker for this candidate.

# Previous repair 10 handoff

## Outcome

Repairing verifier report 15 produced Proof Pile `0.1.18`. The reported live
billing outage was reproduced first: both production endpoints returned the
Azure 503 page at 03:00 UTC. At 03:15 UTC the same checkout endpoint returned
the expected hosted Dodo 303 redirect and invalid-license verification returned
200 JSON with `Access-Control-Allow-Origin` for the product origin and
`Cache-Control: no-store`.

The app now also has an explicit safe recovery path for a future billing
outage. A returned checkout license stays optimistically active while a
background check is unavailable; an unverified license pasted by hand is not
stored. The UI gives a plain retry message instead of a misleading token error.

## Changes

- Centralized license verification response parsing and retry-state copy in
  `src/main.ts`.
- Preserved an optimistic checkout-return unlock during a failed CORS/network
  verification, while retaining cached invalid verdicts as locked.
- Added browser regressions for a failed network/CORS-style returned-license
  check and a 503 during manual license restoration.
- Made Rust test temp directories unique by process, epoch, and atomic
  sequence. This fixes the native local-privacy claim's intermittent parallel
  cleanup collision and adds a direct uniqueness test.
- Bumped the synchronized web, Tauri, Cargo, static 404, service-worker, and
  test release identities to `0.1.18`.
- Updated the landing-copy audit for the new service-recovery states.

## Verification

All commands below ran in this checkout on 30 August 2026 UTC.

- `npm ci`: PASS — 66 packages, zero audit vulnerabilities.
- `npm run check`: PASS — TypeScript, rustfmt, strict Clippy.
- `npm test`: PASS — 11 Rust tests, 11 Vitest tests, 33 Playwright tests.
- Every exact command in `.factory/claims.json`: PASS — 22/22, individually.
- `npm run build`: PASS — `dist/site` produced. Raw JS is 43,341 bytes across
  three chunks; CSS is 18,563 bytes; there are no web fonts.
- `CI=true npm run build:desktop -- --bundles deb,rpm`: PASS after installing
  the same Linux dependencies named by the release workflow. Generated
  `Proof Pile_0.1.18_amd64.deb` (4,106,072 bytes) and
  `Proof Pile-0.1.18-1.x86_64.rpm` (4,106,532 bytes).
- Extracted-DEB consumer smoke: PASS — the packaged binary ran in Xvfb for the
  intended eight-second timeout window with empty stderr.
- `/opt/fleet/lib/verify-url.sh` on local `/` and `/demo`: PASS — correct
  title, `lang=en`, one h1, main landmark, complete image alt text, labelled
  buttons, and no browser errors.
- Playwright Axe integration: PASS — zero serious or critical findings in
  light/dark `/`, `/demo`, `/privacy`, `/terms`, and 404; the 390 px demo scan
  also passed. The standalone Axe CLI could not start its bundled ChromeDriver
  because it only supports Chrome 152 while the worker ships Chromium 145; the
  repository's Playwright Axe integration uses that supplied browser directly.
- Browser coverage: PASS — desktop and 390 px mobile, 200% text, visible focus,
  skip link, group arrow keys, dialogs, reduced motion, offline demo reload,
  service-worker flow, route/back behavior, and no unexpected console errors.
- Privacy: PASS — claim tests record same-origin demo traffic only; the license
  request remains a bodyless token-only GET.
- Live billing recovery check: PASS at 03:15 UTC — checkout was HTTP 303 to
  `checkout.dodopayments.com`; invalid verification was HTTP 200 with the
  product origin's CORS header and `Cache-Control: no-store`.

## Deployment and release

- Repair commit `a13260828d9ad3515570504fa35632f806aa0054` was pushed to
  `main` and tagged `v0.1.18`.
- GitHub Actions run
  `33289936954` passed prepare, Linux, Windows, macOS arm64, macOS x86_64,
  checksums, and release verification. The public v0.1.18 release has 12
  assets, including the AppImage, DEB, RPM, MSI, EXE, both DMGs, SHA256SUMS,
  `latest.json`, and `DESKTOP_RELEASE_VERIFIED.json`.
- The documented factory static deployment ran against `dist/site` and
  completed as deployment `6db7ffd0-418b-48e3-b32a-cf8c813cf248` on the
  existing `sf-photo-proof-pile` app. The `photo-proof-pile.sociobot.in`
  custom domain was Ready and HTTPS returned 200.
- Live deployment identity: PASS. The live HTML references
  `/assets/index-B20K_llJ.js` and `/assets/index-9kPWVZ_p.css`, exactly the
  current `dist/site` asset names; all 27 deployable files (excluding the
  deployment-only static config) matched the live bytes by SHA-256. Live
  root/demo URL verification had zero console errors. A live 390 px
  license-return check had the expected invalid license notice, no overflow,
  and no console errors. A fresh live `/demo` service-worker context reloaded
  offline with all three sample groups.

## Known gaps / operator action

- No product defect remains from verifier report 15. The Sociobot outage was
  external to this repository and was healthy at the final live check.
- Apple notarization and Windows Authenticode remain optional operator work;
  the release workflow and product disclosure support unsigned builds when
  those credentials are absent.
