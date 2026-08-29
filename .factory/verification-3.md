# Proof Pile independent verification 3

## Verdict: FAIL

Candidate `2d009a4742a1ff2ffdb2f2159a02e58277ee720e` is not
releasable. The normal review workflow, live deployment, paid checkout,
packages, privacy controls, accessibility baseline, and every declared claim
test pass. However, an imported decision CSV is trusted as authority to move
arbitrary local files, which breaks the product's central safety contract. The
README also promises recovery on another device although imported absolute
paths cannot be relocated.

- Candidate: `2d009a4742a1ff2ffdb2f2159a02e58277ee720e`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Verified: 29 August 2026 UTC
- Work order: `photo-proof-pile-verify-3`
- Product code changed by verifier: none

## Release-blocking findings

### S1 — Imported CSV can authorize an arbitrary local file move

The desktop restore path treats any CSV containing `path` and
`quarantine_path` columns as a trusted recovery record. It does not verify that
Proof Pile created the record, that the supposed quarantined file is inside a
user-selected quarantine folder, or that its bytes/hash match the exported
record. “Restore last move” neither shows the two paths nor asks for
confirmation.

Independent reproduction against the deployed candidate, with the Tauri IPC
boundary instrumented, imported this structurally valid file:

```csv
"path","quarantine_path","restored_at"
"/tmp/new-location/important.txt","/tmp/unrelated/important.txt",""
```

The app reported `1 recovery record imported from the decision log.` Clicking
`Restore last move` invoked the native command with exactly those controlled
paths and then reported `important.txt restored.`

The behavior follows directly through the candidate:

- `src/model.ts:114-129` accepts any non-empty source/destination pair.
- `src/main.ts:274-290` saves those rows as recovery records.
- `src/main.ts:239-243` forwards the last record without a path preview or
  confirmation.
- `src-tauri/src/lib.rs:508-520` creates the supplied destination parent and
  moves the supplied `quarantine_path` file to the supplied `path` whenever the
  latter does not already exist.

A malicious or accidentally edited decision log can therefore relocate any
file the app can read into any absent path it can create. This is especially
dangerous in a product whose purpose is to prevent accidental loss. Reject
unverifiable rows, bind recovery to a user-confirmed quarantine root, verify a
stored file hash, and show/confirm the exact source and destination before a
native move.

### S2 — “Recover … on another device” is an unlisted and unsupported claim

`README.md:14` says: “Import the decision CSV to recover those records on
another device.” The exported record contains absolute source and quarantine
paths. Import preserves those paths verbatim, and there is no prompt to locate
the quarantine folder on the new device or map paths across operating systems.
The native restore simply returns “The quarantined file is missing” unless the
old absolute path happens to exist.

The registered `reversible-plan` claim test clears browser session storage and
reimports the CSV in the same demo environment; it does not exercise a second
device, path remapping, or native file lookup. The stronger README statement is
therefore both unlisted in `.factory/claims.json` and not delivered. Under the
provided claims contract, that is release blocking. Remove the cross-device
statement or implement an explicit, safe relocation workflow and add its claim
test.

## Other finding

### S3 — Phones are identified as desktop operating systems

The landing page checks only whether `navigator.userAgent` contains `mac`,
`win`, or `linux` (`src/main.ts:72-77`). Fresh device emulation produced:

- Pixel 7 / Android 14: `Download for Linux`
- iPhone 13 / iOS 15: `Download for macOS`

Neither package can run on that phone. The primary sample-data action remains
clear and usable, so this does not fail the mandatory first-read gate, but the
secondary download action is misleading on the required mobile presentation.

## Mandatory gates

### First-read test — PASS

A cold 1440 x 900 visit and fresh 390 x 844 visit show, without scrolling:

- What it does: “Review photo copies before you remove them.”
- Who it is for: people with photos across several drives who fear removing
  the only meaningful copy.
- What to click first: “Try it with sample data,” followed by “Opens three
  ready-to-review groups.”
- Plain facts: photos stay on the device, no account is needed, and the free
  limit / US$29 one-time price.

The one-click action opens `/demo` with three populated groups and the
persistent “Demo — sample data, nothing is saved” banner. Evidence was captured
in `.factory/evidence/verification-3/live-cold-mobile.png` and by the supplied
URL verifier.

### Claims manifest — all 15 exact commands PASS

`.factory/claims.json` exists. Each declared command was run separately from
the clean candidate checkout before broader QA.

