# Adversarial first-read review 4

## Verdict: FAIL

- Product: Proof Pile (`photo-proof-pile`)
- Live URL: <https://photo-proof-pile.sociobot.in>
- Reviewed commit: `b684b1ab72d616f0b815592238cb9f7f6aa20f98`
- Reviewed: 29 August 2026 UTC
- Work order: `photo-proof-pile-review-4`
- Product code changed: none

The landing page is clear on a cold 390 px phone and desktop visit, the sample
opens in one click with realistic evidence, and all registered claim commands
pass from a clean clone. This is nevertheless a FAIL. The live download
dialog still offers unsigned macOS and Windows packages for a program that
reads and moves personal files. This is the previously unresolved release
trust finding, so it remains blocking under this review's history rule.

## Findings

### Blocking

#### F-1-34 (recurring; review-4 index F-4-1) — Published desktop packages remain unsigned

- Quote/location: live download dialog after **Download for Linux**: “Current
  builds are unsigned. Your system may ask you to confirm the first launch.”
  The same conditional state is documented in `README.md` (“The download
  dialog identifies packages without verified signatures as unsigned.”).
- Evidence: a fresh live browser context loaded release `v0.1.13`, displayed
  download actions for macOS, Windows, and Linux, then displayed the quoted
  unsigned-build warning. `.factory/handoff.md` also records that the published
  macOS and Windows packages are unsigned. The repository test
  `@claim:unsigned-builds` correctly proves that the warning is shown; it does
  not make the packages trusted.
- Why this fails: a first-time visitor must bypass an operating-system trust
  warning before installing a tool permitted to quarantine personal photos.
  F-1-34, F-2-2, and F-3-1 required signed and notarized release assets; the
  live product still has the failure they describe.
- Concrete fix: publish a Windows Authenticode-signed package and signed,
  notarized macOS packages using the owner-held credentials. Verify those
  downloaded release assets independently in CI, publish
  `DESKTOP_SIGNATURES_VERIFIED.json`, and only then remove the unsigned warning.

## Cold first screen

### Phone: 390 × 844, fresh context, before scrolling

- What it does: reviews photo copies before the visitor removes extras.
- Who it is for: people with photos on several drives who fear removing the
  only meaningful copy.
- What to click first: **Try it with sample data**. Its adjacent explanation
  says, “Opens three ready-to-review groups.”

Result: pass. The required information and primary action are visible without
scrolling, there is no horizontal overflow, and the page reports no console
errors.

Exact first-read text:

> “Review photo copies before you remove them”
>
> “For people with photos across several drives who fear removing the only
> meaningful copy.”
>
> “Try it with sample data” — “Opens three ready-to-review groups.”

### Desktop: 1440 × 1000, fresh context, before scrolling

Result: pass. The same job, audience, and action are immediately visible. The
light-table composition, archival paper palette, clipped photo frames, and
registration marks match `.factory/design.md`; this is not a generic SaaS
template.

## Copy audit

Method: whitespace-separated word counts. Hyphenated terms, code tokens, URLs,
prices, and versions count as one word. `Claim` names the registered evidence
where a reader-facing factual promise is made. No sentence exceeds 22 words;
no banned marketing adjective, metaphor/mood heading, inconsistent core term,
or non-result-naming button was found. The one release-trust finding is listed
above rather than duplicated in this audit.

### Landing page

