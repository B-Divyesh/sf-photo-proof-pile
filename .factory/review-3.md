# Adversarial first-read review 3

## Verdict: FAIL

- Product: Proof Pile (`photo-proof-pile`)
- Live URL: <https://photo-proof-pile.sociobot.in>
- Reviewed commit: `7e4d0e1ffa313d72969a0eb2ac32597166ce9bc6`
- Reviewed: 29 August 2026 UTC
- Work order: `photo-proof-pile-review-3`
- Product code changed: none

The cold first screen, realistic isolated demo, all 19 registered claim
commands, full test suite, build, privacy request log, and most route/accessibility
checks pass. This remains a FAIL because an earlier release-safety finding is
still true, and a visible header link is broken by the SPA router. There are
also two smaller compliance findings. PASS requires zero findings.

## Findings

### Blocking

#### F-3-1 (recurring F-1-34) — Published desktop packages remain unsigned

- Quote/location: README, “Builds are currently unsigned, so the operating
  system may ask you to confirm the first launch.” `src/main.ts` download
  dialog repeats, “Current builds are unsigned. Your system may ask you to
  confirm the first launch.”
- Evidence: the current README and live download-dialog source both still
  disclose unsigned builds. `.factory/polish-1.md`, `.factory/polish-2.md`,
  and the prior handoff say that signing/notarization is not complete because
  the owner-held credentials are absent. This is not fixed in live behavior or
  code.
- Why this fails: a first-time visitor must override an operating-system trust
  warning before installing software that reads and moves personal photo files.
  The review contract requires every earlier unfixed finding to recur as a
  blocking finding.
- Concrete fix: publish Windows packages signed with Authenticode and macOS
  packages signed and notarized with the owner-held credentials. Verify the
  released assets' signatures in CI and from a clean download. Remove the
  unsigned warning only after those assets are live.

#### F-3-2 — The visible “How it works” navigation link does not reach its section

- Quote/location: header on every SPA route, “How it works”; its href is
  `/#how` in `src/main.ts:24`.
- Evidence: `bindRoutes()` and the document click handler both call
  `navigate(link.pathname)` for `.route-link` elements (`src/main.ts:435` and
  `src/main.ts:495`). `link.pathname` is `/`, so the router discards `#how`,
  resets to the top, and focuses the landing h1. The `#how` section is never
  targeted. This affects the landing page itself and every policy/demo route.
- Why this fails: a header navigation label promises the photo-cleanup steps
  but returns the visitor to the top of the landing page. It is a broken route
  and fails the no-dead-links and deep-link requirements.
- Concrete fix: preserve `pathname + search + hash` when routing, or let
  in-page hash links use normal browser navigation. On navigation to `#how`,
  move focus to the “How photo cleanup works” h2 and retain the hash. Add an
  end-to-end test from `/` and `/privacy` that clicks the link and asserts the
  URL hash and section position/focus.

### Minor

#### F-3-3 — A safety promise in the README is not registered as a claim

- Quote/location: README, “Builds a reviewed plan before moving any file to a
  quarantine folder.”
- Evidence: no entry in `.factory/claims.json` says that files require a
  reviewed plan before a move. `reversible-plan` covers recovery records and
  restoration, not this pre-move guarantee.
- Why this fails: a visitor can rely on this distinction when deciding whether
  to use a cleanup tool. The claims contract requires a claim-like sentence to
  have a named, observable sandbox test.
- Concrete fix: add `review-before-move` to `claims.json`, with a native and
  UI test that proves an unmarked file cannot be moved, a selected quarantine
  decision is required, and the confirmation names the exact count and
  destination. Otherwise remove the sentence.

#### F-3-4 — The `/app` title reverses the required title pattern

- Quote/location: live `/app` title, “Review — Proof Pile”.
- Evidence: the root title is correctly “Proof Pile — Review photo copies
  before cleanup”, but the application route sets `Review — Proof Pile` in
  `src/main.ts:419`. The route-title requirement is “Product — what it does”
  (with the documented policy/demo exceptions).
- Why this fails: bookmarks and shared tabs use an inconsistent title order.
- Concrete fix: use “Proof Pile — Review photo copies” (or another plain
  product-first title under 60 characters) and assert it in the route metadata
  test.

## Cold first screen

### Phone: 390 × 844, fresh context, before scrolling

- What it does: review likely duplicate photo copies before moving extras.
- Who it is for: people with photos on several drives who fear removing the
  only meaningful copy.
- What to click first: **Try it with sample data**; its adjacent helper says
  “Opens three ready-to-review groups.”

