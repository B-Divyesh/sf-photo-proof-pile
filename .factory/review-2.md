# Adversarial first-read review 2

## Verdict: FAIL

- Product: Proof Pile (`photo-proof-pile`)
- Live URL: <https://photo-proof-pile.sociobot.in>
- Reviewed commit: `b0d665115f40898b19d4cd287d68c4adc7d7a6ce`
- Reviewed: 29 August 2026 UTC
- Work order: `photo-proof-pile-review-2`
- Product code changed: none

The first screen, sample demo, storage isolation, request log, route structure,
and the listed commands pass. This is still a FAIL: one earlier release-safety
finding remains open, the live 404 declares the wrong release version, and the
registered test for a daily license-check promise does not test that limit.
Three minor copy/claim findings also remain. `PASS` requires zero findings.

## Findings

### Blocking

#### F-2-1 — The live 404 reports the wrong product version

- Quote/location: live `https://photo-proof-pile.sociobot.in/missing-frame`,
  footer: “v0.1.4 · Generated hero imagery.” The same stale literal is at
  `public/404.html:39`.
- Evidence: the landing page footer, `package.json`, and `src/main.ts:9` all
  identify the reviewed release as `0.1.5`. The existing handoff already
  recorded this as its unresolved S3 defect; a cold live request still serves
  the old value.
- Why this fails: a visitor following an error link receives different release
  identity information than every normal route. This is an unfixed earlier
  handoff finding, which this review contract treats as blocking.
- Fix: render the 404 footer version from the same release source as the app,
  or update the static value to `v0.1.5`; add a static 404 version assertion.

#### F-1-34 (recurring; review-2 index F-2-2) — Production desktop packages remain unsigned

- Quote/location: README: “Builds are currently unsigned, so the operating
  system may ask you to confirm the first launch.” The live download dialog
  repeats: “Current builds are unsigned.”
- Evidence: this is the earlier `F-1-34` finding. `.factory/polish-1.md`
  explicitly leaves it unresolved because owner-held Windows and macOS signing
  material is unavailable. The current README and live dialog still confirm
  the unsigned state.
- Why this fails: a first-time visitor is asked to trust operating-system
  warnings before installing software that can move personal photo files. The
  review instructions require every earlier unfixed finding to return as a
  blocking finding with its original ID.
- Fix: sign Windows packages and sign/notarize macOS packages using the
  owner-held certificates; keep the keys outside this repository. Retain the
  warning only until signed packages are published.

#### F-2-3 — The daily license-check claim has no test for the daily boundary

- Quote/location: `.factory/claims.json`, `paid-license`: “A license can be
  restored and is checked at most once each day.” README: “The app stores a
  returned license under `sb_license:photo-proof-pile` and checks it with the
  Sociobot API at most once each day.”
- Evidence: `tests/app.spec.ts:292` restores a license, reloads immediately,
  and expects one request. It does not set a cache timestamp just inside the
  24-hour window, cross the 24-hour boundary, or assert the request count in
  either case. The implementation contains `86_400_000` at `src/main.ts:461`,
  but implementation inspection is not an observable regression test for the
  public promise.
- Why this fails: the claim command passes while the “at most once each day”
  part is untested. The claims contract requires the one tagged test to prove
  the entire stated claim.
- Fix: extend `@claim:paid-license` with a mocked clock and request counter:
  assert no request at 23:59:59 after `checkedAt`, then exactly one new request
  after 24 hours. Keep the restore-and-storage assertion in that same test.

### Minor

#### F-2-4 — Footer asset-provenance claim is not listed or tested

- Quote/location: landing footer: “Generated hero imagery.”
- Evidence: the sentence is a claim-like statement about the product asset,
  but no entry in `.factory/claims.json` names it. The visual thesis documents
  provenance, but it is not an executable claim test.
- Why this fails: the stated review rule requires each landing claim-like
  sentence to have a corresponding claims entry. A visitor cannot distinguish
  this assertion from verified product copy.
- Fix: either remove the footer assertion and retain provenance in
  `.factory/design.md`, or add a `hero-provenance` claim that checks the shipped
  asset and its checked-in generation record.

#### F-2-5 — The refund instruction is neither actionable nor covered by the payment claim

- Quote/location: landing and README: “Contact Sociobot for refunds.”
- Evidence: this sentence has no link, email address, or policy URL. The
  `paid-checkout` claim proves price, checkout navigation, and a returned
  license; it does not prove a refund contact channel.