| Claim | Result |
| --- | --- |
| `demo-isolated` | PASS |
| `match-evidence` | PASS |
| `csv-export` | PASS |
| `reversible-plan` | PASS for its same-environment sandbox; see S1/S2 |
| `local-privacy` | PASS |
| `no-account` | PASS |
| `free-scan-limit` | PASS |
| `paid-license` | PASS |
| `paid-checkout` | PASS |
| `licensed-scan-limit` | PASS |
| `offline-reload` | PASS |
| `native-matching` | PASS |
| `cross-drive-safety` | PASS |
| `installer-checksum` | PASS |
| `windows-installer-checksum` | PASS |

Each claim ID maps to one test. The two installer source files also contain
comment markers for their respective tests, so a raw string count is two while
the executable test count remains one.

## Clean install, tests, checks, and builds

| Check | Result |
| --- | --- |
| Clean candidate / `git status` | PASS — exact requested SHA, no initial changes |
| `npm ci` | PASS — 66 packages, 0 audit vulnerabilities |
| `npm test` | PASS — Rust 6/6, Vitest 6/6, Playwright 19/19 |
| `npm run check` | PASS — TypeScript, Rust format, strict Clippy |
| Separate lint script | Not present; strict Clippy and TypeScript are in `check` |
| `npm run build` | PASS — production site written to `dist/site` |
| `CI=true npm run build:desktop` | PASS after installing the documented Tauri Linux prerequisites |

The first desktop attempt correctly identified missing clean-container system
libraries (`glib-2.0` / WebKit GTK). After installing the exact packages from
the repository release workflow, the build produced DEB, RPM, and AppImage
bundles. The Tauri CLI rewrote one dependency line while building; the verifier
restored that line byte-for-byte, leaving no product-code change.

## Functional and recovery checks

The deployed demo was exercised from empty browser storage:

1. It opened three realistic exact-byte, same-moment, and visual groups with
   paths, dimensions, dates, camera, hashes, and other-drive counts.
2. Trying to quarantine the only kept copy was rejected with a corrective
   message.
3. “Mark exact extras” selected two copies. Cancelling the confirmation moved
   nothing; accepting it created two sample recovery records.
4. CSV export produced `proof-pile-decisions.csv` with one header plus eight
   file rows and quarantine destinations.
5. Reload retained recovery state. Clearing demo storage, importing the valid
   CSV, and restoring a record succeeded.
6. A wrong-column CSV and an unfinished quoted value both produced specific,
   recoverable errors.
7. Reset returned the plan to zero. Start for real discarded the demo key and
   opened `/app` in its empty state.

The Rust tests independently cover the 1,000/1,001-file boundary, unlicensed
and licensed scans, exact/visual/EXIF matching, collision-safe quarantine,
cross-device copy-before-remove, timestamp preservation, and restore. The S1
case above is the missing hostile-input boundary.

## Live deployment and release identity

- Candidate, local `HEAD`, and `origin/main` were identical.
- Every deployable file in `dist/site` except the deployment-only
  `staticwebapp.config.json` matched the live response byte for byte: HTML,
  all JS/CSS chunks and maps, service worker, manifest, installers, 404, icons,
  sample images, hero, social image, and walkthroughs.
- Release `v0.1.1` targets
  `5461ae675995fa91739856f13fcf925688af5a4c`. The only candidate change after
  that tag is `.factory/handoff.md`; product and packaging sources are
  identical.
- GitHub Actions run `33230591124` completed successfully for macOS arm64,
  macOS x86_64, Windows x64, Linux x64, and checksums.
- `latest.json` is valid, identifies `v0.1.1` and its source commit, and lists
  two package choices for each platform. The live download dialog offered all
  four user-facing architecture/platform links without errors.
- The live Linux installer installed the published AppImage into an isolated
  directory. SHA-256
  `4c7d63c80fc304851ffcb116e5f6d0df2cf5c2ddcb55cacc8a178baa421d3fe3`
  matched `SHA256SUMS`. The installed application launched and rendered under
  Xvfb; screenshot:
  `.factory/evidence/verification-3/released-app-launch.png`.

## Privacy, headers, caching, and endpoint policy

- The complete demo/edit/confirm/export/reload/import/restore/reset/exit flow
  made only same-origin requests. There were no analytics, trackers,
  third-party fonts/scripts, photo uploads, Azure endpoints, console errors,
  or page errors.
- Source inspection found only expected runtime connections: GitHub release
  metadata and Sociobot checkout/license verification. The CSP allows exactly
  those external connection origins.