| Copy | Words | Claim/check |
| --- | ---: | --- |
| Skip to main content | 4 | navigation |
| Proof Pile | 2 | wordmark |
| Demo | 1 | navigation |
| How it works | 3 | navigation |
| Privacy | 1 | navigation |
| Local duplicate-photo review | 3 | section label |
| Review photo copies before you remove them | 7 | headline |
| For people with photos across several drives who fear removing the only meaningful copy. | 14 | audience |
| Try it with sample data | 5 | demo-isolated |
| Opens three ready-to-review groups. | 4 | match-evidence |
| Download for Linux | 3 | result-naming action |
| Photos stay on this device | 5 | local-privacy, native-local-privacy |
| Works without an account | 4 | no-account |
| Free for 1,000 files; US$29 once for full libraries | 9 | free-scan-limit, paid-checkout |
| Each group keeps its file locations, dates, sizes, and match details. | 11 | match-evidence |
| The review desk | 3 | section label |
| See why files match | 4 | explanatory heading |
| Compare file locations, image sizes, dates, and copies on other drives before making a plan. | 15 | match-evidence |
| Exact bytes | 2 | sample group label |
| 3 copies · 2 drives | 4 | sample group label |
| How photo cleanup works | 4 | section heading |
| Scan your folders | 3 | step heading |
| Choose photo folders on each connected drive. | 7 | scan-scope |
| The app reads files where they are. | 7 | scan-scope |
| Start with groups, not a delete list. | 7 | instruction |
| Review the evidence | 3 | step heading |
| Keep one copy and mark extras. | 6 | instruction |
| Every path and difference remains visible. | 6 | match-evidence |
| Compare each copy and its metadata. | 6 | instruction |
| Quarantine, then verify | 3 | step heading |
| Move extras to a folder you choose. | 7 | reversible-plan |
| Restore them from the decision log. | 6 | reversible-plan |
| Move reviewed files, then restore if needed. | 7 | review-before-move, reversible-plan |
| Privacy and limits | 3 | section heading |
| Your photos are not uploaded | 5 | local-privacy, native-local-privacy |
| Copies on other drives are matching files, not tested backups. | 10 | safety warning |
| Keep a tested backup. | 4 | safety instruction |
| A matching copy can still live on a failing drive. | 9 | safety explanation |
| Open important backups before cleanup. | 5 | safety instruction |
| Desktop license | 2 | section heading |
| Review a full library | 4 | pricing heading |
| The free app scans 1,000 files at a time. | 9 | free-scan-limit |
| A license removes that scan limit. | 6 | licensed-scan-limit |
| US$29 one-time purchase | 3 | paid-checkout |
| Buy via Sociobot checkout ↗ | 4 | paid-checkout |
| Restore a purchase | 3 | result-naming action |
| Sociobot checkout takes payment. | 4 | paid-checkout |
| For refunds, email support@sociobot.in. | 4 | paid-checkout |
| Review photo copies before you remove them | 7 | footer product statement |
| Review duplicate photos before moving extra copies. | 7 | footer product statement |
| Terms | 1 | legal navigation |
| Built by Param Factory ↗ | 4 | attribution |
| v0.1.13 | 1 | release identity |

### README

| Copy | Words | Claim/check |
| --- | ---: | --- |
| Proof Pile | 2 | document title |
| Review photo copies, quarantine extras, and keep a reversible decision log. | 11 | reversible-plan |
| Proof Pile is for people whose photo libraries span several drives. | 11 | audience |
| The desktop app reads only folders you choose, groups likely copies, and keeps evidence beside each decision. | 17 | scan-scope, native-matching, match-evidence |
| Try the isolated sample at https://photo-proof-pile.sociobot.in/demo or https://photo-proof-pile.sociobot.in/?demo=1. | 8 | demo-isolated |
| The sample needs no account. | 5 | no-account |
| Its choices stay only in this browser tab and never mix with a real review. | 15 | demo-isolated |
| Use Reset demo for a clean state. | 7 | demo-isolated |
| What it does | 3 | section heading |
| Groups exact copies, photos that look alike, and photos taken at the same time. | 13 | native-matching |
| Shows each file location, image size, file size, capture date, camera, file identifier, and copies on other drives. | 18 | match-evidence |
| Builds a reviewed plan before moving any file to a quarantine folder. | 12 | review-before-move |
| Keeps quarantine recovery records after restart. | 6 | reversible-plan |
| Restore verified decision-log records after selecting their quarantine folder. | 9 | reversible-plan |
| Exports every decision and move in a decision log (CSV). | 10 | csv-export |
| Keeps the review desk available offline after its first visit. | 10 | offline-reload |
| Copies on other drives are not tested backups. | 10 | safety warning |
| Open important backups before cleanup. | 5 | safety instruction |
| Price and license | 3 | section heading |
| The free desktop app scans up to 1,000 image files at a time. | 13 | free-scan-limit |
| A US$29 one-time license removes that scan limit. | 8 | licensed-scan-limit, paid-checkout |
| The license changes only the scan limit: quarantine, restore, and decision-log recovery remain available without one. | 15 | free-safety-tools |
| Buy through the Sociobot checkout. | 5 | paid-checkout |
| For refunds, email support@sociobot.in. | 4 | paid-checkout |
| The app stores a returned license under `sb_license:photo-proof-pile` and checks it with the Sociobot API at most once each day. | 18 | paid-license |
| The request contains only the license token. | 6 | license-request-privacy |
| Install | 1 | section heading |
| Download the macOS, Windows, or Linux package from the releases page. | 11 | installation instruction |
| The download dialog identifies packages without verified signatures as unsigned. | 10 | unsigned-builds; F-4-1 applies |
| Linux users can run: | 4 | installation instruction |
| Windows users can run in PowerShell: | 6 | installation instruction |
| Both scripts compare the downloaded package with the published verification file before installing it. | 13 | installer-checksum, windows-installer-checksum |
| Develop and verify | 3 | section heading |
| Requirements: Node.js 22+, Rust stable, and the Tauri 2 system dependencies. | 11 | developer prerequisite |
| The exact static deployment command is `npm run build:site`. | 9 | developer instruction |
| It writes `dist/site`. | 3 | developer instruction |
| How matching works | 3 | section heading |
| The local scanner reads only folders you select. | 8 | scan-scope |
| It compares file bytes for exact copies and image content for photos that look alike. | 15 | native-matching |
| It also reads the capture time and camera stored inside each photo. | 12 | native-matching |
| Files in an exact-copy group do not appear again in another match group. | 13 | native-matching |
| Moving a file preserves its bytes and embedded photo information. | 10 | cross-drive-safety |
| If a move crosses drives, the app copies the file first and removes the source only after a successful copy. | 17 | cross-drive-safety |
| A name collision receives a numbered file name instead of overwriting either copy. | 13 | cross-drive-safety |
| Project map | 2 | section heading |
| `src/` — TypeScript interface, demo data, license flow, and decision log. | 10 | developer map |
| `src-tauri/` — local scanner, matching logic, quarantine, restore, and desktop packaging. | 10 | developer map |
| `public/` — offline web files, original art, sample images, and installer scripts. | 10 | developer map |
| `tests/` — model and Playwright tests. | 5 | developer map |
| `.factory/` — product brief, visual thesis, claims, demo contract, and handoff. | 10 | developer map |
| Privacy and license | 3 | section heading |
| Read the in-product privacy page and terms. | 7 | legal navigation |
| Source code is available under the MIT License. | 9 | repository information |

