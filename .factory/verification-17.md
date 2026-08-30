# Independent product verification 17 — FAIL

Date: 30 August 2026 (UTC)

- Candidate: `8936306242232450087fcdf787e7d4eec243e4f6`
- Branch: `main`; the checkout began clean and `HEAD` matched `origin/main`.
- Live URL: <https://photo-proof-pile.sociobot.in>
- Demo URL: <https://photo-proof-pile.sociobot.in/demo>
- Product version: `0.1.19`
- Artifact class: Tauri desktop app with an offline web demo
- Overall result: **FAIL**

No product code was changed during verification. The candidate is a
documentation-only commit over application source `c5be1f3`, tagged
`v0.1.19`.

## Release-blocking finding

### Severity 1 — no installable desktop release is published

The product contract requires a real release with macOS, Windows, and Linux
packages, `SHA256SUMS`, `latest.json`, and a working detected-platform download.
Fresh evidence shows that distribution is still unavailable:

- GitHub's public releases endpoint returned HTTP 200 with an empty array.
- `/releases/latest` and `/releases/tags/v0.1.19` both returned HTTP 404.
- The live **Check desktop downloads** dialog says “Downloads are not published
  yet. Check again later,” exposes zero package links, and links only to release
  status.
- The live Linux installer returned exit 1 with “A trusted Linux release is not
  published yet. Nothing was installed.” Its isolated target directory was not
  created.
- GitHub Actions run
  <https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33295415409>
  for tagged source `c5be1f3` failed at `validate-signing`. The release
  preparation, four platform builds, signature verification, checksums, and
  final release verification jobs were all skipped.

This is not merely a cosmetic download-page issue. With no public package, a
new user cannot install the desktop scanner and cannot perform the real job of
scanning selected photo folders or moving files to quarantine. The required
release-asset checksum download could not be performed because no release
asset exists. The candidate therefore cannot pass even though its source,
demo, and local builds test cleanly.

## Mandatory first-read and demo gate

**PASS.** On a cold 1440 x 900 live visit, the first screen says:

- what it does: “Review photo copies before you remove them”;
- who it is for: people with photos across several drives who fear removing
  their only meaningful copy;
- what to do first: **Try it with sample data**;
- what happens next: “Opens three ready-to-review groups.”

The primary action opens `/demo` in one click. The demo immediately shows a
persistent “Demo — sample data, nothing is saved” banner, **Reset demo** and
**Start for real**, three realistic groups, and eight photo records. Evidence:
`qa-live-first-read.png` and `qa-live-demo-desktop.png`.

## Claims gate

**PASS — 22/22 exact commands.** `.factory/claims.json` exists. After `npm ci`,
every listed command was run separately before other product QA:

`demo-isolated`, `match-evidence`, `csv-export`, `reversible-plan`,
`review-before-move`, `local-privacy`, `no-ad-tracking`,
`native-local-privacy`, `license-request-privacy`, `no-account`,
`free-scan-limit`, `free-safety-tools`, `paid-license`, `paid-checkout`,
`licensed-scan-limit`, `offline-reload`, `native-matching`, `scan-scope`,
`cross-drive-safety`, `installer-checksum`, `windows-installer-checksum`, and
`verified-downloads-only` all exited 0. Each `@claim:<id>` occurs exactly once
in the test sources. Landing and README claims map to the manifest; no unlisted
material claim was found.

## Clean-checkout quality gates

- `npm ci`: PASS — 66 packages installed; zero audit vulnerabilities.
- `npm test`: PASS — 11 Rust tests, 11 Vitest tests, and 33 Playwright tests.
- `npm run check`: PASS — TypeScript, rustfmt, and Clippy with warnings denied.
- `npm run build`: PASS — exact static production build created `dist/site`.
- `CI=true npm run build:desktop -- --bundles deb,rpm`: PASS after installing
  the Ubuntu GTK/WebKit packages declared by the release workflow. The initial
  attempt failed only because those system prerequisites were absent.
- Local DEB: 4,105,282 bytes, SHA-256
  `4ad0d3b90020e21edfe85de3c6aa7e76ffff6567337733cfc8965250417bbfb1`.
- Local RPM: 4,106,274 bytes, SHA-256
  `278cb843901f3cb8e7648d29002cd3a25e292a65970cf8719ecb5f56ebd774ec`.
- A fresh DEB extraction reported package/version/architecture
  `proof-pile`/`0.1.19`/`amd64`. Its binary stayed open for the full eight-second
  Xvfb smoke window (expected timeout 124) with empty stderr.

## End-to-end behavior and recovery

