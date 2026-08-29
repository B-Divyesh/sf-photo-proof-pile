# Proof Pile independent verification 7

## Verdict: FAIL

Candidate `86955210bdd5a26e536d82151ee7f26e032d0ca2` is **not releasable** until
the desktop review-decision controls meet the required 44 × 44 CSS px minimum.
No product code was changed by this verifier.

- Work order: `photo-proof-pile-verify-7`
- Candidate: `86955210bdd5a26e536d82151ee7f26e032d0ca2`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Verified: 29 August 2026 UTC

## Release-blocking finding

- **S1 accessibility / touch target — FAIL.** On the live `/demo` review desk
  at desktop width, every per-file `Keep`, `Quarantine`, and `Mark for review`
  control is only 36 px high (measured by Playwright at 1440 × 900). The source
  rule is `src/style.css:183`: `min-height: 36px`; the 44 px override exists
  only inside the mobile media query at `src/style.css:269`. The acceptance
  contract requires touch/click targets of at least 44 × 44 CSS px. This
  affects the primary, potentially destructive decision controls on desktop
  and touch-capable laptops. Increase their target height to 44 px in the base
  rule and rerun desktop/mobile accessibility and claim tests.

No S2 findings were found. Packages remain intentionally unsigned; that is
already disclosed and requires operator-held signing credentials, not a source
repair.

## Mandatory first-read gate: PASS

A cold live load at 1440 × 900 and 390 × 844 plainly answers all three
required questions in the first screen:

- **Does:** “Review photo copies before you remove them.”
- **For whom:** people with photos across several drives who fear removing the
  only meaningful copy.
- **First action:** “Try it with sample data,” with “Opens three ready-to-review
  groups.”

One click opens a populated desk with three realistic groups and the persistent
“Demo — sample data, nothing is saved” banner, Reset demo, and Start for real.

## Claims gate: PASS

`.factory/claims.json` exists. From the clean candidate after `npm ci`, every
one of its 19 exact commands passed through the declared demo/native entry
point:

| Claims | Result |
| --- | --- |
| `demo-isolated`, `match-evidence`, `csv-export`, `reversible-plan`, `local-privacy`, `license-request-privacy`, `no-account`, `free-safety-tools`, `paid-license`, `paid-checkout`, `offline-reload` | PASS — 11 Playwright claim tests |
| `native-local-privacy`, `free-scan-limit`, `licensed-scan-limit`, `native-matching`, `scan-scope`, `cross-drive-safety` | PASS — six individual Rust claim tests |
| `installer-checksum`, `windows-installer-checksum` | PASS — two individual Vitest claim tests |

## Build and product checks: PASS except finding above

- `npm ci`: PASS; 66 packages installed, zero audit vulnerabilities reported.
- `npm test`: PASS; 9 Rust tests, 9 Vitest tests, 24 Playwright tests.
- `npm run check`: PASS; TypeScript, Rust format, strict Clippy.
- `npm run build`: PASS; `dist/site` produced. Initial application JS is
  13.12 kB gzip; CSS is 5.10 kB gzip.
- `CI=true npm run build:desktop`: PASS after installing the standard Tauri
  Linux development prerequisites missing from this disposable image. It made
  DEB, RPM, and `Proof Pile_0.1.9_amd64.AppImage` (78,674,424 bytes). Tauri
  temporarily rewrote the empty optional-feature list in `Cargo.toml`; it was
  restored before handoff.
- Live deployment identity: PASS. The live main asset is
  `assets/index-CRVzR_hV.js`, the exact hash emitted by this candidate’s
  production build; live CSS also matches `index-peHjQc6F.css`.

## End-to-end, privacy, accessibility, and deployment evidence

- Live demo at desktop and 390 px: normal exact-extra quarantine moved two
  sample files; reload retained recovery; Reset demo cleared it; attempting to
  quarantine the only kept copy was rejected with corrective text. A malformed
  decision CSV was rejected with a specific recovery message and no page error.
- Axe on live `/demo` reported zero serious or critical issues at desktop and
  390 px. No console or page errors occurred. The documented focus treatment
  is visible: `3px solid rgb(49, 95, 137)`. Reduced-motion reduced durations to
  `0.00001s`; the document had no horizontal overflow at 390 px.
- The full demo request log had zero off-origin requests. The cold landing page
  used only same-origin assets. There are no third-party fonts or analytics.
- Live headers include header-delivered CSP with `frame-ancestors 'none'`,
  HSTS, nosniff, strict-origin referrer policy, and restrictive permissions
  policy. HTML and `sw.js` revalidate in 30 seconds; hashed JS is immutable
  for one year.
- A live service worker controlled `/demo`; after first load, offline reload
  returned 200 with the demo heading and banner. Its update path uses
  `skipWaiting`, cache versioning, stale-cache removal, and `clients.claim`.
- `/`, `/demo`, `/?demo=1`, `/app`, `/privacy`, and `/terms` returned 200;
  a nonexistent route returned 404. `robots.txt` and `sitemap.xml` returned
  200.
- The live release picker fetched GitHub’s CORS-enabled release API without a
  console error and presented macOS arm64/x64, Windows, and Linux links. The
  downloaded Linux AppImage SHA-256 was
  `f0ab5972d3f3bd9069647b6ed71acd9ff7bbf6dc1f137b27cbc96d5da1a37ef0`,
  exactly matching published `SHA256SUMS`.
- The product has no sign-in. The license verify endpoint returned an invalid
  token response with the expected live-origin CORS header. In a fresh 35-call
  single-client burst, calls 1–30 returned 200 and calls 31–35 returned 429
  with `Retry-After: 4`; observed allowance: 30 requests per burst window.

## Reproduce

```sh
npm ci
# Run every command listed in .factory/claims.json separately
npm test
npm run check
npm run build
CI=true npm run build:desktop
```

For the desktop package build on Linux, install the standard Tauri system
prerequisites documented by the project before running the final command.
