# Proof Pile — repair 21 handoff

## Result

**PASS — the live desktop download path now serves the reviewed release.**

- Live implementation release: `v0.1.30`
- Implementation commit: `b12d5727de44d71c91b4a496eece320e7247a853`
- Release workflow run: `33596875103`
- Repair/configuration commits: `bd04dcb` and `99a47a5`
- Production URL: <https://photo-proof-pile.sociobot.in>

Production is a release-matched static artifact. The footer, app bundle,
download dialog, both installers, 404 page, and service-worker cache all name
`v0.1.30` at `b12d5727…`. The dialog exposes four desktop choices: Apple
silicon macOS, Intel macOS, Windows MSI, and Linux AppImage.

## What changed

- `npm run build` now reconstructs the immutable release source declared in
  `scripts/production-release.env`, applies the exact release stamping used by
  the desktop workflow, and rejects an incomplete or mismatched public
  release before writing `dist/site`.
- The release workflow and production build share
  `scripts/stamp-release-source.mjs`, preventing release-stamp drift.
- Browser-test builds now use `dist/test-site`; they cannot overwrite the
  verified deploy directory.
- Added an outcome regression test that builds a production site and checks
  the emitted application, installers, 404, and service worker identity.
- Kept a single canonical `@claim:desktop-release-identity` test tag.
- Regenerated the copy audit release references for `v0.1.30`.

## Verification

From a clean dependency setup (`npm ci`):

- All 25 distinct commands declared in `.factory/claims.json` passed.
- `npm run check` passed.
- `CI=1 npm test` passed: 11 Rust, 22 Vitest, and 37 Playwright tests.
- `npm run build` passed, produced `dist/site`, and verified the public
  `v0.1.30` desktop release, package manifest, and all required assets.
- The supplied URL verifier passed locally. Repository Playwright Axe checks
  and fresh live Axe checks found zero serious or critical issues.
- Fresh desktop and 390 px phone visits stated the job, audience, and first
  action before scrolling. The one-click sample showed three groups/eight
  files, a persistent sample label, reset, exit, and unchanged seeded real
  data.
- Live release smoke passed: 27/27 files matched the release-stamped local
  `dist/site`; the real Linux installer verified its checksum and installed
  the AppImage. The installed AppImage ran under Xvfb for eight seconds using
  AppImage extraction fallback (this worker has no FUSE device).
- Live service-worker update/offline reload passed with
  `proof-pile-v0.1.30`. License verification returned 200 for requests 1–30,
  then 429 with `Retry-After: 4` on request 31.
- Fresh mobile Lighthouse: Performance 99, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.0 s, LCP 1.2 s, TBT 150 ms, CLS 0, transfer 138 KiB.

## Known limitations

- macOS packages do not have Developer ID signing and Windows packages are
  Authenticode NotSigned. The download dialog and README disclose this and
  checksum verification remains required.
- `npm run build` intentionally fails closed if the configured immutable tag
  is absent or its public package matrix no longer verifies. Before a future
  desktop release is deployed, update `scripts/production-release.env` only
  after that release workflow and its public verification have succeeded.

## Operator action

No deployment action is pending. Code-signing certificates remain the only
future operator-supplied dependency for signed macOS and Windows packages.
