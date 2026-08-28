# Proof Pile handoff

## Independent verification verdict: FAIL

- Tested candidate: `14ed919d93be9d1ccb662e868906fe19fbfdd3d0`
- Tested deployment: `https://photo-proof-pile.sociobot.in`
- Verified: 28 August 2026 UTC
- Detailed evidence: `.factory/verification.md`

The candidate must not be released. The sample experience, automated tests,
builds, privacy boundary, offline reload, rate limiting, release artifacts, and
performance budgets pass. Production checkout and the core durable-reversal
promise do not.

## Release blockers

1. The live US$29 checkout returns HTTP 404 with
   `{"error":"enabled factory product","status":404}`.
2. Quarantine move records exist only in memory. After reload, Restore
   disappears and a new CSV contains no quarantine paths. The product cannot
   restore “from the decision log” as advertised. It also accepts a plan that
   quarantines every copy in a group.
3. Axe reports serious failures: 1.1:1 dark-mode contrast on the paid section
   and a non-focusable horizontally scrollable photo strip at 390px.
4. Public native-matching, restore-log, cross-drive safety, and installer claims
   are missing equivalent entries/tests in `.factory/claims.json`.
5. An Intel Mac user agent is linked to the ARM64 DMG even though an x86_64 DMG
   exists.

Other defects: the `www.sociobot.in` footer link has an invalid certificate,
hashed assets cache for only 30 seconds, unknown routes return HTTP 200, and the
web manifest is not linked from the document.

## Verification completed

- All nine declared claim commands: PASS after clean `npm ci`.
- `npm test`: PASS (Rust 3, Vitest 3, Playwright 11).
- `npm run build`: PASS; output in `dist/site`.
- `CI=true npm run build:desktop`: PASS; DEB, RPM, and AppImage produced after
  installing the documented Linux/Tauri build prerequisites and `file`.
- `cargo fmt -- --check` and Clippy: PASS (warnings only).
- Live candidate asset hashes match the local production build.
- GitHub release run `33187465920`: all native build/checksum jobs PASS.
- Linux installer: PASS in an isolated directory; published checksum matched.
- Rate-limit burst: first 429 at request 30, `Retry-After: 2`.
- Lighthouse mobile: 100/100/100/100; LCP 1.1s, CLS 0, TBT 20ms.
- Service-worker update and offline `/demo` reload: PASS.

## How to reproduce

```sh
npm ci
npm test
npm run build
CI=true npm run build:desktop
```

Open the live landing page in dark mode and run axe to reproduce the contrast
failure. At 390px, run axe on `/demo` for the photo-strip failure. Quarantine
sample files, reload, then inspect Restore and export CSV to reproduce the lost
move record. Request the checkout URL directly to reproduce the 404.

## Known product gaps retained from builder handoff

- HEIC and camera RAW are not decoded.
- “Same moment” is limited to matching EXIF minute and dimensions.
- Desktop packages are unsigned pending owner certificates.

## Required operator and builder action

1. Register/enable `photo-proof-pile` in the production Sociobot billing API.
2. Fix durable restore and the all-copies safety invariant before release.
3. Clear all serious accessibility findings and add regression tests.
4. Complete the claims registry and repair download architecture selection.
5. Add macOS and Windows signing credentials when available.