No unlisted claim finding: each reader-reliant capability statement above maps
to a `.factory/claims.json` entry and an observable test, except explicit
safety instructions/warnings and developer instructions, which do not promise
an unverified product outcome.

## Demo and sandbox

Result: pass.

- The hero's **Try it with sample data** action reaches `/demo` in one click.
- The first screen already contains three populated review groups, eight
  realistic photo rows, locations, dimensions, sizes, capture dates, cameras,
  identifiers, and other-drive-copy counts.
- The persistent banner reads “Demo — sample data, nothing is saved” and offers
  **Reset demo** and **Start for real**.
- The clean-clone `@claim:demo-isolated` test seeded a real local review,
  changed/reset/exited the demo, and proved that only the session-only
  `demo:photo-proof-pile:session` namespace changes. Real
  `proof-pile:session` data remained byte-for-byte unchanged.
- `@claim:local-privacy` recorded the full demo review flow and found only
  same-origin requests. `@claim:offline-reload` passed after the first visit.

## Claims and clean-clone verification

A separate clean clone at `/tmp/photo-proof-pile-review4.r4HmSR` ran `npm ci`.
Every command listed in `.factory/claims.json` completed successfully; the
browser result file reports `{"status":"passed","failedTests":[]}`.

| Claim IDs whose listed command passed |
| --- |
| demo-isolated; match-evidence; csv-export; reversible-plan; review-before-move; local-privacy; no-ad-tracking; native-local-privacy; license-request-privacy; no-account; free-scan-limit |
| free-safety-tools; paid-license; paid-checkout; licensed-scan-limit; offline-reload; native-matching; scan-scope; cross-drive-safety; installer-checksum; windows-installer-checksum; unsigned-builds |

Additional clean-clone gates passed:

- `npm test`: 10 Rust tests, 11 Vitest tests, and 30 Playwright tests.
- `npm run check`: TypeScript, Rust formatting, and strict Clippy.
- `npm run build`: produced `dist/site`; initial JavaScript gzip total is
  about 14.9 kB.

## Structure, routing, privacy, and links

Result: pass.

- `/`, `/demo`, `/app`, `/privacy`, and `/terms` return 200; an unknown route
  returns a designed 404. Each has one `h1`, one `main`, a skip link, favicon,
  canonical URL, description, social metadata, footer Privacy/Terms links,
  and no application console error. The expected network 404 is the sole
  console entry on the unknown route.
- Live titles are product-first where required: `Proof Pile — Review photo
  copies before cleanup` and `Proof Pile — Review photo copies`; policy/demo
  titles use the documented `Route — Product` form.
