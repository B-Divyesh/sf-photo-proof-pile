# Adversarial first-read review 5

## Verdict: FAIL

- Product: Proof Pile (`photo-proof-pile`)
- Live URL: <https://photo-proof-pile.sociobot.in>
- Reviewed source: `18f31f3b173d200813f2937189b88c716962faca`
- Reviewed: 29 August 2026 UTC
- Work order: `photo-proof-pile-review-5`
- Product code changed: none

The cold first screen is clear on both a 390 px phone and a 1440 px desktop:
Proof Pile reviews duplicate photo copies before they are removed; it is for
people with photos across drives; the first action is **“Try it with sample
data.”** The adjacent result text, “Opens three ready-to-review groups,” says
what happens next. This first-read gate passes.

The product does not pass overall. It still publicly distributes unsigned
Windows and macOS executables, which is the earlier unresolved `F-1-34`.
One mobile compatibility statement is also a claim without a claim registry
entry.

## Findings

### Blocking

#### F-1-34 (recurring; review-5 index F-5-1) — Public desktop downloads remain unsigned

- Quote/location: live **Check download for Linux** dialog: “macOS and Windows
  builds are unsigned. Your system will ask you to confirm the first launch.”
  The dialog offers four public GitHub release downloads, including both macOS
  DMGs and the Windows EXE. The same state is documented in `README.md:32`.
- Evidence: the cold live dialog offered v0.1.15 packages at
  `github.com/B-Divyesh/sf-photo-proof-pile/releases/download/v0.1.15/`.
  `src/main.ts:501-503` deliberately accepts the missing signature marker and
  presents the unsigned files. `.github/workflows/release.yml:148` builds
  without a signing certificate, and lines 213-216 and 271 accept
  `unsigned` as a release state.
- Why this fails: a first-time visitor is asked to override operating-system
  protection before running software that scans and moves personal photo files.
  Review 1 raised this as `F-1-34`; reviews 2–4 required it to recur until
  actual trusted packages existed. The current live site and source confirm
  that it is not fixed, merely disclosed.
- Concrete fix: do not offer Windows or macOS downloads until Authenticode and
  Apple signing/notarization have completed and independently verified. Require
  `DESKTOP_SIGNATURES_VERIFIED.json` before publishing *any* desktop download,
  remove the unsigned release files from public visibility, and publish a new
  signed version after owner-held certificates are available. Add a release
  regression test that rejects every `unsigned` platform state.

### Minor

#### F-5-2 — Mobile platform-availability statement is an unlisted claim

- Quote/location: mobile landing copy, `src/main.ts:47`:
  “The desktop app requires macOS, Windows, or Linux.”
- Evidence: no entry in `.factory/claims.json` names or tests that compatibility
  promise. The existing `verified-downloads-only` claim checks a mocked release
  matrix, but it does not establish the supported operating systems or the
  mobile-only wording.
- Why this fails: this tells a phone visitor which systems can run the product,
  so it is a reliance claim under the claims contract but lacks a sandbox test.
- Concrete fix: add a `desktop-platforms` claim whose browser test uses a mobile
  user agent and whose release-fixture assertion verifies the supported macOS,
  Windows, and Linux matrix; or replace the sentence with a non-claim action
  such as “Open this page on a desktop computer to check downloads.”

## Demo and sandbox verification

From a fresh browser context, clicking **Try it with sample data** opened
`/demo` with the h1 “Review a sample photo pile” and these populated groups:
`Exact bytes` (3 files), `Same moment` (3 files), and `Looks alike` (2 files).
The first product screen was therefore already a realistic review desk, not an
empty setup screen. The persistent banner read “Demo — sample data, nothing is
saved” and included both **Reset demo** and **Start for real**.

Marking exact extras created only
`sessionStorage["demo:photo-proof-pile:session"]`. **Reset demo** removed that
key and left `localStorage["proof-pile:session"]` unchanged. The complete
clicked demo flow made requests only to `https://photo-proof-pile.sociobot.in`.
The demo, reset, isolation, and browser privacy checks pass.

## Claims verification

A fresh clone at `/tmp/proof-pile-review-5.qfG7rw` received `npm ci` (66
packages; zero reported vulnerabilities). Every exact command in
`.factory/claims.json` passed:

