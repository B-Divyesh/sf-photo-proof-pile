# Proof Pile independent verification 5

## Verdict: FAIL

Candidate `b604008c3c259a7d0f7b4e1a477f955dcc655cce` is not
releasable. The mandatory first-read gate, every declared claim, clean tests,
checks, production builds, deployment identity, privacy, release packaging,
accessibility automation, and median performance budget pass. Two manual
product checks fail: a completed quarantine remains presented as a pending plan
and can be run again, and each file-decision update drops keyboard focus to the
document body.

- Work order: `photo-proof-pile-verify-5`
- Candidate: `b604008c3c259a7d0f7b4e1a477f955dcc655cce`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Released product source: `214007d84cc4acdee5bc4a6fae30cb95553981c1`
  (`v0.1.4`); the candidate changes only `.factory` documentation
- Verified: 29 August 2026 UTC
- Product code changed by verifier: none

## Findings by severity

### S2 — A completed quarantine remains runnable and duplicates recovery state

After moving two sample files, the live plan still says `2 files marked`,
`9.6 MB would move`, and `Originals stay unchanged until you run the plan`.
The active button still says `Move 2 files to quarantine`.

Running it a second time in the live demo reports success again and grows the
saved move array from two records to four. Both added records repeat the same
source and destination paths. This makes the required one-click sandbox
misrepresent the real file operation and leaves ambiguous duplicate restore
records.

The deployed desktop branch was separately exercised at its real Tauri IPC
boundary. After the first successful two-file move, the second click invoked
`execute_quarantine` with the same two source paths. It then displayed:

```text
The plan did not run. /Phone imports/July/IMG_4812 (1).jpg is no longer a
readable file. Choose a writable quarantine folder and try again.
```

The plan and button still remained active after that error. Source inspection
confirms the cause: `runPlan()` appends move records but never transitions or
excludes the moved file decisions (`src/main.ts:226-244`), while the plan count
is derived only from `decision === "quarantine"` (`src/model.ts:97-100`). The
native core correctly rejects a source that is no longer a file
(`src-tauri/src/lib.rs:486-493`).

This is release blocking for a safety product: immediately after a successful
file move, the primary state and action are false, and the next offered action
fails on the desktop while duplicating recovery state in the required demo.

### S2 — Core keyboard decisions discard focus after every choice

On live `/demo`, keyboard focus reached the second file's `Quarantine` button
after 12 Tab presses from the route heading. It had the designed 3 px visible
outline. Pressing Space changed `aria-pressed` to `true`, but the focused
element became `<body>` because the entire desk was rebuilt.

The same render path runs after every Keep, Quarantine, or Mark for review
choice (`src/main.ts:175-185`). A keyboard user reviewing the Same moment or
Looks alike groups must traverse the page controls again after each file. The
group Arrow-key path explicitly restores focus, but file decisions do not.
This blocks a practical keyboard-only core review despite passing axe, which
cannot detect this state-transition defect.

### Other findings

- No additional release-blocking, major, or minor defect was found.
- Operator action: all packages are intentionally unsigned. macOS notarization
  and Windows Authenticode still require owner-held certificate secrets.

## Mandatory first-read gate — PASS

A cold 1440 x 900 load answers all three required questions before scrolling:

- What: “Review photo copies before you remove them.”
- Who: people with photos across several drives who fear removing the only
  meaningful copy.
- First click: “Try it with sample data,” beside “Opens three ready-to-review
  groups.”

The first screen also gives privacy, account, free-limit, and one-time-price
facts. The sample opens in one click with three populated groups and the
persistent “Demo — sample data, nothing is saved” banner, Reset demo, and Start
for real actions. The same result was confirmed at 390 px and with real Pixel
7 and iPhone 13 user agents.

## Claims gate — all 19 exact commands PASS

`.factory/claims.json` exists. After `npm ci`, every listed command was run
separately, verbatim, from the candidate checkout before broader QA.

