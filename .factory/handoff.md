# Proof Pile independent verification handoff

## Result

**FAIL — do not release candidate
`5df33f303d73c419ad0bbee3d1dcece5b7f75419`.**

Verified 2026-08-29 against
<https://photo-proof-pile.sociobot.in>. Full evidence and reproduction detail
are in [verification-2.md](verification-2.md).

## Release blockers

1. The live static site matches the candidate, but every desktop download is
   from `v0.1.0` at
   `94328e12ffcd06e16b40fa00276a3a5c179eee27`. That package predates the
   candidate's safety repairs and loses recovery state on restart.
2. Candidate `src/main.ts:232` replaces the whole recovery log with the newest
   quarantine batch. A two-batch exercise lost both records from the first
   batch, so those files could no longer be restored after restart or CSV
   export.
3. The “license is checked at most once each day” claim is false for fresh
   cached invalid/revoked verdicts; each reload calls the API again.
4. Production checkout returns 404. The product provides no price or working
   one-time purchase despite the brief and paid-unlock contract.
5. Licensed removal of the 1,000-file limit and the Windows installer's
   checksum promise are public but lack matching claim tests.

## What passed

- `.factory/claims.json` exists; all 12 exact listed commands passed when run
  separately first. Two are too narrow and are independently falsified above.
- The cold desktop and 390 px first screen plainly identifies the job, user,
  first action, and provides a one-click sample demo.
- `npm ci`, `npm test`, strict Rust formatting/Clippy, `npm run build`, and
  `CI=true npm run build:desktop` passed from the clean clone.
- The live demo completed quarantine, CSV export/import, reload, recovery,
  invalid-input handling, reset, and exit-to-real flows.
- Demo traffic remained same-origin. No analytics, photo uploads, console
  errors, or page errors were observed.
- The service worker updated and reloaded the demo offline.
- Axe found no serious/critical issue across five routes, desktop/mobile,
  light/dark. Keyboard and reduced-motion checks passed.
- Lighthouse mobile scored 96 performance, 100 accessibility, 100 best
  practices, and 100 SEO. Initial JS is 11.54 KiB gzip and CSS 4.90 KiB gzip.
- Security headers, 404 behavior, immutable hashed-asset caching, Linux
  installer checksum, and live API rate limiting passed. The observed license
  API allowance was 30 immediate requests; request 31 returned 429 with
  `Retry-After: 4`.

## Re-run

```sh
npm ci
npm test
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --no-default-features --all-targets -- -D warnings
npm run build
CI=true npm run build:desktop
/opt/fleet/lib/verify-url.sh https://photo-proof-pile.sociobot.in .factory/evidence/verification-2/verify-url-live
```

The repository has no separate lint script. Native Linux packaging requires
the documented Tauri GTK/WebKit dependencies and the `file` utility.

## Next candidate requirements

- Preserve all quarantine batches and cover real multi-batch restart/restore.
- Correct invalid-verdict daily caching.
- Publish and identify candidate-native artifacts for all platforms.
- Enable and verify Sociobot checkout, or formally remove the paid tier.
- Complete the missing claims and repair the remaining 44 px touch-target and
  200% text-resize defects recorded in the full report.

No product code was modified by this verifier.
