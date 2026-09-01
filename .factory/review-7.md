# Adversarial first-read review 7

## Verdict: FAIL

- Product: Proof Pile (`photo-proof-pile`)
- Live URL: <https://photo-proof-pile.sociobot.in>
- Reviewed source: `bb15d7fb1c00f472be32e10b9e5025a2bb12ad41`
- Reviewed: 1 September 2026 UTC
- Work order: `photo-proof-pile-review-7`
- Product code changed: none

One blocking release-safety regression remains. The current source again
permits and documents unsigned macOS and Windows desktop packages. This
reopens the original release-trust finding, even though the functional demo,
route shell, visual presentation, and all registered claim commands check out.

## Cold first read

Fresh Chromium contexts loaded `/` without scrolling at 390 × 844 and 1440 ×
900. The first screen answers the required questions.

- **What it does:** review duplicate photo copies before removing extras.
- **Who it is for:** people with photos spread across several drives who are
  concerned about removing the only meaningful copy.
- **First action:** **Try it with sample data**. The adjacent text says,
  “Opens three ready-to-review groups.”

The headline, “Review photo copies before you remove them,” is clear and the
primary action is visible on both screens. No first-screen finding applies.
The normal landing load logged no console or page error. Screenshots are
`review-7-cold-mobile.png` and `review-7-cold-desktop.png`.

## Findings

### Blocking

#### F-7-1 (recurrence of F-1-34, F-2-2, F-3-1, F-4-1, F-5-1, and F-6-1) — Desktop-package publication accepts unsigned packages

- **Exact quote/location:** README, **Install**: “This release's packages are
  unsigned because operator certificates are not available. Your operating
  system may ask you to confirm the first launch.” `.factory/claims.json`,
  `package-signing-status`: “Without operator certificates, releases record
  macOS and Windows packages as unsigned.”
- **Code confirmation:** `.github/workflows/release.yml` includes “Build
  unsigned macOS package” and “Record unsigned Windows packages.”
  `src/main.ts:540-554` offers all packages when `SHA256SUMS`, `latest.json`,
  `DESKTOP_PACKAGE_STATUS.json`, and the platform files exist; it does not
  require `DESKTOP_SIGNATURES_VERIFIED.json`. The current unit test explicitly
  checks that the marker is absent and that unsigned statuses are produced.
- **Why this is a blocking product-QA finding:** the earlier repair contract
  required independent Windows signing and macOS signing/notarization before
  any desktop package could be published or offered. The current package is a
  local photo-management app that can move files. A checksum confirms file
  equality but does not confirm the publisher. Recording an unsigned status
  does not meet the prior release condition.
- **Concrete fix:** restore the prior publication rule. Remove unsigned
  package paths from the release workflow; require the owner-held Windows and
  macOS signing materials, independent post-build checks, and a
  `DESKTOP_SIGNATURES_VERIFIED.json` marker before release creation. Make the
  website and both installers decline a release without that marker. Replace
  `package-signing-status` with tests that confirm a missing marker yields no
  offered package and no installer action. Remove the unsigned-installation
  README instruction.

### Minor

#### F-7-2 — The checked-in copy audit does not describe the current release contract

- **Exact quote/location:** `.factory/copy-audit.md` lists `v0.1.19` and says
  “No package is offered until Windows and macOS signature checks pass.” The
  current package and static 404 are `v0.1.22`; current `src/main.ts:545-551`
  instead allows packages after checksum, package-status, and platform-file
  checks and says that the status file reports whether macOS or Windows was
  signed.
- **Why this is a product-QA finding:** the audit is the evidence used to
  confirm plain, accurate visitor copy. Its stale description masks the
  release condition in F-7-1, so it cannot serve as current verification.
- **Concrete fix:** regenerate `.factory/copy-audit.md` from the shipped
  version whenever release copy changes. After F-7-1 is corrected, record the
  exact signed-package gate and current version in that audit.

## Demo and sandbox checks

The one-click action opened `/demo` directly on the populated review desk.
The first screen after the click showed three realistic groups and the eight
sample records, including locations, dimensions, sizes, dates, cameras,
identifiers, and other-drive-copy counts. The persistent banner read:

> Demo — sample data, nothing is saved

It included **Reset demo** and **Start for real**. **Reset demo** returned the
sample to its initial state. The direct `/demo` route worked. The registered
`demo-isolated` check confirms separate session-only storage, preservation of
the real namespace, reset, and exit. The live demo request log contained only
`photo-proof-pile.sociobot.in` resources. The mobile demo screenshot is
`review-7-live-demo-mobile.png`.

The brief already calls for import/export and reversible recovery; both are
present. An AI action is not an expected missing capability for this local,
evidence-led review job, and the product does not add a decorative AI feature.

## Claims and local quality gates

A fresh clone of the reviewed source was installed with `npm ci` (zero npm
audit vulnerabilities). Every one of the 23 exact commands in
`.factory/claims.json` passed separately. This includes the demo storage,
evidence, CSV, recovery, reviewed-move, request-log privacy, no-account,
license, offline, native matching, scan-scope, installer, checksum, and
package-status checks. The passing `package-signing-status` command is
evidence of F-7-1, not a closure of it.