- Why this fails: a buyer with a refund problem has been told where to go but
  has not been given a way to do it. It is also an unlisted service claim.
- Fix: write “For refunds, email support@sociobot.in” as a visible `mailto:`
  link (or link the applicable refund policy), and extend the payment claim to
  assert that exact action is present.

#### F-2-6 — Installer copy leaves a security term unexplained

- Quote/location: README: “Both scripts fetch release metadata and verify the
  downloaded package against `SHA256SUMS` before installing it.”
- Evidence: `SHA256SUMS` is an implementation filename, not a first-read
  explanation. The checksum behavior itself is well covered by
  `installer-checksum` and `windows-installer-checksum`.
- Why this fails: a nontechnical photo owner cannot tell what protection the
  sentence gives them.
- Fix: “Both scripts compare the downloaded package with the published
  verification file before installing it.” Keep the filename only in a
  developer reference if needed.

## Cold first screen

### Phone: 390 × 844, fresh context, before scrolling

- What it does: compare duplicate photo files before moving extras.
- Who it is for: people whose photos are spread across drives and who fear
  removing the only meaningful copy.
- What to click first: **Try it with sample data**. The adjacent sentence says
  it opens three ready-to-review groups.

Result: PASS. All three answers appear in the first viewport, as do the local,
no-account, and price facts. Exact copy:

> “Review photo copies before you remove them”
>
> “For people with photos across several drives who fear removing the only
> meaningful copy.”
>
> “Try it with sample data” — “Opens three ready-to-review groups.”

### Desktop: 1440 × 900, fresh context, before scrolling

The same answers and action are visible before scrolling. The offset photo
plates, registration rules, archival paper palette, and evidence illustration
match `.factory/design.md` and are distinct from a generic SaaS template.
Result: PASS.

## Demo and sandbox

Result: PASS.

- One click opens `/demo`; `?demo=1` also opens the demo directly.
- The first screen already shows three realistic groups and eight photo rows:
  Exact bytes, Same moment, and Looks alike.
- The persistent banner reads “Demo — sample data, nothing is saved” and
  includes **Reset demo** and **Start for real**.
- In a fresh context with a separately seeded valid real review, marking sample
  extras created `demo:photo-proof-pile:session` only. Reset removed that key
  and returned the plan to 0. Start for real opened `/app`, discarded demo
  storage, and preserved the real value byte-for-byte.
- The complete live sample flow made only same-origin requests. No console or
  page errors occurred in the valid flow.

## Claims