- Root responses include HSTS, CSP with header-delivered
  `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, strict-origin
  Referrer Policy, and a restrictive Permissions Policy.
- HTML and `sw.js` use 30-second revalidation. Hashed assets use
  `public, max-age=31536000, immutable`. A random route returns HTTP 404 with
  the designed page.
- Checkout returned HTTP 303 to the hosted Dodo checkout and allowed the live
  origin. An invalid license returned `{valid:false, reason:"invalid"}` with
  `Cache-Control: no-store` and the expected CORS origin.
- In the fresh verification run, license verification returned HTTP 200 for 33
  immediate requests from one client; request 34 and each following request
  returned HTTP 429 with `Retry-After: 4`. The observed allowance was 33
  requests in that burst window (the exact point is time-window dependent).
- There is no sign-in, so the Microsoft Entra tenant requirement does not
  apply. There is no product backend beyond the external billing endpoint, so
  backend concurrency/persistence checks do not apply.

## Accessibility, mobile, PWA, and performance

- The supplied `/opt/fleet/lib/verify-url.sh` passed the live root: HTTP 200,
  title, `lang=en`, one h1, one main, image alt text, labeled buttons, and zero
  load errors.
- Independent axe runs on `/`, `/demo`, `/privacy`, `/terms`, and a true 404 in
  both light and dark presentations found no serious or critical findings.
  A separate dark 390 px demo audit also found none.
- Keyboard checks passed link/button activation, group-list Arrow keys,
  Space-activated decision controls, native-dialog initial focus, Escape, focus
  return, and the skip link. The focus outline is 3 px with 5.90:1 light and
  8.75:1 dark contrast.
- At 390 px, no visible header/footer/control target was below 44 px. The demo
  had no horizontal document overflow or clipped group labels at 200% text.
- Reduced-motion mode was detected; transitions reduced to 0.01 ms and no
  animations were running.
- Service worker `proof-pile-v5` controlled the page, completed an update
  check, and reloaded both `/demo` and `/privacy` offline. The offline demo kept
  all three groups.
- Mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.1 s, LCP 1.2 s, TBT 10 ms, CLS 0, total transfer 135 KiB.
- Initial app JavaScript is 32,384 bytes raw / 11.57 KiB gzip. CSS is 17,837
  bytes raw / 4.96 KiB gzip. There are no web fonts. The hero is 29,922 bytes.
  All supplied budgets pass.

## Required remediation

1. Make imported recovery records non-authoritative until the user selects a
   quarantine root; validate containment and file identity, display the exact
   move, and require confirmation before native restore.
2. Remove the “on another device” statement or implement and test safe path
   remapping across devices/operating systems, then register that exact claim.
3. Detect Android/iOS separately and replace incompatible desktop-download
   labels with a truthful mobile message.

## Fresh independent confirmation

This report was independently rechecked on 29 August 2026 UTC against the
same requested candidate and deployed URL. The checkout already contained this
report and a pending handoff edit; product source `HEAD` was exactly
`2d009a4742a1ff2ffdb2f2159a02e58277ee720e`, and no product source was edited.

- Every one of the 15 commands in `.factory/claims.json` was run from the
  installed clean candidate dependencies. All passed. The full `npm test`
  run also passed (Rust 6/6, Vitest 6/6, Playwright 19/19); `npm run check`,
  `npm run build`, and `CI=true npm run build:desktop` completed successfully.
  The desktop build produced fresh AppImage, DEB, and RPM artifacts.
- A cold live desktop and 390 px mobile visit clearly said what the product
  does, who it is for, and to click “Try it with sample data.” That one click
  opened `/demo`, showed three seeded groups and the persistent isolated-demo
  banner. The live iPhone emulation still mislabeled its secondary action as
  “Download for macOS.”
- The supplied URL verifier passed live (HTTP 200, title, `lang=en`, one h1,
  one main, image alt text, labeled controls, zero normal-load errors). Fresh
  axe runs at `/`, `/demo`, `/privacy`, `/terms`, and the 404 route found no
  serious or critical violations. The normal demo flow issued only same-origin
  requests; its service worker controlled the page and reloaded `/demo`
  offline with all three groups. Initial JS was 11,541 bytes gzip and CSS was
  4,939 bytes gzip.
- Rebuilding the site and comparing SHA-256 values fetched from production
  matched all 27 deployable files. The published Linux installer completed in
  an isolated destination, verified its checksum, and installed an AppImage
  whose SHA-256 was
  `4c7d63c80fc304851ffcb116e5f6d0df2cf5c2ddcb55cacc8a178baa421d3fe3`.
- The imported-CSV defect was reconfirmed on live `/demo`: a CSV containing
  only the standard `path`, `quarantine_path`, and `restored_at` headers plus
  arbitrary absolute paths was accepted with “1 recovery record imported from
  the decision log.” Candidate source then forwards that record unconfirmed to
  `restore_quarantined`, which creates the supplied target parent and moves the
  supplied source file. This is S1, not merely a malformed-input rejection.
