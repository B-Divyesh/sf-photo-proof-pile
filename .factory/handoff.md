# Proof Pile repair 4 handoff

## Result: PASS

Release-blocking findings from verifier report commit
`5e1b0160b31b67717226423baedfbcc0758b4e61` against candidate
`b604008c3c259a7d0f7b4e1a477f955dcc655cce` are repaired in product commit
`0046d5d7b4bb6a5288c4f5f7e7506b07bde64327`.

## Reproduction before repair

The untouched candidate was run at `/demo` before source changes. After one
two-file quarantine, the plan still showed `2`, the button still said
`Move 2 files to quarantine`, and session storage held two moves. Running the
same plan again left the plan active and grew the move array to four duplicate
records. In the Same moment group, focusing the second file's Quarantine
button and pressing Space changed its state but left `document.activeElement`
as `<body>`.

The two new focused Playwright tests were added first and failed with those
same values before the implementation changed.

## Repairs

- The pending plan now excludes sources with an active recovery record.
  Successful demo and native batches immediately show zero pending files and
  disable the run button.
- A run-in-progress guard prevents concurrent activation. Completed records
  are accepted only for the source snapshot sent to native code, and only one
  active recovery record is stored per source.
- Older saved reviews with duplicate active records are normalized on read.
  Restored records remain as history; restoration returns the file decision to
  review instead of silently scheduling the same move again.
- Completed rows say `Moved to quarantine`, disable stale decision controls,
  and keep Restore available only while an unrestored record exists.
- Repeating Mark exact extras after completion reports that the copies are
  already quarantined and leaves the pending count at zero.
- A file decision now moves focus to the Keep control for the next actionable
  file. On the final file, focus stays on the chosen control instead of falling
  to the document body.
- Product, Rust, Tauri, cache, and package identity advanced to `0.1.5` /
  `proof-pile-v8` without changing the artifact or deployment class.

## Exact regression coverage

- `tests/app.spec.ts` — `completed quarantine plans leave no pending work and
  repeat safely in demo and native flows` runs a completed plan again in both
  modes, checks a zero pending count, two unique records, one native IPC call,
  and repeat Mark exact extras behavior.
- `tests/app.spec.ts` — `keyboard decisions move focus to the next file without
  restarting traversal` makes consecutive Space-key decisions in a non-exact
  group and checks focus after each render.
- `tests/model.test.ts` — verifies active moves are absent from the pending plan,
  restored moves can be reviewed again, and duplicate active recovery records
  are collapsed.

## Verification evidence

Run on 29 August 2026 UTC from a clean `npm ci`:

- `npm audit --audit-level=high` — 0 vulnerabilities.
- All 19 commands in `.factory/claims.json`, run separately and verbatim — 19
  passed.
- `npm test` — 9 Rust, 8 Vitest, and 24 Playwright tests passed.
- `npm run check` — TypeScript, Rust formatting, and strict Clippy passed.
- `npm run build` — `dist/site` produced; main application JS is 13.11 kB gzip
  and CSS is 5.08 kB gzip.
- `CI=true npm run build:desktop` — produced v0.1.5 DEB, RPM, and AppImage.
  The AppImage stayed running for the full 15-second Xvfb smoke window.
- `/opt/fleet/lib/verify-url.sh` — local and live root returned 200 with a useful
  title, `lang=en`, one h1, one main, complete alt text, labeled buttons, and no
  console errors.
- Playwright axe — zero serious or critical findings on all routes in light and
  dark modes, and zero on the deployed demo at desktop and 390 px.
- Keyboard — the live second-file Space decision focused `cake-3` Keep; the
  next choice remained in the same file controls.
- Mobile — the live 390 x 844 demo had a 390 px document width. The automated
  suite also passed 200% text, 44 px targets, Android/iPhone copy, and routing.
- Privacy — the complete repaired live demo check made no off-origin requests
  and logged no console or page errors.
- Offline/update — `proof-pile-v8` controlled the deployed site and `/demo`
  reloaded offline with its data and banner intact.
- Response policy — live HTML and service worker use 30-second revalidation;
  hashed assets are immutable for one year; the manifest has its correct MIME
  type; the unknown route returns the designed 404 with HTTP 404; CSP,
  `frame-ancestors`, HSTS, nosniff, referrer, and permissions headers are set.
- Billing policy — an invalid live token returned `valid:false`, `no-store`,
  and the exact live-origin CORS header. Hosted checkout returned HTTP 303 to
  the payment host; no payment provider is embedded. A 45-request burst
  returned 30 successful responses and 15 rate-limited responses; all 15 had
  `Retry-After`.
- Four Lighthouse 12.8.2 mobile runs scored 100/100/100/100 for Performance,
  Accessibility, Best Practices, and SEO. The clean final run measured LCP
  1.55 s, TBT 15.5 ms, and CLS 0.
- Live identity — all 27 deployable files except the deployment-only
  `staticwebapp.config.json` matched `dist/site` byte-for-byte.

## Delivery

Tag `v0.1.5` points to product commit
`0046d5d7b4bb6a5288c4f5f7e7506b07bde64327`. GitHub Actions release run
[`33243636254`](https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33243636254)
passed prepare, Linux, Windows, macOS arm64, macOS Intel, and checksum jobs.
The release contains 11 assets: both macOS architectures, Windows EXE/MSI,
Linux AppImage/DEB/RPM, app archives, `SHA256SUMS`, and `latest.json`.

`latest.json` reports v0.1.5 and the exact product commit. Its platform URLs
all resolve to v0.1.5 assets. `SHA256SUMS` has nine package/archive entries.
The live Linux installer installed the released AppImage into an isolated
directory and verified SHA-256
`26098423aeee79d5472fc0d6cf0ced1c30c2f1ef738167b0505d4fb1e5ab713a`.
The live download picker showed v0.1.5 links for macOS arm64/Intel, Windows,
and Linux with no console error.

The static production deployment was uploaded to the existing
`sf-photo-proof-pile` Azure Static Web App in Central US without changing DNS
or infrastructure. <https://photo-proof-pile.sociobot.in> serves the repaired
`index-DcPhMcY6.js` build.

## Known gaps and operator action

No product or test gap is known. Packages remain intentionally unsigned.
macOS notarization and Windows Authenticode require owner-held
`APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` material before signing is enabled.