The aggregate checks also passed:

- `CI=1 npm test`: 11 Rust tests, 12 Vitest tests, and 33 Playwright tests.
- `npm run check`: TypeScript, Rust formatting, and Clippy.
- `npm run build`: completed and produced `dist/site`; production JavaScript
  totals about 15.2 kB gzip and CSS about 5.1 kB gzip.

No registered claim command failed and no functional claim remains untested.

## Copy audit

Counts treat a hyphenated term, a price, and a URL as one word. Headings,
actions, and labels are included because they are visitor-facing copy. No
listed reader sentence exceeds 22 words. No jargon, marketing adjective,
inconsistent term, mood heading, or non-result action was found in the current
landing or README. F-7-1 and F-7-2 are the copy/documentation exceptions
described above.

### Landing page

| Copy | Words | Check |
| --- | ---: | --- |
| Skip to main content | 4 | navigation |
| Proof Pile | 2 | wordmark |
| Demo / How it works / Privacy | 1 / 3 / 1 | navigation |
| Local duplicate-photo review | 3 | useful label |
| Review photo copies before you remove them | 7 | headline |
| For people with photos across several drives who fear removing the only meaningful copy. | 14 | audience |
| Try it with sample data | 5 | primary result action |
| Opens three ready-to-review groups. | 4 | `match-evidence` |
| Check desktop downloads | 3 | result action |
| Open this page on a desktop computer to check desktop packages. | 11 | phone guidance |
| Photos stay on this device | 5 | local-privacy scope |
| Works without an account | 4 | `no-account` |
| Free for 1,000 files; US$29 once for full libraries | 9 | price/limit claims |
| Each group keeps its file locations, dates, sizes, and match details. | 11 | `match-evidence` |
| The review desk / See why files match | 3 / 4 | section label/heading |
| Compare file locations, image sizes, dates, and copies on other drives before making a plan. | 15 | `match-evidence` |
| Exact bytes / 3 copies · 2 drives | 2 / 4 | sample labels |
| How photo cleanup works | 4 | section heading |
| Scan your folders / Choose photo folders on each connected drive. / The app reads files where they are. / Start with groups, not a delete list. | 3 / 7 / 7 / 7 | useful step copy |
| Review the evidence / Keep one copy and mark extras. / Every path and difference remains visible. / Compare each copy and its metadata. | 3 / 6 / 6 / 6 | useful step copy |
| Quarantine, then verify / Move extras to a folder you choose. / Restore them from the decision log. / Move reviewed files, then restore if needed. | 3 / 7 / 6 / 7 | useful step copy |
| Privacy and limits / Your photos are not uploaded | 3 / 5 | section/privacy claims |
| Copies on other drives are matching files, not tested backups. / Keep a tested backup. / A matching copy can still live on a failing drive. / Open important backups before cleanup. | 10 / 4 / 9 / 5 | useful warning |
| Desktop license / Review a full library | 2 / 4 | section label/heading |
| The free app scans 1,000 files at a time. / A license removes that scan limit. / US$29 one-time purchase | 9 / 6 / 3 | listed price claims |
| Buy via Sociobot checkout ↗ / Restore a purchase | 4 / 3 | result actions |
| Sociobot checkout takes payment. / For refunds, email support@sociobot.in. | 4 / 4 | listed payment claim |
| Review duplicate photos before moving extra copies. | 7 | footer description |
| Terms / Built by Param Factory ↗ / v0.1.22 | 1 / 4 / 1 | footer |

### README

