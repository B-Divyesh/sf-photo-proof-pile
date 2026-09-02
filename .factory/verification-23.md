# Independent product verification 23 — FAIL

- Date: 2 September 2026 (UTC)
- Work order: `photo-proof-pile-verify-23`
- Candidate: `36734eeecd6f0ff8e4971f3d8ac8322953521633`
- Production: <https://photo-proof-pile.sociobot.in>
- Demo: <https://photo-proof-pile.sociobot.in/demo>

## Decision

**FAIL — Severity 1 release blocker.** The live static application is the
requested candidate and the local-first review workflow, demo, claims,
privacy, accessibility, and web quality checks passed. It is nevertheless a
desktop app with no downloadable release built from this candidate. The live
download gate correctly exposes zero packages, so the product cannot be
installed.

## Release-blocking defect

GitHub's live `releases/latest` response named `v0.1.27` and listed all nine
expected release files (two DMGs, MSI, EXE, AppImage, DEB, RPM,
`SHA256SUMS`, and `latest.json`), but its `target_commitish` was
`c77f662186677f7514fd1a7aea51b74013f74b22`, not candidate
`36734eeecd6f0ff8e4971f3d8ac8322953521633`.

The deployed footer identifies the candidate exactly, while **Check desktop
downloads** says “Downloads for this build are being published” and presents
zero package links. This is safe behaviour but fails the desktop release and
installer acceptance contract. A matching new version/tag, complete release
matrix, `SHA256SUMS`, and `latest.json` must be published from this commit (or
a new verified successor), then the same source deployed before re-verifying.

## Mandatory first-read and demo gate — PASS

A cold 1440 × 900 visit to `/` returned 200 with title
`Proof Pile — Review photo copies before cleanup`. The first screen says:

- what it does: “Review photo copies before you remove them”;
- who it is for: people with photos on several drives who fear deleting the
  only meaningful copy; and
- what to click first: **Try it with sample data**, followed by “Opens three
  ready-to-review groups.”

One click opened `/demo`, showing the persistent “Demo — sample data, nothing
is saved” banner, three groups, and eight files. The independent live flow
rejected an unsafe quarantine choice, marked two exact extras, named the exact
sample quarantine destination in the confirmation, moved them only after
confirmation, exported a nine-line CSV (header plus eight records), and
opened the recovery confirmation with the source and destination paths.

## Claims and local quality gates — PASS

After clean `npm ci` (66 packages, zero reported vulnerabilities), every
exact command listed in `.factory/claims.json` was executed separately through
the shipped demo/native entry point: **25/25 passed**. This covers all listed
claims: demo isolation, evidence, CSV export, recovery, reviewed moves,
privacy/tracking, native local processing, licensing and allowance, free and
licensed limits, offline reload, matching/scope/cross-drive safety,
installers, release identity/assets, and unsigned-package disclosure.

`npm test` exercised Rust (11 tests), Vitest (16 tests), and the 36-test
Playwright suite. `npm run check` completed TypeScript checking, rustfmt, and
Clippy with warnings denied. `npm run build` passed and wrote `dist/site`:
the initial JS is 14.03 KiB gzip and CSS is 5.11 KiB gzip. A clean Linux Tauri
build initially lacked container GTK/WebKit prerequisites; after installing
the standard GLib/GTK/WebKit development packages in this disposable QA
container, `npm run build:desktop` produced the native Linux DEB and RPM
bundles. No source files were modified.

## Live QA — PASS except installability

- Deployment parity: the live footer source link is exactly
  `36734eeecd6f0ff8e4971f3d8ac8322953521633`.
- Privacy: the full demo request log contained only
  `photo-proof-pile.sociobot.in` document, script, stylesheet, and sample
  image requests; there were no off-origin requests or browser/page errors.
- API allowance: 30 sequential invalid-token verification requests from one
  client returned 200; request 31 returned **429** with `Retry-After: 4`.
- Accessibility: live `/demo` axe scan reported zero serious/critical
  violations. Keyboard controls worked, focus was visible, 390 px mobile had
  no horizontal overflow, and offline reload worked after service-worker
  control. The demo uses a controlled service worker and still showed its H1
  while offline.
- Headers: the document carries header-delivered CSP with
  `frame-ancestors 'none'`, HSTS, `nosniff`, strict referrer policy, and a
  restrictive permissions policy. Hashed JS/CSS are `max-age=31536000,
  immutable`; root and service worker revalidate at 30 seconds.
- The live site uses `lang`, a title, one H1, main landmark, image alt text,
  skip link, privacy/terms routes, and no third-party scripts or fonts.

Lighthouse was attempted against production using the installed Playwright
Chromium. Its browser tab crashed during full-page capture while the native
release build was consuming the worker; this is a QA-environment limitation,
not counted as a product browser error. The live axe, request, header,
mobile, and bundle checks above completed successfully.

## Handoff

Do not release this candidate as PASS. Publish and verify a complete desktop
release whose immutable tag and manifest both identify
`36734eeecd6f0ff8e4971f3d8ac8322953521633` (or assess a new candidate), then
confirm the production download dialog offers the real platform links and one
download verifies against its published SHA-256.