`demo-isolated`, `match-evidence`, `csv-export`, `reversible-plan`,
`review-before-move`, `local-privacy`, `no-ad-tracking`,
`native-local-privacy`, `license-request-privacy`, `no-account`,
`free-scan-limit`, `free-safety-tools`, `paid-license`, `paid-checkout`,
`licensed-scan-limit`, `offline-reload`, `native-matching`, `scan-scope`,
`cross-drive-safety`, `installer-checksum`, `windows-installer-checksum`, and
`verified-downloads-only`.

`npm test` passed (10 Rust, 11 Vitest, 30 Playwright tests). `npm run check`
and `npm run build` also passed, with `dist/site` produced. The green
`verified-downloads-only` command is not a closure for F-1-34: its test title
explicitly permits “a complete unsigned release.”

## Structure, routing, privacy, and visual checks

- `/`, `/demo`, `/app`, `/privacy`, and `/terms` returned 200; a cold unknown
  path returned the designed 404 with HTTP 404.
- Each checked route had one h1 and one main, a route-specific title,
  description, canonical, social title, shared header/footer, skip link, and
  Privacy/Terms links. The 404 also has the shared shell and current `v0.1.15`.
- The live 404 response carries the expected CSP, `nosniff`, HSTS, strict-origin
  referrer policy, and a restrictive permissions policy.
- The sitemap lists all five app routes. Internal routes and the Sociobot
  checkout link resolved successfully; the checkout is visibly marked external.
- The archival light-table art, offset paper geometry, warm paper palette, and
  evidence-led layout are distinct from a generic SaaS template and match the
  product visual thesis.
- The brief does not imply a missing AI action. Matching, CSV export/import,
  reversible quarantine, and recovery are already present; adding AI would be
  decorative rather than useful.

## Copy audit

Counts treat hyphenated terms and prices as one word. No listed landing or
README sentence exceeds 22 words. No banned marketing adjective, jargon-only
heading, inconsistent product term, or non-result button was found apart from
F-5-2's unregistered compatibility statement. Headings are included where
they need an out-of-context check.

### Landing page — complete visible copy and controls

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | navigation |
| Proof Pile | 2 | wordmark |
| Demo | 1 | navigation |
| How it works | 3 | navigation/clear heading |
| Privacy | 1 | navigation |
| Local duplicate-photo review | 3 | clear label |
| Review photo copies before you remove them | 7 | clear h1 |
| For people with photos across several drives who fear removing the only meaningful copy. | 14 | clear audience/result |
| Try it with sample data | 5 | result-naming action |
| Opens three ready-to-review groups. | 4 | registered demo result |
| Check download for Linux | 4 | result-naming action |
| The desktop app requires macOS, Windows, or Linux. | 8 | **F-5-2** |
| Photos stay on this device | 5 | registered privacy claim |
| Works without an account | 4 | registered claim |
| Free for 1,000 files; US$29 once for full libraries | 9 | registered price claims |
| Each group keeps its file locations, dates, sizes, and match details. | 11 | registered evidence claim |
| The review desk | 3 | clear label |
| See why files match | 4 | clear heading |
| Compare file locations, image sizes, dates, and copies on other drives before making a plan. | 15 | registered evidence claim |
| Exact bytes | 2 | sample match label |
| 3 copies · 2 drives | 4 | sample fact |
| How photo cleanup works | 4 | clear heading |
| Scan your folders | 3 | clear step heading |
| Choose photo folders on each connected drive. | 7 | usable instruction |
| The app reads files where they are. | 7 | registered scan-scope claim |
| Start with groups, not a delete list. | 7 | usable instruction |
| Review the evidence | 3 | clear step heading |
| Keep one copy and mark extras. | 6 | usable instruction |
| Every path and difference remains visible. | 6 | registered evidence claim |
| Compare each copy and its metadata. | 6 | usable instruction |
| Quarantine, then verify | 3 | clear step heading |
| Move extras to a folder you choose. | 7 | registered safety claim |
| Restore them from the decision log. | 6 | registered recovery claim |
| Move reviewed files, then restore if needed. | 7 | registered safety/recovery claims |
| Privacy and limits | 3 | clear label |
| Your photos are not uploaded | 5 | registered privacy claim |
| Copies on other drives are matching files, not tested backups. | 10 | useful safety warning |
| Keep a tested backup. | 4 | usable instruction |
| A matching copy can still live on a failing drive. | 10 | useful explanation |
| Open important backups before cleanup. | 5 | usable instruction |
| Desktop license | 2 | clear label |
| Review a full library | 4 | clear heading |
| The free app scans 1,000 files at a time. | 9 | registered claim |
| A license removes that scan limit. | 6 | registered claim |
| US$29 one-time purchase | 3 | registered claim |
| Buy via Sociobot checkout ↗ | 4 | result-naming external action |
| Restore a purchase | 3 | result-naming action |
| Sociobot checkout takes payment. | 4 | registered claim |
| For refunds, email support@sociobot.in. | 4 | usable instruction |
| Review duplicate photos before moving extra copies. | 7 | factual footer |
| Terms | 1 | legal navigation |
| Built by Param Factory ↗ | 4 | attribution |
| v0.1.15 | 1 | release identity |