| Copy | Words | Check |
| --- | ---: | --- |
| Proof Pile | 2 | title |
| Review photo copies, quarantine extras, and keep a reversible decision log. | 11 | summary |
| Proof Pile is for people whose photo libraries span several drives. | 11 | audience |
| The desktop app reads only folders you choose, groups likely copies, and keeps evidence beside each decision. | 17 | listed scope |
| Try the isolated sample at the demo URL or query URL. | 9 | instruction; URLs shown in source |
| The sample needs no account. / Its choices stay only in this browser tab and never mix with a real review. / Use Reset demo for a clean state. | 5 / 14 / 7 | demo copy |
| What it does | 4 | heading |
| Groups exact copies, photos that look alike, and photos taken at the same time. | 13 | `match-evidence` |
| Shows each file location, image size, file size, capture date, camera, file identifier, and copies on other drives. | 17 | `match-evidence` |
| Builds a reviewed plan before moving any file to a quarantine folder. | 12 | reviewed-move claim |
| Keeps quarantine recovery records after restart. / Restore verified decision-log records after selecting their quarantine folder. / Exports every decision and move in a decision log (CSV). | 6 / 9 / 10 | recovery/export claims |
| Keeps the review desk available offline after its first visit. | 10 | `offline-reload` |
| Copies on other drives are not tested backups. / Open important backups before cleanup. | 8 / 5 | useful warning |
| Price and license | 3 | heading |
| The free desktop app scans up to 1,000 image files at a time. / A US$29 one-time license removes that scan limit. | 13 / 8 | listed price claims |
| The license changes only the scan limit: quarantine, restore, and decision-log recovery remain available without one. | 15 | `free-safety-tools` |
| Buy through the Sociobot checkout. / For refunds, email support@sociobot.in. | 5 / 4 | payment action |
| The app stores a returned license under `sb_license:photo-proof-pile` and checks it with the Sociobot API at most once each day. | 19 | `paid-license` |
| The request contains only the license token. | 7 | `license-request-privacy` |
| Install | 1 | heading |
| Use Check desktop downloads on the website. | 6 | instruction |
| The dialog offers packages only after the full desktop package set, SHA-256 verification file, and package-status file are published. | 19 | `checksummed-downloads-only` |
| This release's packages are unsigned because operator certificates are not available. / Your operating system may ask you to confirm the first launch. | 11 / 11 | F-7-1 |
| Both scripts compare the downloaded package with the published SHA-256 verification file before installing it. / A matching checksum proves the downloaded bytes match the release; it does not add a publisher signature. | 15 / 17 | plain explanation; F-7-1 remains |
| Develop and verify | 3 | heading |
| Requirements: Node.js 22+, Rust stable, and the Tauri 2 system dependencies. / The exact static deployment command is `npm run build:site`. / It writes `dist/site`. | 10 / 9 / 3 | developer instructions |
| How matching works | 3 | heading |
| The local scanner reads only folders you select. / It compares file bytes for exact copies and image content for photos that look alike. / It also reads the capture time and camera stored inside each photo. / Files in an exact-copy group do not appear again in another match group. | 8 / 15 / 13 / 14 | matching claims |
| Moving a file preserves its bytes and embedded photo information. / If a move crosses drives, the app copies the file first and removes the source only after a successful copy. / A name collision receives a numbered file name instead of overwriting either copy. | 10 / 20 / 13 | cross-drive claim |
| Project map / Privacy and license | 2 / 3 | headings |
| Read the in-product privacy page and terms. / Source code is available under the MIT License. | 7 / 8 | instruction/repository fact |

The terminology remains consistent: **group**, **quarantine**, **decision log
(CSV)** then **decision log**, **copies on other drives**, **Looks alike**,
**demo**, and **desktop downloads**.

## Structure, accessibility, and visual checks

The same-origin crawl checked `/`, `/demo`, `/app`, `/privacy`, `/terms`, and
an unknown route. The first five returned 200. The unknown route returned a
designed HTTP 404 with one h1, main landmark, shared header, legal footer, and
a return-home action. Each checked route had a route-specific title,
description, canonical URL, Open Graph title, HTML language, favicon, and one
h1. The titles follow the required product-and-job pattern. Internal route
links and the `/#how` anchor resolve; mail links are explicit. External
destinations were not opened under the work-order resource boundary.

The local browser suite independently checks route focus, live announcement,
Back restoration, skip-link focus, 390 px layout, 200% text, touch targets,
reduced motion, keyboard decisions, and Axe serious/critical results. It
passed. Live normal routes had no console errors; the only logged error in the
route sweep was the expected 404 network response for the deliberate unknown
route. Same-origin response headers include the configured CSP,
`X-Content-Type-Options`, `Referrer-Policy`, and `frame-ancestors` as a
response directive.

The visual system is distinct and follows the recorded archival-light-table
direction: warm paper, dark ink, blueprint rules, offset photo plates, and a
locally generated product illustration. It does not present as a generic
centered-card SaaS layout.

## History verification

I read reviews 1–6, polish rounds 1–6, and the prior handoff, then checked the
current live site and source rather than relying on their “fixed” labels.

| Earlier finding IDs | Current check |
| --- | --- |
| F-1-1 through F-1-33 | Confirmed fixed through the live sample, current copy, route checks, and the 23 individual registered claim commands. |
| F-1-34 | Recurs as F-7-1. |
| F-2-1 | Confirmed fixed: package, runtime, and static 404 identify `v0.1.22`. |
| F-2-2 | Same recurrence as F-7-1. |
| F-2-3 through F-2-6 | Confirmed fixed; the daily boundary test passes, asset-provenance marketing is absent, refund mail is actionable, and the README explains the verification file. |
| F-3-1 | Same recurrence as F-7-1. |
| F-3-2 through F-3-4 | Confirmed fixed by current browser route/focus tests and `/app` metadata. |
| F-4-1 | Same recurrence as F-7-1. |
| F-5-1 | Same recurrence as F-7-1. |
| F-5-2 | Confirmed fixed: Android and iPhone contexts show desktop guidance and no download control. |
| F-6-1 | Same recurrence as F-7-1. |
| F-6-2 through F-6-4 | Confirmed fixed: the README uses “published verification file,” the control says “Check desktop downloads,” and the former signed-build-reporting promise is absent. |

## What would make this perfect

Restore the signed/notarized desktop-package gate and make the download dialog,
installers, README, claims manifest, and copy audit all describe that one
verifiable rule. Regenerate the copy audit at the same time. With those two
items complete and rechecked from a clean clone, no other finding remains from
this review.
