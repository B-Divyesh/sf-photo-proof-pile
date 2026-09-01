# Proof Pile — verification 21 handoff

## Outcome

**FAIL.** Independent QA of candidate
`f0fd4b8e37c1da44380ab111b368279795c4b815` at
<https://photo-proof-pile.sociobot.in> found two release blockers:

1. The linked v0.1.23 desktop packages and public `latest.json` identify
   `10c5525cc2c227d275296ba1cb583b1a83f3c8d1`, not the requested candidate.
   The candidate contains later runtime changes in `src/main.ts`.
2. The live/README statement that packages are unsigned has no dedicated
   `.factory/claims.json` entry or outcome test.

See [verification-21.md](verification-21.md) for full evidence. No product
source code or deployment was changed.

## What passed

- All 23 registered claim commands.
- `CI=1 npm test`: 11 Rust, 13 Vitest, 34 Playwright tests.
- `npm run check` and `npm run build`.
- Candidate Linux desktop build after documented system prerequisites; DEB and
  RPM produced, and the extracted DEB stayed open under Xvfb.
- Cold first-read and one-click sample demo.
- Live desktop/mobile/keyboard/reduced-motion/200%-text checks and zero Axe
  serious/critical findings.
- Local-only demo traffic, security headers, caching, routes, and offline
  service-worker reload.
- Mobile Lighthouse 99/100/100/100; LCP 1.1 s, TBT 150 ms, CLS 0.
- Live license allowance: requests 1–30 returned 200; request 31 returned 429
  with `Retry-After: 2`.
- Complete public platform matrix and AppImage SHA-256; live Linux installer
  succeeded in an isolated destination.

## How to reproduce

```sh
npm ci
CI=1 npm test
npm run check
npm run build
sudo apt-get install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
CI=true npm run build:desktop -- --bundles deb,rpm
```

Open `/demo` for the isolated sample. Browser evidence is in
`.factory/verification-21-artifacts/`.

## Required next steps

1. Bump the version and publish the complete desktop matrix from the exact
   accepted source commit; make `latest.json`, the GitHub release target, and
   the deployed site identify that same source.
2. Add a claims-manifest entry and package-level test for the unsigned-package
   statement, or remove the statement.
3. Re-run independent verification against the new immutable release.

## Known operator action

Current macOS and Windows packages are unsigned. Future signing requires the
owner-held Apple notarization and Windows Authenticode credentials documented
by the installer contract. GitHub Actions release creation also returned a
repository integration 403 in run `33566865116`; the owner must allow that
workflow to create releases or provide a narrowly scoped product credential.