Result: PASS. All three answers are visible before scrolling. Exact first-read
copy:

> “Review photo copies before you remove them”
>
> “For people with photos across several drives who fear removing the only
> meaningful copy.”
>
> “Try it with sample data” — “Opens three ready-to-review groups.”

There was no horizontal overflow at 390 px and no browser-console error on
the landing, demo, privacy, terms, or app route. The 404 necessarily records a
network 404 in the browser console but has no application error.

### Desktop: 1440 × 900, fresh context, before scrolling

The same job, audience, and first action are visible. The archival paper
palette, offset photo plates, registration marks, and evidence illustration
match `.factory/design.md`; the page is not a generic SaaS card template.
Result: PASS.

## Copy audit

Method: counts are whitespace-separated words; a hyphenated compound, URL,
price, code token, and version each count as one word. This includes visible
headings, labels, buttons, captions, and footer text. All counts are at most
22. “Claim” identifies the registered evidence; `F-3-3` is the sole unlisted
README capability claim. No banned marketing adjective, metaphor heading,
inconsistent core term, or non-result-naming button was found.

### Landing page

| Copy | Words | Check |
| --- | ---: | --- |
| Skip to main content | 4 | — |
| Proof Pile | 2 | — |
| Demo | 1 | — |
| How it works | 3 | F-3-2: broken destination |
| Privacy | 1 | — |
| Local duplicate-photo review | 3 | — |
| Review photo copies before you remove them | 7 | — |
| For people with photos across several drives who fear removing the only meaningful copy. | 14 | — |
| Try it with sample data | 5 | demo-isolated |
| Opens three ready-to-review groups. | 4 | match-evidence |
| Download for Linux | 3 | — |
| Photos stay on this device | 5 | native-local-privacy |
| Works without an account | 4 | no-account |
| Free for 1,000 files; US$29 once for full libraries | 9 | scan-limit, checkout |
| Each group keeps its file locations, dates, sizes, and match details. | 11 | match-evidence |
| The review desk | 3 | — |
| See why files match | 4 | — |
| Compare file locations, image sizes, dates, and copies on other drives before making a plan. | 15 | match-evidence |
| Exact bytes | 2 | sample label |
| 3 copies · 2 drives | 4 | sample label |
| How photo cleanup works | 4 | — |
| Scan your folders | 3 | — |
| Choose photo folders on each connected drive. | 7 | — |
| The app reads files where they are. | 7 | scan-scope |
| Start with groups, not a delete list. | 7 | — |
| Review the evidence | 3 | — |
| Keep one copy and mark extras. | 6 | — |
| Every path and difference remains visible. | 6 | match-evidence |
| Compare each copy and its metadata. | 6 | — |
| Quarantine, then verify | 3 | — |
| Move extras to a folder you choose. | 7 | reversible-plan |
| Restore them from the decision log. | 6 | reversible-plan |
| Move reviewed files, then restore if needed. | 7 | reversible-plan |
| Privacy and limits | 3 | — |
| Your photos are not uploaded | 5 | local-privacy, native-local-privacy |
| Copies on other drives are matching files, not tested backups. | 10 | safety warning |
| Keep a tested backup. | 4 | safety instruction |
| A matching copy can still live on a failing drive. | 9 | safety explanation |
| Open important backups before cleanup. | 5 | safety instruction |
| Desktop license | 2 | — |
| Review a full library | 4 | — |
| The free app scans 1,000 files at a time. | 9 | free-scan-limit |
| A license removes that scan limit. | 6 | licensed-scan-limit |
| US$29 one-time purchase | 3 | paid-checkout |
| Buy via Sociobot checkout | 4 | paid-checkout |
| Restore a purchase | 3 | — |
| Sociobot checkout takes payment. | 4 | paid-checkout |
| For refunds, email support@sociobot.in. | 4 | paid-checkout |
| Review duplicate photos before moving extra copies. | 7 | — |
| Terms | 1 | — |
| Built by Param Factory | 4 | attribution |
| v0.1.10 | 1 | release identity |

### README