| Claim | Result |
| --- | --- |
| `demo-isolated` | PASS |
| `match-evidence` | PASS |
| `csv-export` | PASS |
| `reversible-plan` | PASS |
| `local-privacy` | PASS |
| `native-local-privacy` | PASS |
| `license-request-privacy` | PASS |
| `no-account` | PASS |
| `free-scan-limit` | PASS |
| `free-safety-tools` | PASS |
| `paid-license` | PASS |
| `paid-checkout` | PASS |
| `licensed-scan-limit` | PASS |
| `offline-reload` | PASS |
| `native-matching` | PASS |
| `scan-scope` | PASS |
| `cross-drive-safety` | PASS |
| `installer-checksum` | PASS |
| `windows-installer-checksum` | PASS |

The live landing page, legal pages, README, and copy audit were cross-checked
against the manifest. No separate unlisted material claim was found. The two
findings above are missing workflow/state coverage rather than a failure of a
listed command.

## Clean install, tests, checks, and production builds

| Check | Result |
| --- | --- |
| Initial checkout | PASS — exact requested SHA and clean tree |
| `npm ci` | PASS — 66 packages, 0 audit vulnerabilities |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm test` | PASS — 9 Rust, 7 Vitest, 22 Playwright tests |
| `npm run check` | PASS — TypeScript, Rust format, strict Clippy |
| Separate lint script | Not present; TypeScript and strict Clippy are in `check` |
| `npm run build` | PASS — exact site written to `dist/site` |
| `CI=true npm run build:desktop` | PASS — DEB, RPM, AppImage produced |
| Final product-source diff | PASS — none |

The clean image initially lacked WebKit/GTK development libraries. After
installing the exact Linux prerequisites declared in the release workflow,
plus `file`, the unchanged desktop build passed. Tauri mechanically added an
empty feature list to `Cargo.toml`; that one generated edit was restored
byte-for-byte before reporting.

## End-to-end and recovery evidence

The deployed demo was exercised from empty browser state:

1. All three exact-byte, same-moment, and looks-alike groups exposed eight
   files with paths, dimensions, sizes, dates, cameras, identifiers, and
   other-drive-copy counts.
2. Trying to quarantine the only kept copy was rejected with a corrective
   message.
3. Mark exact extras selected two files. Cancelling the confirmation moved
   nothing; accepting it created two recovery records.
4. CSV export produced `proof-pile-decisions.csv` with one header plus eight
   rows, two quarantine destinations, and 64-digit recovery hashes.
5. Reload retained recovery state. The restore dialog showed both exact paths,
   focused Cancel, supported cancellation, returned focus to the trigger, and
   restored after confirmation.
6. Wrong columns, an unfinished quoted value, and a validly shaped out-of-root
   path were rejected with specific recovery text. Clearing demo storage and
   importing the valid CSV recovered two verified records.
7. Reset returned the plan to zero and removed the demo key. Start for real
   opened `/app` at the empty “Choose folders to scan” state.
8. Repeating the completed plan reproduced the S2 state defect above.

Native tests independently exercised real temporary files for the 1,000/1,001
boundary, exact/perceptual/EXIF matching, selected-folder scope, byte and date
preservation, cross-device copy-before-remove behavior, collision-safe names,
hash-bound recovery, containment rejection, and restore.

## Accessibility, keyboard, mobile, and PWA

- `/opt/fleet/lib/verify-url.sh` passed the live root: HTTP 200, useful title,
  `lang=en`, one h1, one main, complete image alt text, labeled buttons, and no
  normal-load errors.
- Independent axe runs on `/`, `/demo`, `/privacy`, `/terms`, and the 404 page
  at desktop and 390 px, including light and dark treatments, found zero
  violations and zero serious/critical findings.
- The skip link is 44 px high, has a 3 px focus outline, and moves focus to
  main. Arrow keys change groups and restore focus. Restore-dialog Escape/
  Cancel behavior and focus return pass. File-decision focus fails as reported.
- At 390 px, all visible controls are at least 44 px, there is no document
  overflow, and a 200% root text-size check remains within 390 px. Android and
  iPhone show a truthful desktop-only availability message.
- Reduced-motion mode matched, left zero running animations, and reduced
  transitions to 0.01 ms.
- Service worker `proof-pile-v7` controlled the page, completed `update()`, and
  reloaded both `/demo` and `/privacy` offline. The offline demo kept all three
  groups and its sandbox banner.

## Privacy, headers, links, and endpoint policy

- The complete demo edit, confirm, export, reload, import, restore, reset, and
  exit flow made 21 same-origin requests, zero off-origin requests, zero failed
  responses, and zero console/page errors.
- No analytics, telemetry, external fonts/scripts, photo uploads, Azure
  endpoints, or embedded secrets were observed. Explicit download and license
  actions contact only GitHub and Sociobot.
- Root responses include HSTS, CSP with header-delivered
  `frame-ancestors 'none'`, `nosniff`, strict-origin referrer policy, and a
  restrictive permissions policy.
- HTML and `sw.js` use 30-second revalidation. Hashed JS/CSS use
  `public, max-age=31536000, immutable`. The manifest has the correct MIME
  type. A random route returns the designed page with HTTP 404.
- The invalid-license endpoint returned `valid:false`, `Cache-Control:
  no-store`, and the live-origin CORS header. In a 45-request burst, 30 requests
  returned 200 and 15 returned 429 with `Retry-After: 4`. Observed allowance:
  30 requests per burst window.
- Hosted checkout returned HTTP 303 to Dodo with the expected live-origin CORS
  header. No payment provider is embedded in the product.
- All links collected from the home, demo, privacy, terms, and 404 pages
  resolved to 200, an intentional checkout 303, or `mailto:`.
- There is no sign-in, so the Microsoft Entra tenant requirement does not
  apply. There is no product backend beyond external release/billing APIs, so
  backend concurrency and persistence checks do not apply.

## Performance and bundle budgets

Three fresh Lighthouse 12.8.2 mobile runs scored 89, 100, and 98 for
Performance; the median is 98. Accessibility, Best Practices, and SEO were 100
in every recorded report. Median total blocking time was 167 ms. LCP ranged
from 1.08 to 1.23 seconds, CLS was 0, and transfer was about 136 KiB. The first
89-point sample measured an isolated 436 ms TBT; it is retained here rather
than omitted.

The production build reports 12.65 kB gzip for the main application JS and
5.03 kB gzip for CSS. There are no web fonts, and the hero image is 29,922
bytes. The size and median Lighthouse budgets pass.

## Deployment and installer identity

- A fresh production build produced 27 deployable files. Every file except the
  deployment-only configuration matched its live response byte-for-byte,
  including HTML, JS/CSS chunks and maps, service worker, manifest, installers,
  404, icons, sample art, hero, social image, and walkthroughs.
- `v0.1.4` identifies source
  `214007d84cc4acdee5bc4a6fae30cb95553981c1`. The requested candidate differs
  only in `.factory/handoff.md` and `.factory/polish-1.md`; product and package
  sources are identical.
- GitHub Actions run `33239435244` completed successfully for release setup,
  macOS arm64, macOS x64, Windows x64, Linux x64, and checksums.
- The release has 11 assets. `latest.json` is valid and lists both macOS
  architectures, Windows EXE/MSI, and Linux AppImage/DEB. `SHA256SUMS` lists
  all nine package/archive assets.
- The live download picker displayed real `v0.1.4` assets and a calm fallback
  when GitHub metadata was unavailable.
- The shipped Linux installer completed into an isolated directory. The
  installed AppImage SHA-256 was
  `4fc7425b6a058513f35a73c0ea05fa123b690fdd9149cada2230e023b0b982fb`,
  exactly matching `SHA256SUMS`. The released application remained running
  under Xvfb until the 15-second smoke-test timeout.

## Required remediation

1. Separate pending decisions from completed moves. After a successful batch,
   remove those files from the runnable plan, update the copy/state, and make
   repeated activation idempotent in both demo and desktop paths. Add a test
   that runs one completed plan twice.
2. Preserve or deliberately move focus after every file decision. Add a
   keyboard regression test that marks several files in a non-exact group
   without restarting traversal from the document body.
