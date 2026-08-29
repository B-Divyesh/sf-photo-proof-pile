# Proof Pile verification handoff

## Result

**FAIL — candidate `2d009a4742a1ff2ffdb2f2159a02e58277ee720e` must not
be released.**

- Tested URL: <https://photo-proof-pile.sociobot.in>
- Verified: 29 August 2026 UTC
- Full report: `.factory/verification-3.md`
- Product code changed: none

## Blocking defects

1. **S1 — unsafe imported restore records.** A CSV with only the expected
   column names can provide arbitrary `path` and `quarantine_path` values.
   Import accepts them, and “Restore last move” forwards them to the native
   command without showing/confirming the paths. The native command then moves
   the referenced local file if the target is absent. This violates the core
   safe-cleanup contract.
2. **S2 — unsupported cross-device claim.** README says a decision CSV can
   recover records “on another device,” but the CSV stores absolute paths and
   the app has no path-remapping step. The registered claim test reimports only
   inside the same demo environment and does not cover that statement.

Non-blocking S3: Android is labeled “Download for Linux” and iPhone is labeled
“Download for macOS,” so the secondary CTA offers unusable desktop packages on
phones.

## Passing evidence

- All 15 exact commands in `.factory/claims.json` passed independently.
- `npm ci`: 66 packages, 0 vulnerabilities.
- `npm test`: Rust 6/6, Vitest 6/6, Playwright 19/19.
- `npm run check`: TypeScript, Rust formatting, and strict Clippy passed.
- `npm run build`: passed and produced `dist/site`.
- `CI=true npm run build:desktop`: passed after installing the Tauri Linux
  prerequisites declared in the release workflow; DEB, RPM, and AppImage were
  produced.
- The first-read and one-click demo gates passed on desktop and 390 px mobile.
- The complete normal demo, cancellation, kept-copy guard, CSV export,
  persistence, malformed-import errors, valid import, restore, reset, and
  exit-to-real flow worked.
- Every deployable local static artifact matched the live site byte for byte.
- Live privacy logging stayed same-origin; no normal-flow console/page errors.
- Header, caching, true-404, service-worker update/offline, keyboard, focus,
  reduced-motion, 200% text, and light/dark axe checks passed.
- Mobile Lighthouse: 100 Performance, 100 Accessibility, 100 Best Practices,
  100 SEO; LCP 1.2 s, CLS 0, total transfer 135 KiB.
- Billing checkout returned 303 to hosted Dodo checkout. In the fresh run, the
  verify endpoint allowed 33 immediate requests, then request 34 returned 429
  with `Retry-After: 4` (the observed burst-window allowance).
- Release workflow `33230591124` passed all macOS, Windows, Linux, and checksum
  jobs. The live installer downloaded an AppImage whose SHA-256 matched
  `SHA256SUMS`, and that installed application launched successfully.

## How to reproduce the blocker

Run the desktop app, import a CSV containing:

```csv
"path","quarantine_path","restored_at"
"/some/absent/path/file.txt","/some/existing/file.txt",""
```

The app accepts it as a recovery record. If the existing path is readable and
the absent path is writable, “Restore last move” asks the native layer to move
the existing file there. Use disposable files only when confirming this.

## Required next work

- Validate imported recovery records against a user-selected quarantine root
  and stored file hash; preview and confirm exact restore paths.
- Implement safe cross-device path relocation with a claim test, or remove the
  cross-device statement.
- Correct mobile OS detection and messaging.
- Re-run every claims command, `npm test`, `npm run check`, both production
  builds, live byte comparison, and the hostile CSV case before release.

Native packages are intentionally unsigned. Future signing still requires the
operator's `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` secrets.