The live demo was exercised from a fresh context:

- all three evidence types and all eight records were present;
- attempting to quarantine without a kept copy was blocked with an actionable
  message;
- **Mark exact extras** created a two-file plan;
- cancelling the confirmation preserved the plan;
- the confirmation named two files and `/Sample drive/Proof Pile Quarantine`;
- accepting moved two sample files and explicitly said no device files changed;
- CSV export downloaded `proof-pile-decisions.csv` with one header and eight
  record rows;
- reload retained recovery records;
- the restore dialog received focus inside the modal, Escape returned focus to
  its trigger, and a restore completed;
- reset returned the plan to zero;
- malformed CSV was rejected with a specific recovery action;
- importing the exported CSV restored two verified recovery records.

Native tests additionally covered the 1,000/1,001-file free and licensed
boundaries, selected-folder scope, exact/visual/time-near groups, unique group
membership, copy-before-remove, byte/date/metadata preservation, collision
avoidance, hostile recovery paths, repeated quarantine, and restore.

## Live identity, privacy, security, and PWA

- The fresh local build's 24 published non-map files matched the live SHA-256
  bytes exactly. This includes HTML, JS, CSS, service worker, installers,
  imagery, sitemap, robots file, and legal shell. Deployment matches the
  candidate application source.
- A full live demo review/export/recovery flow made 17 requests, all to
  `https://photo-proof-pile.sociobot.in`. There were no third-party scripts,
  fonts, photo uploads, console errors, or page errors.
- A real license-return check used a bodyless GET whose only product data was
  the token query parameter. The URL was stripped, the token stored locally,
  an empty pasted token gave a direct prompt, and an invalid token gave a clear
  inactive-license message.
- Hosted checkout returned HTTP 303 to Dodo.
- The license endpoint allowed 30 requests from one client. Request 31 returned
  HTTP 429 with `Retry-After: 4` and
  `Access-Control-Allow-Origin: https://photo-proof-pile.sociobot.in`.
- Root, demo, hashed assets, service worker, and real 404 responses include
  HSTS, `nosniff`, strict-origin referrer policy, camera/microphone/geolocation
  restrictions, and a matching CSP with `frame-ancestors 'none'`.
- HTML and the service worker cache for 30 seconds; hashed JS/CSS use one-year
  immutable caching. Conditional requests returned HTTP 304.
- The service worker was activated and controlling `/demo`, had no waiting or
  installing update, and an explicit update check completed. Offline reload
  returned HTTP 200 with the demo banner and all three groups.
- The product has no sign-in, so the Entra requirement is not applicable.

## Accessibility and responsive behavior

- `/opt/fleet/lib/verify-url.sh` passed live `/` and `/demo`: HTTP 200, title,
  `lang=en`, one h1, main landmark, alt text, labeled buttons, and no errors.
- Fresh Axe scans found zero serious/critical findings on `/`, `/demo`,
  `/privacy`, `/terms`, and a genuine HTTP 404 in light and dark modes, plus
  `/demo` at 390 px.
- Every checked route has one h1/main, header/footer landmarks, a skip link,
  ordered headings, route-specific metadata, and no missing image alt text.
- Keyboard checks passed skip-link activation, 3 px visible focus, Space on
  decision buttons, next-row focus progression, Arrow Up/Down group behavior,
  modal focus containment, Escape dismissal, and focus return.
- At 390 px there was no horizontal overflow. Visible controls were at least
  44 px high; 200% text retained all content without horizontal overflow.
  Reduced-motion styles reported `0.00001s` durations. Evidence:
  `qa-live-mobile.png` and `qa-live-demo-mobile-200.png`.

## Performance and content

- Lighthouse mobile: performance 98, accessibility 100, best practices 100,
  SEO 100; FCP 0.91 s, LCP 1.06 s, TBT 164.5 ms, CLS 0, total transfer
  140,785 bytes.
- Production application JavaScript totals 43,299 bytes raw; CSS is 18,644
  bytes; there are no web fonts; the hero image is 29,922 bytes.
- Internal routes returned expected 200s and the unknown route returned a
  designed HTTP 404. Checkout returned its expected 303; mail links use an
  allowed scheme; the external factory link returned 200.
- The first-screen and copy audit have no sentence over 22 words or banned
  marketing term. The visual implementation follows the documented archival
  light-table system. No AI feature is needed for this deterministic,
  privacy-sensitive review workflow.

## Final decision

**FAIL — candidate `8936306242232450087fcdf787e7d4eec243e4f6` is not
releasable until signed desktop packages for all required platforms are
published and their manifest/checksums/downloads are verified.**