- At 390 px, each audited route has zero horizontal overflow. The checked
  **How it works** hash routing and history behavior are covered by the green
  browser suite.
- Every rendered internal route, robots file, sitemap, installers, releases
  page, Param Factory link, and hosted checkout URL returned 200 when crawled.
- CSP is response-header based, restricts scripts/styles to self, and permits
  only the documented API origins for connections. The live demo request log
  had no third-party request. No runtime AI feature exists; the brief does not
  imply one, while import/export is provided through the decision log.

## Earlier finding verification

All earlier review and polish documents were read. The following table records
live/code verification rather than relying on their “fixed” labels.

| Earlier ID | Current verification |
| --- | --- |
| F-1-1 | Fixed: isolated session namespace, reset, exit, and real-data preservation pass. |
| F-1-2 | Fixed: browser request-log privacy and native local privacy are separate passing claims. |
| F-1-3 | Fixed: token-only license request is a passing registered claim. |
| F-1-4 | Fixed: passing fixture test checks all eight rows and named evidence. |
| F-1-5 | Fixed: route/back scroll restoration has a passing browser regression. |
| F-1-6 | Fixed: factual “Local duplicate-photo review” label is live. |
| F-1-7 | Fixed: unsupported face/cloud/permanent-delete promises are absent. |
| F-1-8 | Fixed: narrow free-safety promise has a passing unlicensed flow. |
| F-1-9 | Fixed: plain checkout wording and tested refund email are live. |
| F-1-10 | Fixed: `scan-scope` proves selected-only, unchanged sources. |
| F-1-11 | Fixed: public outcome language replaced unproved algorithm detail. |
| F-1-12 | Fixed: plain capture/camera copy and native fixture evidence pass. |
| F-1-13 | Fixed: native matching test prevents overlapping group membership. |
| F-1-14 | Fixed: cross-drive safety claim verifies bytes, metadata, dates, and collisions. |
| F-1-15 | Fixed: unsupported device-migration promise is absent. |
| F-1-16 | Fixed: every checked SPA route has route-specific metadata. |
| F-1-17 | Fixed: true 404 has the common shell, legal links, and metadata. |
| F-1-18 | Fixed: checkout explicitly names Sociobot and its external destination. |
| F-1-19 | Fixed: UI and README use “decision log (CSV)” then “decision log.” |
| F-1-20 | Fixed: reader copy uses “copies on other drives”; demo label uses “Other-drive copies.” |
| F-1-21 | Fixed: “Looks alike” is the user-facing match type. |
| F-1-22 | Fixed: the action names the exact move result and confirmation destination. |
| F-1-23 | Fixed: hero caption describes evidence rather than a slogan. |
| F-1-24 | Fixed: decorative steps label is absent. |
| F-1-25 | Fixed: section is named “Privacy and limits.” |
| F-1-26 | Fixed: footer has a factual product description. |
| F-1-27 | Fixed: first-read evidence wording does not expose unexplained hash jargon. |
| F-1-28 | Fixed: README leads with the user job, not a framework. |
| F-1-29 | Fixed: README describes the demo in user terms. |
| F-1-30 | Fixed: project map says “offline web files.” |
| F-1-31 | Fixed: license action is “Restore a purchase.” |
| F-1-32 | Fixed: unresolved decision action is “Mark for review.” |
| F-1-33 | Fixed: phone availability is truthful and tested. |
| F-1-34 | **Unfixed / recurring as F-4-1:** live public desktop packages remain unsigned. |
| F-2-1 | Fixed: live 404 and product report v0.1.13 consistently. |
| F-2-2 | **Same unresolved release-trust issue as F-1-34 / F-4-1.** |
| F-2-3 | Fixed: `paid-license` checks 23:59:59 and 24:00:00 boundaries. |
| F-2-4 | Fixed: footer does not make asset-provenance marketing claims. |
| F-2-5 | Fixed: refund email is visible, actionable, and tested. |
| F-2-6 | Fixed: installer wording explains the published verification file plainly. |
| F-3-1 | **Same unresolved release-trust issue as F-1-34 / F-4-1.** |
| F-3-2 | Fixed: hash routing is covered and the visible link reaches `#how`. |
| F-3-3 | Fixed: `review-before-move` is registered and passes native/UI checks. |
| F-3-4 | Fixed: `/app` uses `Proof Pile — Review photo copies`. |

## What would make this perfect

Publish independently verified Authenticode-signed Windows assets and signed,
notarized macOS assets, then re-run this exact cold live review. With that
release-trust issue closed, this review found no other remaining work.
