# Adversarial first-read review 6

## Verdict: FAIL

- Product: Proof Pile (`photo-proof-pile`)
- Live URL: <https://photo-proof-pile.sociobot.in>
- Reviewed commit: `a9e23d4d405aa6bba491936133280fa3098349d9`
- Reviewed: 30 August 2026 UTC
- Work order: `photo-proof-pile-review-6`
- Product code changed: none

The first screen, sample flow, privacy boundary, route shell, and registered
claims are clear and testable. This is still a **FAIL**. The site offers
unsigned macOS and Windows installers for an app that can move a person's
photos. That is the recurrence of the prior blocking release-safety finding.
The README also retains a prior unexplained checksum filename.

## Cold first read

Fresh 390 × 844 and 1440 × 1000 Chromium contexts were loaded at `/` before
scrolling. The first screen answers all three required questions.

- What it does: reviews duplicate photo copies before the visitor removes
  extras.
- Who it is for: people with photos on several drives who are afraid of
  removing the only meaningful copy.
- First click: **Try it with sample data**; the adjacent text says it opens
  three ready-to-review groups.

This is not a first-screen blocker. The mobile and desktop requests were
same-origin; neither context logged a console error.

## Findings

### Blocking

#### F-1-34 (recurring; review-6 index F-6-1) — Public desktop packages remain unsigned

- Exact quote/location: live **Check download for Linux** dialog: “macOS and
  Windows builds are unsigned. Your system will ask you to confirm the first
  launch.” README, Install: “The current macOS and Windows packages are
  unsigned.”
- Evidence: the public `v0.1.18` release offers two DMGs, an EXE, and an MSI
  but has no `DESKTOP_SIGNATURES_VERIFIED.json` asset. The live dialog offers
  their download links anyway. `src/main.ts:544-566` treats the weaker
  `DESKTOP_RELEASE_VERIFIED.json` plus checksums as sufficient and merely
  displays an unsigned warning when the signature marker is absent. The
  release workflow explicitly sets `apple_status=unsigned` and
  `windows_status=unsigned` at `.github/workflows/release.yml:213-220`.
- Why this fails: the earlier F-1-34 required published Windows packages to be
  Authenticode signed and macOS packages to be signed and notarized. A warning
  does not establish publisher identity. This is especially material for a
  desktop app that is trusted with personal files. Review 2, 3, 4, and 5 each
  repeated this defect under the same original finding.
- Concrete fix: restore the fail-closed release gate from the prior repair.
  Do not upload or offer any desktop package unless independent Windows
  signature and macOS notarization checks pass, then publish and require
  `DESKTOP_SIGNATURES_VERIFIED.json`. Make the website and both installers
  refuse a release without that marker. Keep credentials outside the repo.

#### F-2-6 (recurring; review-6 index F-6-2) — README still leaves the checksum filename unexplained

- Exact quote/location: README, Install: “They compare the downloaded package
  with `SHA256SUMS` before installing it.”
- Evidence: `SHA256SUMS` is a file name, not an explanation of the protection.
  The earlier requested rewrite is absent. The existing installer claim tests
  verify the behavior, but they do not make the user-facing term plain.
- Why this fails: this is an unfixed earlier finding. A first-time photo owner
  does not learn what is being compared or why it matters.
- Concrete fix: replace the sentence with “Both scripts compare the downloaded
  package with the published verification file before installing it.” Mention
  `SHA256SUMS` only in a developer-facing reference if necessary.

### Minor

#### F-6-3 — The desktop-download button promises a Linux result but opens a general chooser

- Exact quote/location: live landing button on Linux: “Check download for
  Linux”; resulting dialog heading: “Desktop downloads,” with links for macOS,
  Windows, and Linux.
- Why this fails: the button names an operating-system-specific result, but
  the result is a multi-platform release chooser. It adds a small avoidable
  mismatch at the moment a visitor is deciding whether to install.