### README — complete prose sentences and headings

| Location/copy | Words | Result |
| --- | ---: | --- |
| Proof Pile | 2 | wordmark heading |
| Review photo copies, quarantine extras, and keep a reversible decision log. | 11 | clear summary |
| Proof Pile is for people whose photo libraries span several drives. | 11 | clear audience |
| The desktop app reads only folders you choose, groups likely copies, and keeps evidence beside each decision. | 17 | registered outcomes |
| Try the isolated sample at `/demo` or `/?demo=1`. | 8 | usable action |
| The sample needs no account. | 5 | registered claim |
| Its choices stay only in this browser tab and never mix with a real review. | 15 | registered claim |
| Use Reset demo for a clean state. | 7 | usable action |
| What it does | 3 | clear heading |
| Groups exact copies, photos that look alike, and photos taken at the same time. | 14 | registered claim |
| Shows each file location, image size, file size, capture date, camera, file identifier, and copies on other drives. | 18 | registered claim |
| Builds a reviewed plan before moving any file to a quarantine folder. | 12 | registered claim |
| Keeps quarantine recovery records after restart. | 6 | registered claim |
| Restore verified decision-log records after selecting their quarantine folder. | 9 | registered claim |
| Exports every decision and move in a decision log (CSV). | 10 | registered claim |
| Keeps the review desk available offline after its first visit. | 10 | registered claim |
| Copies on other drives are not tested backups. | 8 | useful warning |
| Open important backups before cleanup. | 5 | usable instruction |
| Price and license | 3 | clear heading |
| The free desktop app scans up to 1,000 image files at a time. | 13 | registered claim |
| A US$29 one-time license removes that scan limit. | 8 | registered claim |
| The license changes only the scan limit: quarantine, restore, and decision-log recovery remain available without one. | 16 | registered claim |
| Buy through the Sociobot checkout. | 5 | usable external action |
| For refunds, email support@sociobot.in. | 4 | usable instruction |
| The app stores a returned license under `sb_license:photo-proof-pile` and checks it with the Sociobot API at most once each day. | 20 | registered claim |
| The request contains only the license token. | 7 | registered claim |
| Install | 1 | clear heading |
| Use Check download on the website. | 6 | usable action |
| The dialog offers packages only after the full platform matrix and SHA-256 checks pass. | 14 | registered claim |
| The current macOS and Windows packages are unsigned. | 8 | supports F-5-1 |
| Those systems will ask you to confirm the first launch. | 10 | supports F-5-1 |
| The dialog reports when signed builds become available. | 8 | supported UI behavior |
| Both scripts require the completed release marker. | 7 | registered installer claims |
| They compare the downloaded package with SHA256SUMS before installing it. | 10 | registered installer claims |
| Develop and verify | 3 | clear heading |
| The exact static deployment command is `npm run build:site`. | 9 | developer instruction |
| It writes `dist/site`. | 3 | developer instruction |
| How matching works | 3 | clear heading |
| The local scanner reads only folders you select. | 8 | registered claim |
| It compares file bytes for exact copies and image content for photos that look alike. | 15 | registered claim |
| It also reads the capture time and camera stored inside each photo. | 12 | registered claim |
| Files in an exact-copy group do not appear again in another match group. | 13 | registered claim |
| Moving a file preserves its bytes and embedded photo information. | 10 | registered claim |
| If a move crosses drives, the app copies the file first and removes the source only after a successful copy. | 20 | registered claim |
| A name collision receives a numbered file name instead of overwriting either copy. | 13 | registered claim |
| Project map | 2 | clear heading |
| Privacy and license | 3 | clear heading |
| Read the in-product privacy page and terms. | 7 | usable action |
| Source code is available under the MIT License. | 8 | factual legal note |