| Copy | Words | Check |
| --- | ---: | --- |
| Proof Pile | 2 | — |
| Review photo copies, quarantine extras, and keep a reversible decision log. | 11 | — |
| Proof Pile is for people whose photo libraries span several drives. | 11 | — |
| The desktop app reads only folders you choose, groups likely copies, and keeps evidence beside each decision. | 17 | scan-scope, matching, evidence |
| Try the isolated sample at https://photo-proof-pile.sociobot.in/demo or https://photo-proof-pile.sociobot.in/?demo=1. | 8 | demo-isolated |
| The sample needs no account. | 5 | no-account |
| Its choices stay only in this browser tab and never mix with a real review. | 15 | demo-isolated |
| Use Reset demo for a clean state. | 7 | demo-isolated |
| What it does | 3 | — |
| Groups exact copies, photos that look alike, and photos taken at the same time. | 13 | native-matching |
| Shows each file location, image size, file size, capture date, camera, file identifier, and copies on other drives. | 18 | match-evidence |
| Builds a reviewed plan before moving any file to a quarantine folder. | 12 | F-3-3 |
| Keeps quarantine recovery records after restart. | 6 | reversible-plan |
| Restore verified decision-log records after selecting their quarantine folder. | 9 | reversible-plan |
| Exports every decision and move in a decision log (CSV). | 10 | csv-export |
| Keeps the review desk available offline after its first visit. | 10 | offline-reload |
| Copies on other drives are not tested backups. | 10 | safety warning |
| Open important backups before cleanup. | 5 | safety instruction |
| Price and license | 3 | — |
| The free desktop app scans up to 1,000 image files at a time. | 13 | free-scan-limit |
| A US$29 one-time license removes that scan limit. | 8 | licensed-scan-limit, paid-checkout |
| The license changes only the scan limit: quarantine, restore, and decision-log recovery remain available without one. | 15 | free-safety-tools |
| Buy through the Sociobot checkout. | 5 | paid-checkout |
| For refunds, email support@sociobot.in. | 4 | paid-checkout |
| The app stores a returned license under `sb_license:photo-proof-pile` and checks it with the Sociobot API at most once each day. | 18 | paid-license |
| The request contains only the license token. | 6 | license-request-privacy |
| Install | 1 | — |
| Download the macOS, Windows, or Linux package from the releases page. | 11 | — |
| Builds are currently unsigned, so the operating system may ask you to confirm the first launch. | 15 | F-3-1 |
| Linux users can run: | 4 | — |
| Windows users can run in PowerShell: | 6 | — |
| Both scripts compare the downloaded package with the published verification file before installing it. | 13 | installer-checksum, windows-installer-checksum |
| Develop and verify | 3 | — |
| Requirements: Node.js 22+, Rust stable, and the Tauri 2 system dependencies. | 11 | developer prerequisite |
| The exact static deployment command is `npm run build:site`. | 9 | — |
| It writes `dist/site`. | 3 | — |
| How matching works | 3 | — |
| The local scanner reads only folders you select. | 8 | scan-scope |
| It compares file bytes for exact copies and image content for photos that look alike. | 15 | native-matching |
| It also reads the capture time and camera stored inside each photo. | 12 | native-matching |
| Files in an exact-copy group do not appear again in another match group. | 13 | native-matching |
| Moving a file preserves its bytes and embedded photo information. | 10 | cross-drive-safety |
| If a move crosses drives, the app copies the file first and removes the source only after a successful copy. | 17 | cross-drive-safety |
| A name collision receives a numbered file name instead of overwriting either copy. | 13 | cross-drive-safety |
| Project map | 2 | — |
| `src/` — TypeScript interface, demo data, license flow, and decision log. | 10 | developer map |
| `src-tauri/` — local scanner, matching logic, quarantine, restore, and desktop packaging. | 10 | developer map |
| `public/` — offline web files, original art, sample images, and installer scripts. | 10 | developer map |
| `tests/` — model and Playwright tests. | 5 | developer map |
| `.factory/` — product brief, visual thesis, claims, demo contract, and handoff. | 10 | developer map |
| Privacy and license | 3 | — |
| Read the in-product privacy page and terms. | 7 | — |
| Source code is available under the MIT License. | 8 | — |

Terminology remains consistent: **group**, **keep**, **quarantine**,
**decision log (CSV)** then **decision log**, **copies on other drives**,
**Looks alike**, and **demo**.

## Demo and sandbox

Result: PASS.

- One click on the primary landing action opened `/demo`; `?demo=1` also
  entered the demo directly.
- The first demo screen was already in use: three realistic groups and eight
  records (Exact bytes, Same moment, Looks alike), with paths, photo evidence,
  dates, cameras, sizes, identifiers, and other-drive counts.
- The persistent banner reads “Demo — sample data, nothing is saved” and has
  **Reset demo** and **Start for real**.