- Concrete fix: rename it **Check desktop downloads**. If platform detection
  is retained, make the Linux option visually primary inside the resulting
  dialog rather than changing the action's name.

#### F-6-4 — README makes an unlisted promise about signed-build reporting

- Exact quote/location: README, Install: “The dialog reports when signed builds
  become available.”
- Why this fails: this is a visitor-relevant claim about a safety signal, but
  `.factory/claims.json` has no entry for it. The current
  `verified-downloads-only` claim specifically permits unsigned releases, so
  it cannot prove the promise about a signed one.
- Concrete fix: either remove the sentence while unsigned downloads are
  offered, or add a claim that mocks a release with
  `DESKTOP_SIGNATURES_VERIFIED.json` and asserts the precise signed/notarized
  status shown in the dialog.

## Demo and sandbox verification

From a fresh 390 px context, one click on **Try it with sample data** opened
`/demo` directly on the populated review desk: three realistic groups and all
eight sample photo records were visible. The persistent banner read “Demo —
sample data, nothing is saved” and supplied **Reset demo** and **Start for
real**. An edit created only
`sessionStorage["demo:photo-proof-pile:session"]`; **Reset demo** removed it.
`localStorage` stayed empty. During that demo flow all requests were
same-origin.

The brief calls for a local duplicate-photo reviewer, CSV decision record, and
reversible quarantine. Import/export and recovery are present. An AI step is
not an obvious missing feature for this job and the product does not add a
decorative AI claim.

## Claims and local gates

A fresh shallow clone of `origin/main` was installed with `npm ci` (zero audit
vulnerabilities). Every command listed in `.factory/claims.json` was run
separately, including the native Rust claim commands: **22/22 passed**. The
aggregate `npm test` passed (11 Rust, 11 Vitest, 33 Playwright), followed by
`npm run build`; `dist/site` was produced with 28 files.

The request-log claims cover the browser demo's local privacy and no tracking.
The native local-file claim covers native scanning/quarantine. No listed claim
failed. The unsigned-install finding is a release-policy and trust failure;
the current `verified-downloads-only` test intentionally accepts an unsigned
release and therefore cannot close F-1-34.

## Copy audit

Counts use the repository convention: hyphenated terms and prices count as one
word. The landing audit below reproduces every visible heading, action,
sentence, and fact in the cold landing state. No item exceeds 22 words; no
banned marketing term appears. F-6-3 is the only landing action flag.

| Landing copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | navigation |
| Proof Pile | 2 | wordmark |
| Demo | 1 | navigation |
| How it works | 3 | navigation |
| Privacy | 1 | navigation |
| Local duplicate-photo review | 3 | clear label |
| Review photo copies before you remove them | 7 | clear headline |
| For people with photos across several drives who fear removing the only meaningful copy. | 14 | clear audience |
| Try it with sample data | 5 | clear primary action |
| Opens three ready-to-review groups. | 4 | listed claim |
| Check download for Linux | 4 | F-6-3 |
| Photos stay on this device | 5 | listed claim |
| Works without an account | 4 | listed claim |
| Free for 1,000 files; US$29 once for full libraries | 9 | listed claims |
| Each group keeps its file locations, dates, sizes, and match details. | 11 | listed claim |
| The review desk | 3 | clear section label |
| See why files match | 4 | informative label |
| Compare file locations, image sizes, dates, and copies on other drives before making a plan. | 15 | listed claim |
| Exact bytes | 2 | group type |
| 3 copies · 2 drives | 4 | sample fact |
| How photo cleanup works | 4 | clear section heading |
| Scan your folders | 3 | step heading |
| Choose photo folders on each connected drive. | 7 | instruction |
| The app reads files where they are. | 7 | listed claim |
| Start with groups, not a delete list. | 7 | instruction |
| Review the evidence | 3 | step heading |
| Keep one copy and mark extras. | 6 | instruction |
| Every path and difference remains visible. | 6 | listed claim scope |
| Compare each copy and its metadata. | 6 | instruction |
| Quarantine, then verify | 3 | step heading |
| Move extras to a folder you choose. | 7 | listed claim |
| Restore them from the decision log. | 6 | listed claim |
| Move reviewed files, then restore if needed. | 7 | listed claims |
| Privacy and limits | 3 | clear section heading |
| Your photos are not uploaded | 5 | listed privacy claims |
| Copies on other drives are matching files, not tested backups. | 10 | safety warning |
| Keep a tested backup. | 4 | instruction |
| A matching copy can still live on a failing drive. | 9 | safety explanation |
| Open important backups before cleanup. | 5 | instruction |
| Desktop license | 2 | clear section heading |
| Review a full library | 4 | descriptive heading |
| The free app scans 1,000 files at a time. | 9 | listed claim |
| A license removes that scan limit. | 6 | listed claim |
| US$29 one-time purchase | 3 | listed claim |
| Buy via Sociobot checkout ↗ | 4 | listed claim/action |
| Restore a purchase | 3 | result-naming action |
| Sociobot checkout takes payment. | 4 | listed claim |
| For refunds, email support@sociobot.in. | 4 | listed claim/action |
| Review duplicate photos before moving extra copies. | 7 | footer description |
| Terms | 1 | navigation |
| Built by Param Factory ↗ | 4 | attribution |
| v0.1.18 | 1 | version |

