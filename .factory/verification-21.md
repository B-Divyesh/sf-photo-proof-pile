# Independent product verification 21 — FAIL

- Date: 1 September 2026 (UTC)
- Work order: `photo-proof-pile-verify-21`
- Candidate: `f0fd4b8e37c1da44380ab111b368279795c4b815`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Demo URL: <https://photo-proof-pile.sociobot.in/demo>

## Decision

**FAIL.** The candidate's local checks and live web experience pass, and the
published package matrix is complete. The downloadable desktop product is not
built from the candidate under review, however. Its public release manifest
identifies the earlier commit `10c5525cc2c227d275296ba1cb583b1a83f3c8d1`.
The candidate has later runtime changes. A public unsigned-package statement
also has no entry in the mandatory claims manifest.

No product source code or deployment was changed during verification.

## Release-blocking findings

### Severity 1 — desktop packages do not match the candidate

The site links to the public v0.1.23 packages, but both independent release
identity sources point to an earlier commit:

- requested candidate: `f0fd4b8e37c1da44380ab111b368279795c4b815`;
- GitHub release `target_commitish`:
  `10c5525cc2c227d275296ba1cb583b1a83f3c8d1`;
- public `latest.json` commit:
  `10c5525cc2c227d275296ba1cb583b1a83f3c8d1`;
- tag `v0.1.23` points to `10c5525…`; no tag points to `f0fd4b8…`.

This is not a documentation-only difference. Between those commits,
`src/main.ts` changed the license rate-limit handling and the release picker,
and both live installer scripts changed. The live web build contains those
candidate changes, while the downloadable desktop app was built before them.
The deployed product therefore does not have one candidate identity across
its web and desktop artifacts.

Required resolution: bump the version, tag the exact accepted source, build
all desktop packages from that commit in GitHub Actions, publish a matching
`latest.json` and `SHA256SUMS`, and deploy the same source to the site.

### Severity 1 — public unsigned-package claim is not registered

The live download dialog says **“Packages are unsigned.”** README says
**“Current packages are unsigned.”** `.factory/claims.json` has no claim for
that statement and no `@claim:<id>` test that verifies the actual Windows and
macOS package signature state. The `desktop-release-assets` test only asserts
that the sentence is displayed; its registered claim covers package-set
completeness, not signature status.

This is release-blocking under the supplied claims contract. Add a dedicated
claim and outcome test that inspects the produced packages, or remove the
claim. Signing remains an operator action, but the current unsigned state can
still be tested.

## Mandatory first-read and demo gate — PASS

A fresh 1440 × 900 browser context showed, in its first viewport:

- what it does: “Review photo copies before you remove them”;
- who it is for: people with photos across several drives who fear removing
  the only meaningful copy;
- what to click first: **Try it with sample data**; and
- what the click does: “Opens three ready-to-review groups.”

One click opened `/demo`, displayed the persistent “Demo — sample data,
nothing is saved” banner, and loaded three groups containing eight files.

Evidence:

- [cold desktop screenshot](verification-21-artifacts/root/screenshot-desktop.png)
- [cold mobile screenshot](verification-21-artifacts/root/screenshot-mobile.png)
- [live demo after restore](verification-21-artifacts/live-demo-after-restore.png)
- [live 390 px / 200% text](verification-21-artifacts/live-mobile-200-percent.png)
- [browser evidence JSON](verification-21-artifacts/live-browser.json)

## Claims gate