## Earlier-review regression check

The following prior findings were checked on both the live site and current
source. “Confirmed” means the earlier defect is absent; it does not replace
the new evidence above.

| Earlier finding | Status |
| --- | --- |
| F-1-1 | Confirmed: isolated demo storage, reset, and real-data separation work. |
| F-1-2 | Confirmed: native local-operation and browser request-log coverage exist. |
| F-1-3 | Confirmed: token-only license request has its own claim test. |
| F-1-4 | Confirmed: evidence test covers all eight sample rows and fields. |
| F-1-5 | Confirmed in source/test: history scroll keys and focus restoration exist. |
| F-1-6 | Confirmed: factual local-review label replaced “safer.” |
| F-1-7 | Confirmed: unsupported feature-boundary promises are absent. |
| F-1-8 | Confirmed: free safety tools have a specific claim test. |
| F-1-9 | Confirmed: checkout/refund copy is plain and tested. |
| F-1-10 | Confirmed: selected-folder scope is a native claim. |
| F-1-11 | Confirmed: unproved algorithm marketing was removed. |
| F-1-12 | Confirmed: camera/capture values are covered. |
| F-1-13 | Confirmed: unique group membership is covered. |
| F-1-14 | Confirmed: cross-drive preservation and collision coverage exist. |
| F-1-15 | Confirmed: unsupported device-migration promise is absent. |
| F-1-16 | Confirmed: route-specific metadata is live. |
| F-1-17 | Confirmed: true 404 has the shared shell and metadata. |
| F-1-18 | Confirmed: checkout names Sociobot and external destination. |
| F-1-19 | Confirmed: decision-log terminology is consistent. |
| F-1-20 | Confirmed: “copies on other drives” terminology is consistent. |
| F-1-21 | Confirmed: “Looks alike” is the user-facing term. |
| F-1-22 | Confirmed: move action names count and outcome. |
| F-1-23 | Confirmed: hero caption names retained evidence. |
| F-1-24 | Confirmed: decorative steps label is absent. |
| F-1-25 | Confirmed: privacy section is named plainly. |
| F-1-26 | Confirmed: footer is factual product copy. |
| F-1-27 | Confirmed: first-read evidence wording avoids hash jargon. |
| F-1-28 | Confirmed: README opens with the user job, not Tauri. |
| F-1-29 | Confirmed: demo storage copy uses visitor language. |
| F-1-30 | Confirmed: project map says “offline web files.” |
| F-1-31 | Confirmed: license action says “Restore a purchase.” |
| F-1-32 | Confirmed: review action says “Mark for review.” |
| F-1-33 | Confirmed as honest mobile disclosure, but its unregistered compatibility claim is F-5-2. |
| F-1-34 | **Unfixed; recurs as F-5-1.** |
| F-2-1 | Confirmed: live 404 reports v0.1.15. |
| F-2-2 | **Unfixed; same F-1-34/F-5-1 unsigned distribution.** |
| F-2-3 | Confirmed: test crosses the 24-hour license boundary. |
| F-2-4 | Confirmed: visitor-facing asset-provenance claim is absent. |
| F-2-5 | Confirmed: refund email is actionable and tested. |
| F-2-6 | Confirmed: installer explanation uses plain words. |
| F-3-1 | **Unfixed; same F-1-34/F-5-1 unsigned distribution.** |
| F-3-2 | Confirmed: How-it-works route/hash behavior is covered. |
| F-3-3 | Confirmed: review-before-move is registered and tested. |
| F-3-4 | Confirmed: `/app` title uses the product-first pattern. |
| F-4-1 | **Unfixed; same F-1-34/F-5-1 unsigned distribution.** |

## What would make this perfect

Publish only independently verified signed/notarized desktop packages, remove
the public unsigned distribution state, and register the mobile platform
compatibility statement with a sandbox test. Re-run this complete cold review
after the signed release is live.