- With a valid seeded real `proof-pile:session`, changing a sample created only
  `demo:photo-proof-pile:session`. Reset removed that demo key; Start for real
  discarded it and preserved the seeded real value byte-for-byte.
- A complete demo review generated only same-origin requests and no console or
  page errors. The browser sample data therefore did not upload.

## Claims and quality gates

`npm ci` was run in this checkout before the tests. Every exact command listed
in `.factory/claims.json` passed individually:

| Claim | Result |
| --- | --- |
| demo-isolated | PASS |
| match-evidence | PASS |
| csv-export | PASS |
| reversible-plan | PASS |
| local-privacy | PASS |
| native-local-privacy | PASS |
| license-request-privacy | PASS |
| no-account | PASS |
| free-scan-limit | PASS |
| free-safety-tools | PASS |
| paid-license | PASS |
| paid-checkout | PASS |
| licensed-scan-limit | PASS |
| offline-reload | PASS |
| native-matching | PASS |
| scan-scope | PASS |
| cross-drive-safety | PASS |
| installer-checksum | PASS |
| windows-installer-checksum | PASS |

`npm test` passed: 9 Rust, 9 Vitest, and 25 Playwright tests. `npm run build`
passed and created `dist/site/`; first-load application JavaScript is 13.12 kB
gzip and CSS is 5.09 kB gzip.

## Structure, routing, links, privacy, and identity

- Live `/`, `/demo`, `/?demo=1`, `/app`, `/privacy`, and `/terms` returned 200
  with one h1 and one main; the designed unknown route returned HTTP 404.
- Root, demo, privacy, terms, and 404 route metadata were route-specific,
  including description, canonical, Open Graph/Twitter text, favicon, apple
  icon, manifest, robots, sitemap, theme color, and response CSP/security
  headers. `/app` has F-3-4.
- Direct routes loaded at desktop and 390 px. Route changes focus the h1 and
  Back preserves the recorded scroll position. F-3-2 is the exception: the
  header's hash destination is lost by routing.
- Internal footer/header destinations and explicit mailto links resolved; the
  checkout is explicitly marked external. The header `/#how` destination is
  the interaction failure recorded in F-3-2.
- Axe coverage in the repository passed without serious or critical issues in
  light/dark presentations; the 390 px layout has no horizontal overflow and
  the decision controls meet 44 px.
- The product has no decorative AI feature or embedded provider key. The brief
  calls for local deterministic photo matching, evidence, quarantine, and CSV
  recovery; those expected high-leverage capabilities exist. Cloud sync would
  conflict with the stated local-first privacy model.

## Earlier findings and history confirmation

Read: `.factory/review-1.md`, `.factory/review-2.md`,
`.factory/polish-1.md`, `.factory/polish-2.md`, all verification reports, and
the prior handoff. The following were checked in current code and live behavior
rather than accepted from their status labels.

| Earlier finding(s) | Current verification |
| --- | --- |
| F-1-1 | Fixed: tagged test and live seeded storage prove separate demo session, reset, and exit isolation. |
| F-1-2–F-1-3 | Fixed: native/local request behavior and token-only license request have distinct claims. |
| F-1-4 | Fixed: all eight sample rows and named evidence fields are asserted. |
| F-1-5 | Fixed: Back restores saved scroll and h1 focus. |
| F-1-6–F-1-9 | Fixed: landing wording is factual; unsupported boundaries removed; free safety scope and payment/refund action are tested. |
| F-1-10–F-1-15 | Fixed: selected roots, matching outcome, camera, unique groups, cross-drive preservation, and license copy have current coverage/copy. |
| F-1-16–F-1-18 | Fixed: route metadata, designed 404 shell, and explicit external checkout are current. |
| F-1-19–F-1-22 | Fixed: decision-log, other-drive, Looks alike, and quarantine-action wording is consistent. |
| F-1-23–F-1-33 | Fixed: prior slogan, jargon, button, footer, and mobile-availability findings are not present. |
| F-1-34 / F-2-2 | **Unfixed; recurs as blocking F-3-1.** |
| F-2-1 | Fixed: live static 404 reports v0.1.10, matching package and app sources. |
| F-2-3 | Fixed: the paid-license test mocks 23:59:59 and 24:00:00 boundaries. |
| F-2-4–F-2-6 | Fixed: no footer provenance claim; refund email is actionable/tested; installer text uses a plain verification-file explanation. |

## What would make this perfect

Publish signed/notarized desktop assets, repair the `How it works` hash route,
register and test the reviewed-plan guarantee, and normalize `/app` to the
product-first title pattern. Then rerun the full cold review and claim suite.