`.factory/claims.json` exists with 23 entries. After `npm ci`, every listed
command was run separately and returned zero. The initial pre-install
invocation could not load `@playwright/test`; the complete list was rerun from
the lockfile-installed environment and all tests passed.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-isolated` | PASS | Real and demo storage stayed separate; reset removed only demo state. |
| `match-evidence` | PASS | Three groups and all eight rows exposed every declared evidence field. |
| `csv-export` | PASS | Download contained one header plus eight decision rows. |
| `reversible-plan` | PASS | Move records survived reload, exported, imported, and restored. |
| `review-before-move` | PASS | Native and browser gates rejected unreviewed/unsafe entries and named count/destination. |
| `local-privacy` | PASS | Complete browser sample flow made only same-origin requests. |
| `no-ad-tracking` | PASS | Landing, demo, and privacy loaded no off-origin tracking scripts. |
| `native-local-privacy` | PASS | Native scan/quarantine test used local paths without a network client. |
| `license-request-privacy` | PASS | Verification was a bodyless token-only GET. |
| `no-account` | PASS | The review desk opened and completed without identity fields. |
| `free-scan-limit` | PASS | Native test scanned exactly 1,000 of 1,001 files and set the limit flag. |
| `free-safety-tools` | PASS | Unlicensed quarantine, restart, and restore remained available. |
| `paid-license` | PASS | Saved verdict was reused until the 24-hour boundary. |
| `license-verification-allowance` | PASS locally and live | Live requests 1–30 returned 200; request 31 returned 429 with `Retry-After: 2`. |
| `paid-checkout` | PASS | US$29 copy, Sociobot checkout URL, returned-license storage, and URL cleanup passed. |
| `licensed-scan-limit` | PASS | Native test scanned all 1,001 files with a valid license. |
| `offline-reload` | PASS | Service worker controlled `/demo`; offline reload returned 200 with all groups. |
| `native-matching` | PASS | Exact, visual, and same-moment fixtures grouped correctly without overlap. |
| `scan-scope` | PASS | Only selected folders were read; source bytes and dates did not change. |
| `cross-drive-safety` | PASS | Copy-before-remove preserved bytes, metadata, dates, and avoided collisions. |
| `installer-checksum` | PASS | Linux installer rejected absent or mismatched verification data. |
| `windows-installer-checksum` | PASS | PowerShell contract verifies the package before `msiexec`. |
| `desktop-release-assets` | PASS | Browser offered packages only for a complete mocked platform set. |

The listed claims pass. The overall claims contract fails only because the
unsigned-package statement is unlisted, as described above.

## Local build and test evidence

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 66 packages installed; zero vulnerabilities. |
| `CI=1 npm test` | PASS — 11 Rust, 13 Vitest, and 34 Playwright tests. |
| `npm run check` | PASS — TypeScript, rustfmt, and Clippy with warnings denied. |
| `npm run build` | PASS — exact static production build created `dist/site`. |
| `CI=true npm run build:desktop -- --bundles deb,rpm` | PASS after installing the workflow's documented GTK/WebKit prerequisites. |
| Candidate DEB | PASS — 4,106,230 bytes; extracted app stayed open under Xvfb for eight seconds (expected timeout 124). |
| Candidate RPM | PASS — 4,106,829 bytes. |

The first native-build attempt failed because the clean worker lacked
`glib-2.0.pc`. Installing the same Linux packages declared in the release
workflow resolved it; this is an environment prerequisite, not a source
failure.

Static production output is far below budget: total JavaScript is 43.64 KiB
raw (main entry 13.73 KiB gzip), CSS is 18.64 KiB raw / 5.11 KiB gzip, and the
hero image is 29,922 bytes.

## End-to-end behavior — PASS

The live sample flow rejected quarantining the only kept copy, marked two
exact extras, preserved the plan after cancellation, confirmed “Move 2 files
to /Sample drive/Proof Pile Quarantine?”, moved them, exported a nine-line
CSV, survived reload, opened a focus-managed restore dialog, dismissed it with
Escape, and then restored a record.

Boundary and recovery coverage also passed for 1,000/1,001-file free and
licensed scans, invalid and unavailable license responses, unsafe imported
browser records, source-folder isolation, name collisions, repeated completed
plans, and cross-drive copy-before-remove behavior.

AI is not a missed-leverage requirement here. Local byte/perceptual/metadata
matching solves the brief without sending sensitive photos to a model.

## Live web identity, accessibility, and privacy — PASS

- All 27 served files in `dist/site` matched the live host byte-for-byte.
  `staticwebapp.config.json` correctly returned 404 because it is deployment
  configuration rather than a public asset.
- `/`, `/demo`, `/app`, `/privacy`, and `/terms` returned 200 with route titles,
  `lang="en"`, one `h1`, one `main`, and no missing image alternatives. An
  unknown route returned the designed 404 with HTTP 404.
- The fleet `verify-url.sh` passed `/` and `/demo` with no console errors,
  missing alternatives, or unlabeled buttons.
- Live Axe checks found zero serious or critical findings. Light and dark
  route checks also pass in the repository suite.
- Keyboard checks passed the skip link, listbox arrow navigation, Space
  decisions, Escape dismissal, and safe initial dialog focus. Focus uses a
  visible 3 px solid `rgb(49, 95, 137)` outline.
- At 390 px there was no horizontal overflow; the tested action measured
  316 × 44.39 px. The view remained usable at 200% text.
- Reduced-motion media reduced the tested transition to `0.00001s`.
- The complete demo request log contained only
  `https://photo-proof-pile.sociobot.in` requests. There were no console or
  page errors. No analytics, advertising, CDN font, or photo upload request
  was observed.
- The site has no sign-in requirement, so the Entra tenant check is not
  applicable.

## PWA, headers, caching, and performance — PASS

- The current service worker controlled `/demo`, had no waiting worker after
  `registration.update()`, and reloaded offline with HTTP 200 and all three
  groups.
- Root HTML uses `max-age=30, must-revalidate`; the service worker uses the
  same short policy; the hashed JavaScript asset uses
  `max-age=31536000, immutable`; an ETag conditional root request returned
  304.
- Response headers include CSP with header-delivered `frame-ancestors 'none'`,
  HSTS, `nosniff`, `strict-origin-when-cross-origin`, and disabled camera,
  microphone, and geolocation.
- Fresh mobile Lighthouse: performance 99, accessibility 100, best practices
  100, SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 150 ms, CLS 0, transfer 138 KiB.

## Billing and published installers

- The checkout endpoint returned HTTP 303 to Sociobot's hosted Dodo checkout.
- The live verification endpoint accepted the product origin and enforced the
  documented allowance: 30 HTTP 200 responses, then HTTP 429 with
  `Retry-After: 2` on request 31.
- Public v0.1.23 has nine assets: two DMGs, MSI, EXE, AppImage, DEB, RPM,
  `SHA256SUMS`, and `latest.json`.
- The AppImage SHA-256 was
  `535d0350d26a52325be481edc27fe94c018ac56d5994a00b6fc77be7cc106983`,
  exactly matching `SHA256SUMS`.
- The live one-line Linux installer placed the 79,034,872-byte AppImage in an
  isolated `XDG_BIN_HOME` and printed its installed path. The extracted public
  AppImage stayed open under Xvfb for eight seconds after the container's
  missing EGL/GLES runtime packages were installed.
- GitHub Actions run `33566865116` built all four platform jobs successfully
  from `10c5525…`; the overall run failed at release publication with a GitHub
  integration 403. The assets were later published manually. This explains
  the release history but does not repair the candidate-identity mismatch.

## Final result

**FAIL — candidate `f0fd4b8e37c1da44380ab111b368279795c4b815` is not accepted.**
Publish the exact candidate (under a new immutable version) and register/test
the unsigned-package claim before requesting another verification.