After `npm ci` in the clean reviewed checkout, every exact command from
`.factory/claims.json` completed successfully. F-2-3 is a coverage finding,
not a failing command.

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-isolated` | `npm run test:e2e -- --grep @claim:demo-isolated` | PASS |
| `match-evidence` | `npm run test:e2e -- --grep @claim:match-evidence` | PASS |
| `csv-export` | `npm run test:e2e -- --grep @claim:csv-export` | PASS |
| `reversible-plan` | `npm run test:e2e -- --grep @claim:reversible-plan` | PASS |
| `local-privacy` | `npm run test:e2e -- --grep @claim:local-privacy` | PASS |
| `native-local-privacy` | `cargo test --manifest-path src-tauri/Cargo.toml --no-default-features claim_native_local_privacy` | PASS |
| `license-request-privacy` | `npm run test:e2e -- --grep @claim:license-request-privacy` | PASS |
| `no-account` | `npm run test:e2e -- --grep @claim:no-account` | PASS |
| `free-scan-limit` | `cargo test --manifest-path src-tauri/Cargo.toml --no-default-features claim_free_scan_limit` | PASS |
| `free-safety-tools` | `npm run test:e2e -- --grep @claim:free-safety-tools` | PASS |
| `paid-license` | `npm run test:e2e -- --grep @claim:paid-license` | PASS; incomplete proof, F-2-3 |
| `paid-checkout` | `npm run test:e2e -- --grep @claim:paid-checkout` | PASS |
| `licensed-scan-limit` | `cargo test --manifest-path src-tauri/Cargo.toml --no-default-features claim_licensed_scan_limit` | PASS |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS |
| `native-matching` | `cargo test --manifest-path src-tauri/Cargo.toml --no-default-features claim_native_matching` | PASS |
| `scan-scope` | `cargo test --manifest-path src-tauri/Cargo.toml --no-default-features claim_scan_scope` | PASS |
| `cross-drive-safety` | `cargo test --manifest-path src-tauri/Cargo.toml --no-default-features claim_cross_drive_safety` | PASS |
| `installer-checksum` | `npm run test:unit -- --testNamePattern @claim:installer-checksum` | PASS |
| `windows-installer-checksum` | `npm run test:unit -- --testNamePattern @claim:windows-installer-checksum` | PASS |

`npm test` passed (9 Rust, 8 Vitest, 24 Playwright tests), and `npm run build`
passed and produced `dist/site/`. The built initial JavaScript gzip size is
13.11 kB.

## Copy audit

Counting method: words are whitespace-separated; a hyphenated compound, URL,
price, code token, or version is one word. Headings, navigation labels,
buttons, facts, captions, and visible footer copy are included. Code commands
are not prose. No audited sentence exceeds 22 words. No banned marketing word,
metaphor heading, inconsistent core term, or non-result-naming button was
found. The flagged exceptions are F-2-4 through F-2-6.

### Landing page

| Copy | Words | Flag |
| --- | ---: | --- |
| Skip to main content | 4 | — |
| Proof Pile | 2 | — |
| Demo | 1 | — |
| How it works | 3 | — |
| Privacy | 1 | — |
| Local duplicate-photo review | 3 | — |
| Review photo copies before you remove them | 7 | — |
| For people with photos across several drives who fear removing the only meaningful copy. | 14 | — |
| Try it with sample data | 5 | — |
| Opens three ready-to-review groups. | 4 | Covered by demo/match evidence |
| Download for Linux | 3 | — |
| Photos stay on this device | 5 | `native-local-privacy` |
| Works without an account | 4 | `no-account` |
| Free for 1,000 files; US$29 once for full libraries | 9 | Scan-limit and checkout claims |
| Each group keeps its file locations, dates, sizes, and match details. | 11 | `match-evidence` |
| The review desk | 3 | — |
| See why files match | 4 | — |
| Compare file locations, image sizes, dates, and copies on other drives before making a plan. | 15 | `match-evidence` |
| Exact bytes | 2 | — |
| 3 copies · 2 drives | 4 | Sample label |
| How photo cleanup works | 4 | — |
| Scan your folders | 3 | — |
| Choose photo folders on each connected drive. | 7 | — |
| The app reads files where they are. | 7 | `scan-scope` |
| Start with groups, not a delete list. | 7 | — |
| Review the evidence | 3 | — |
| Keep one copy and mark extras. | 6 | — |
| Every path and difference remains visible. | 6 | `match-evidence` |
| Compare each copy and its metadata. | 6 | — |
| Quarantine, then verify | 3 | — |
| Move extras to a folder you choose. | 7 | — |
| Restore them from the decision log. | 6 | `reversible-plan` |
| Move reviewed files, then restore if needed. | 7 | — |
| Privacy and limits | 3 | — |
| Your photos are not uploaded | 5 | `local-privacy`, `native-local-privacy` |
| Copies on other drives are matching files, not tested backups. | 10 | — |
| Keep a tested backup. | 4 | — |
| A matching copy can still live on a failing drive. | 9 | — |
| Open important backups before cleanup. | 5 | — |
| Desktop license | 2 | — |
| Review a full library | 4 | — |
| The free app scans 1,000 files at a time. | 9 | `free-scan-limit` |
| A license removes that scan limit. | 6 | `licensed-scan-limit` |
| US$29 one-time purchase | 3 | `paid-checkout` |
| Buy via Sociobot checkout | 4 | `paid-checkout` |
| Restore a purchase | 3 | — |
| Sociobot checkout takes payment. | 4 | `paid-checkout` |
| Contact Sociobot for refunds. | 4 | F-2-5 |
| Review photo copies before you remove them | 7 | — |
| Review duplicate photos before moving extra copies. | 7 | — |
| Terms | 1 | — |
| Built by Param Factory | 4 | Attribution |
| v0.1.5 · Generated hero imagery. | 4 | F-2-4 (asset-origin phrase) |

### README

| Copy | Words | Flag |
| --- | ---: | --- |
| Proof Pile | 2 | — |
| Review photo copies, quarantine extras, and keep a reversible decision log. | 11 | — |
| Proof Pile is for people whose photo libraries span several drives. | 11 | — |
| The desktop app reads only folders you choose, groups likely copies, and keeps evidence beside each decision. | 17 | — |
| Try the isolated sample at https://photo-proof-pile.sociobot.in/demo or https://photo-proof-pile.sociobot.in/?demo=1. | 8 | — |
| The sample needs no account. | 5 | `no-account` |
| Its choices stay only in this browser tab and never mix with a real review. | 15 | `demo-isolated` |
| Use Reset demo for a clean state. | 7 | — |
| What it does | 3 | — |
| Groups exact copies, photos that look alike, and photos taken at the same time. | 13 | `native-matching` |
| Shows each file location, image size, file size, capture date, camera, file identifier, and copies on other drives. | 18 | `match-evidence` |
| Builds a reviewed plan before moving any file to a quarantine folder. | 12 | — |
| Keeps quarantine recovery records after restart. | 6 | `reversible-plan` |
| Restore verified decision-log records after selecting their quarantine folder. | 9 | `reversible-plan` |
| Exports every decision and move in a decision log (CSV). | 10 | `csv-export` |
| Keeps the review desk available offline after its first visit. | 10 | `offline-reload` |
| Copies on other drives are not tested backups. | 10 | — |
| Open important backups before cleanup. | 5 | — |
| Price and license | 3 | — |
| The free desktop app scans up to 1,000 image files at a time. | 13 | `free-scan-limit` |
| A US$29 one-time license removes that scan limit. | 8 | `licensed-scan-limit`, `paid-checkout` |
| The license changes only the scan limit: quarantine, restore, and decision-log recovery remain available without one. | 15 | `free-safety-tools` |
| Buy through the Sociobot checkout. | 5 | `paid-checkout` |
| Contact Sociobot for refunds. | 4 | F-2-5 |
| The app stores a returned license under `sb_license:photo-proof-pile` and checks it with the Sociobot API at most once each day. | 18 | F-2-3 |
| The request contains only the license token. | 6 | `license-request-privacy` |
| Install | 1 | — |
| Download the macOS, Windows, or Linux package from the releases page. | 11 | — |
| Builds are currently unsigned, so the operating system may ask you to confirm the first launch. | 15 | F-1-34 |
| Linux users can run: | 4 | — |
| Windows users can run in PowerShell: | 6 | — |
| Both scripts fetch release metadata and verify the downloaded package against `SHA256SUMS` before installing it. | 15 | F-2-6 |
| Develop and verify | 3 | — |
| Requirements: Node.js 22+, Rust stable, and the Tauri 2 system dependencies. | 11 | Necessary developer prerequisite |
| The exact static deployment command is `npm run build:site`. | 9 | — |
| It writes `dist/site`. | 3 | — |
| How matching works | 3 | — |
| The local scanner reads only folders you select. | 8 | `scan-scope` |
| It compares file bytes for exact copies and image content for photos that look alike. | 15 | `native-matching` |
| It also reads the capture time and camera stored inside each photo. | 12 | `native-matching` |
| Files in an exact-copy group do not appear again in another match group. | 13 | `native-matching` |
| Moving a file preserves its bytes and embedded photo information. | 10 | `cross-drive-safety` |
| If a move crosses drives, the app copies the file first and removes the source only after a successful copy. | 17 | `cross-drive-safety` |
| A name collision receives a numbered file name instead of overwriting either copy. | 13 | `cross-drive-safety` |
| Project map | 2 | — |
| `src/` — TypeScript interface, demo data, license flow, and decision log. | 10 | Developer map |
| `src-tauri/` — local scanner, matching logic, quarantine, restore, and desktop packaging. | 10 | Developer map |
| `public/` — offline web files, original art, sample images, and installer scripts. | 10 | Developer map |
| `tests/` — model and Playwright tests. | 5 | Developer map |
| `.factory/` — product brief, visual thesis, claims, demo contract, and handoff. | 10 | Developer map |
| Privacy and license | 3 | — |
| Read the in-product privacy page and terms. | 7 | — |
| Source code is available under the MIT License. | 8 | — |

Terminology is consistent: **group**, **keep**, **quarantine**, **decision log
(CSV)** then **decision log**, **copies on other drives**, **Looks alike**, and
**demo**. The only jargon flag is F-2-6.

## Structure, accessibility, links, and identity

- `/`, `/demo`, `/privacy`, `/terms`, and an unknown route were checked live at
  1440 × 900 and 390 × 844. All have one `h1`, one `main`, route-specific
  rendered title/description/canonical, and the expected status (200 except
  the designed 404).
- Root, demo, privacy, and terms titles follow the product-title pattern;
  canonical, Open Graph, Twitter, favicon, apple icon, manifest, robots,
  sitemap, theme color, and response CSP/security headers are present.
- Deep links work. Privacy navigation and Back moved focus to the new `h1`;
  the existing route test confirms scroll restoration.
- All discovered internal links returned 200; the checkout returned 303 and
  then a hosted checkout page; explicit `mailto:` links were accepted.
- Live axe scans on the five routes at desktop and 390 px found no serious or
  critical violations. The 404's HTTP status appears as a browser network
  message by design; no JavaScript or application console error was observed
  on normal routes or the valid demo flow.
- The local font stacks, archival light-table art, offset photo frames, and
  reduced-motion-aware registration motion follow the visual thesis. This is
  not a generic SaaS template.

## Earlier findings and handoff history

Every earlier `.factory/review-1.md`, `.factory/polish-1.md`, and handoff was
read. The following checks were repeated against live behavior and code rather
than accepted from their status labels.

| Earlier finding | Current confirmation |
| --- | --- |
| F-1-1 | Fixed: the tagged test seeds real storage and proves demo/session isolation, reset, and exit. |
| F-1-2 | Fixed: native local scan/quarantine and browser request-log claims are separate. |
| F-1-3 | Fixed: `license-request-privacy` proves token-only GET data. |
| F-1-4 | Fixed: sample evidence test visits all groups and all eight rows. |
| F-1-5 | Fixed: live Back restores scroll; the test asserts the saved position. |
| F-1-6 | Fixed: landing says “Local duplicate-photo review.” |
| F-1-7 | Fixed: unsupported absence promises were removed. |
| F-1-8 | Fixed: license scope is named and unlicensed safety flow is tested. |
| F-1-9 | Fixed: merchant-of-record jargon was removed. |
| F-1-10 | Fixed: `scan-scope` asserts selected roots and unchanged sources. |
| F-1-11 | Fixed: algorithm-detail copy was removed. |
| F-1-12 | Fixed: camera outcome is in the matching claim. |
| F-1-13 | Fixed: native matching test asserts unique group membership. |
| F-1-14 | Fixed: cross-drive test covers bytes, metadata, dates, and collision behavior. |
| F-1-15 | Fixed: unsupported cross-device wording was removed. |
| F-1-16 | Fixed: SPA navigation updates description, canonical, OG, and Twitter metadata. |
| F-1-17 | Fixed: static 404 now has header, skip link, legal footer, metadata, and product styling. |
| F-1-18 | Fixed: checkout is named “Buy via Sociobot checkout” and marked external. |
| F-1-19 | Fixed: portable record terminology is “decision log (CSV)” then “decision log.” |
| F-1-20 | Fixed: user copy uses copies on other drives / Other-drive copies. |
| F-1-21 | Fixed: user-facing visual group is “Looks alike.” |
| F-1-22 | Fixed: quarantine action names the file count and destination. |
| F-1-23 | Fixed: hero caption names the evidence kept. |
| F-1-24 | Fixed: decorative steps eyebrow was removed. |
| F-1-25 | Fixed: the section is “Privacy and limits.” |
| F-1-26 | Fixed: footer uses a factual product sentence. |
| F-1-27 | Fixed: landing no longer uses unexplained “hashes.” |
| F-1-28 | Fixed: README starts in user terms, not framework terms. |
| F-1-29 | Fixed: README explains the demo consequence, not storage mechanics. |
| F-1-30 | Fixed: project map says “offline web files.” |
| F-1-31 | Fixed: the button says “Restore a purchase.” |
| F-1-32 | Fixed: unresolved decision action says “Mark for review.” |
| F-1-33 | Fixed: web action says “Show desktop downloads.” |
| F-1-34 | **Unfixed; recurs as blocking F-1-34 / F-2-2.** |

The previous handoff's unresolved stale-404-version defect is also still
present and recurs as F-2-1.

## Missed leverage and AI

No additional AI feature is justified. The brief calls for local,
deterministic matching, evidence, reversible quarantine, and CSV export. The
obvious export/recovery path exists. Cloud sync would conflict with local-first
privacy, and no decorative AI feature or provider key was found.

## What would make this perfect

Publish signed/notarized desktop packages, make the static 404 use the current
release version, and make `@claim:paid-license` prove both sides of its 24-hour
limit. Then either test or remove the footer asset-origin assertion, give the
refund instruction a direct contact action and a test, and replace the
`SHA256SUMS` filename with a plain explanation. After those changes, rerun the
full checklist from a clean context; no additional product feature is needed.