README copy, including headings and list sentences, was also audited. Its only
plain-language flag is the recurring F-2-6 sentence above; no sentence exceeds
22 words.

| README copy | Words | Result |
| --- | ---: | --- |
| Proof Pile | 2 | title |
| Review photo copies, quarantine extras, and keep a reversible decision log. | 11 | clear summary |
| Proof Pile is for people whose photo libraries span several drives. | 11 | clear audience |
| The desktop app reads only folders you choose, groups likely copies, and keeps evidence beside each decision. | 17 | listed claims |
| Try the isolated sample at the demo URL or query URL. | 11 | instruction |
| The sample needs no account. | 5 | listed claim |
| Its choices stay only in this browser tab and never mix with a real review. | 14 | listed claim |
| Use Reset demo for a clean state. | 7 | instruction |
| What it does | 4 | clear heading |
| Groups exact copies, photos that look alike, and photos taken at the same time. | 13 | listed claim |
| Shows each file location, image size, file size, capture date, camera, file identifier, and copies on other drives. | 17 | listed claim |
| Builds a reviewed plan before moving any file to a quarantine folder. | 12 | listed claim |
| Keeps quarantine recovery records after restart. | 6 | listed claim |
| Restore verified decision-log records after selecting their quarantine folder. | 9 | listed claim |
| Exports every decision and move in a decision log (CSV). | 10 | listed claim |
| Keeps the review desk available offline after its first visit. | 10 | listed claim |
| Copies on other drives are not tested backups. | 8 | safety warning |
| Open important backups before cleanup. | 5 | instruction |
| Price and license | 3 | clear heading |
| The free desktop app scans up to 1,000 image files at a time. | 13 | listed claim |
| A US$29 one-time license removes that scan limit. | 8 | listed claim |
| The license changes only the scan limit: quarantine, restore, and decision-log recovery remain available without one. | 15 | listed claim |
| Buy through the Sociobot checkout. | 5 | listed claim/action |
| For refunds, email support@sociobot.in. | 4 | listed claim/action |
| The app stores a returned license under sb_license:photo-proof-pile and checks it with the Sociobot API at most once each day. | 19 | listed claim |
| The request contains only the license token. | 7 | listed claim |
| Install | 1 | clear heading |
| Use Check download on the website. | 6 | instruction |
| The dialog offers packages only after the full platform matrix and SHA-256 checks pass. | 14 | listed claim |
| The current macOS and Windows packages are unsigned. | 8 | F-1-34 |
| Those systems will ask you to confirm the first launch. | 10 | F-1-34 |
| The dialog reports when signed builds become available. | 9 | F-6-4 |
| Both scripts require the completed release marker. | 7 | listed claims |
| They compare the downloaded package with SHA256SUMS before installing it. | 9 | F-2-6 |
| Develop and verify | 3 | clear heading |
| Requirements: Node.js 22+, Rust stable, and the Tauri 2 system dependencies. | 10 | developer instruction |
| The exact static deployment command is npm run build:site. | 9 | developer instruction |
| It writes dist/site. | 3 | developer fact |
| How matching works | 3 | clear heading |
| The local scanner reads only folders you select. | 8 | listed claim |
| It compares file bytes for exact copies and image content for photos that look alike. | 15 | listed claim |
| It also reads the capture time and camera stored inside each photo. | 13 | listed claim |
| Files in an exact-copy group do not appear again in another match group. | 14 | listed claim |
| Moving a file preserves its bytes and embedded photo information. | 10 | listed claim |
| If a move crosses drives, the app copies the file first and removes the source only after a successful copy. | 20 | listed claim |
| A name collision receives a numbered file name instead of overwriting either copy. | 13 | listed claim |
| Project map | 2 | clear heading |
| Privacy and license | 3 | clear heading |
| Read the in-product privacy page and terms. | 7 | instruction |
| Source code is available under the MIT License. | 8 | repository fact |

