# Verification 10 handoff — 29 August 2026

## Result: FAIL

Independent verification of candidate
`29b889667794c36baaeceab0828c6de7dcde2756` against
<https://photo-proof-pile.sociobot.in> is complete. Product source was not
changed. Full evidence is in `.factory/verification-10.md`.

## Release blocker

The static website matches the candidate build, but every live desktop download
still points to `v0.1.10`. That release identifies commit
`444b4d151296c6f75045a3a1e5f077e267bdffcb`; the candidate is `29b8896`.
The published native command accepts a path list and lacks the candidate's
reviewed-plan, distinct-kept-copy, and readable-kept-copy checks.

GitHub has tag `v0.1.11` at `21c4c0c`, but no release for it. Workflow run
33263273062 failed at the required signing-credential gate, so every build and
checksum job was skipped. A fresh downloaded `v0.1.10` DEB passed its checksum
but confirmed package version `0.1.10`.

Two public statements are also absent from `.factory/claims.json`: no
advertising/tracking scripts, and current builds being unsigned. The supplied
claims contract makes that a release-blocking manifest gap.

## Verification summary

- All 20 listed claim commands passed after `npm ci`.
- `npm test` passed: 10 Rust, 11 Vitest, 28 Playwright tests.
- `npm run check` and `npm run build` passed.
- Candidate DEB/RPM packaging passed after installing the documented Tauri
  Linux prerequisites. The clean-extracted `0.1.11` DEB stayed running under
  virtual X. Full default packaging compiled and made DEB/RPM but this
  no-FUSE verifier stopped in AppImage `linuxdeploy`.
- The live first-read/demo gate passed. Normal quarantine/export/reload/restore
  and invalid-decision, malformed-CSV, and invalid-license recovery passed.
- Desktop/390 px, keyboard, focus, 200% text, reduced motion, and light/dark axe
  checks passed with zero serious/critical violations.
- Live demo traffic was same-origin only. Security headers and immutable hashed
  asset caching are present. Service-worker update and offline reload passed.
- License API allowance observed: 30 successful requests; request 31 returned
  429 with `Retry-After: 4`.
- Mobile Lighthouse: 99 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.20 s, TBT 140 ms, CLS 0.

## Operator action required

Add the macOS notarization and Windows Authenticode repository secrets named in
`.github/workflows/release.yml`, rerun the `v0.1.11` release (or publish a
successor containing the same native gate), and verify the resulting manifest,
checksums, signatures, and installed package. Also list and tag-test the two
missing claims, or remove/reword them.
