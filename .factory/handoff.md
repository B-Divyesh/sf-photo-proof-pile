# Proof Pile repair handoff

## Repair result

Repaired the independent-verification findings from candidate
`14ed919d93be9d1ccb662e868906fe19fbfdd3d0`.

- Quarantine move records now persist with the review in one local storage
  record. They survive reload, are included in CSV exports, and can be
  imported from a Proof Pile decision log for recovery. A group must retain a
  kept copy before it can enter a quarantine plan.
- The native core has regression coverage for exact-byte, visual, and EXIF
  same-moment grouping, and for copy-before-remove, timestamp preservation,
  and collision-safe quarantine paths.
- Dark pricing text now has explicit high contrast. The mobile photo strip is
  a labeled keyboard-focusable scroll region; skip links focus `<main>`; all
  visible phone header/footer links are at least 44 px.
- The download picker explicitly offers both Apple-silicon and Intel macOS
  DMGs. The footer uses `https://sociobot.in`.
- The manifest is linked; hashed Vite assets receive immutable cache headers;
  unknown static routes use the designed HTTP 404 response.
- Added claim coverage for native matching, durable CSV recovery, cross-drive
  safety, and installer checksum verification.

## Checkout status

The production billing product is not registered: its former checkout URL
returned `404 {"error":"enabled factory product"}` during repair. Repository
policy does not allow this worker to change billing. The broken purchase link,
price, and availability promise were therefore removed from the public site.
Existing buyers can still restore and verify a license. Before reintroducing a
buy button, an operator must register/enable `photo-proof-pile` in the
Sociobot billing API and verify its hosted return flow.

## Verification

Run from a clean checkout:

```sh
npm ci
npm test
npm run build:site
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --no-default-features --all-targets -- -D warnings
CI=true npm run build:desktop
```

Completed during this repair:

- `npm ci` — pass, 66 packages, 0 vulnerabilities.
- `npm test` — pass: Rust 5 tests, Vitest 5 tests, Playwright 14 tests.
- Every command in `.factory/claims.json` — pass.
- `npm run build:site` — pass; `dist/site` generated. Initial JS is 11.54 KiB
  gzip and CSS is 4.90 KiB gzip.
- `cargo fmt -- --check` and strict Clippy — pass.
- `CI=true npm run build:desktop` — Linux package build completed after the
  documented GTK/WebKit prerequisites; DEB, RPM, and AppImage are present in
  `src-tauri/target/release/bundle/`.
- Playwright uses desktop plus 390 px coverage, keyboard checks, light/dark
  axe checks, local-only demo requests, service-worker offline reload, and
  release-picker architecture checks.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173` — pass: title, `lang`,
  exactly one h1 and main, all image alt attributes, and zero console errors.
  The standalone `@axe-core/cli` could not find a Chrome binary in this
  container; the repository's Playwright axe integration completed instead.

## Deployment evidence

Deployed the static build to `https://photo-proof-pile.sociobot.in` from repair
commit `08a536abc1d2d6300272f1c05667bf04d8b7000c`.

- Live `verify-url.sh` passed: HTTPS 200, title/lang/one h1/main/alt checks,
  and zero browser console errors.
- A live 390 px dark-mode Playwright axe pass reported no serious or critical
  violations. The photo strip has `tabindex="0"`.
- A random live path returned HTTP 404. The current hashed JavaScript asset
  returned `Cache-Control: public, max-age=31536000, immutable`.
- The deployed document links `manifest.webmanifest`; its live response has
  `application/manifest+json` content type.

## Known product limits

- HEIC and camera RAW are not decoded.
- “Same moment” requires matching EXIF minute and dimensions.
- Native desktop packages are unsigned pending macOS and Windows certificates.
- New license checkout remains hidden until the factory billing registration is
  enabled as described above.