The README uses the single terms **group**, **quarantine**, **decision log**,
**copies on other drives**, **Looks alike**, **demo**, and **desktop download**
consistently. URLs and code identifiers are described rather than counted as
reader-facing prose in the table.

## Structure and history verification

Live `/`, `/demo`, `/app`, `/privacy`, `/terms`, and an unknown route were
checked. Each has one h1, a main landmark, a route-specific title, description,
and canonical; the unknown route returned HTTP 404 with the shared shell. The
404 has the same header, legal footer, favicon, OG data, and version as the
app. `robots.txt`, sitemap, favicon, canonical, OG image, and route metadata
are present. The demo, privacy, and terms routes have consistent header/footer
links. No generic SaaS-template surface was observed: the live layout uses the
archival contact-sheet geometry and warm paper/light-table direction documented
in `.factory/design.md`.

The following history check confirms every earlier finding against live output
and current source. “Fixed” means verified again in this review, not merely
accepted in a polish note.

| Earlier finding(s) | Current result |
| --- | --- |
| F-1-1, F-1-4, F-1-22 | Fixed: isolated demo storage, all sample evidence, and exact review-before-move confirmation are exercised by current claim tests and live demo. |
| F-1-2, F-1-3, F-1-7, F-1-10 to F-1-15 | Fixed: separate native/browser privacy, token-only license request, scope, matching, and cross-drive tests are present and pass. |
| F-1-5, F-1-16, F-1-17, F-3-2, F-3-4 | Fixed: route metadata, 404 shell, `/app`, and history/focus behavior remain covered by current browser tests and live routes. |
| F-1-6, F-1-8, F-1-9, F-1-18 to F-1-21, F-1-23 to F-1-33 | Fixed: current live copy has factual labels, action labels, tested payment/refund action, consistent terminology, and mobile download guidance. |
| F-1-34; F-2-2; F-3-1; F-4-1; F-5-1 | **Regressed/unfixed: F-1-34 recurs as F-6-1.** |
| F-2-1, F-2-3 to F-2-5 | Fixed: 404 version is 0.1.18, daily-boundary test is present, footer provenance was removed, and refund mail action is live. |
| F-2-6 | **Unfixed: recurs as F-6-2.** |
| F-5-2 | Fixed: phones are told to open the page on desktop rather than being promised an unsupported mobile installer. |

## What would make this perfect

Publish only independently verified signed/notarized desktop packages, fail
closed everywhere when that marker is absent, replace the checksum filename
with a plain explanation, name the download chooser by the result it actually
opens, and register or remove the signed-status promise. After those changes,
repeat this full clean-clone and live review; a PASS requires all four findings
to be absent.
