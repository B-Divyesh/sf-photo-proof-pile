# Adversarial first-read review 1

## Verdict: FAIL

- Product: Proof Pile (`photo-proof-pile`)
- Live URL: <https://photo-proof-pile.sociobot.in>
- Reviewed commit: `18d7eaa987f871954de3f35505cdecab5771b66d`
- Reviewed: 29 August 2026 UTC
- Work order: `photo-proof-pile-review-1`
- Product code changed: none

The first screen and one-click demo pass. Every command in
`.factory/claims.json` also exits successfully. The product still fails this
review because claim tests do not prove several exact promises, Back loses the
previous scroll position, route metadata and the deployed 404 are incomplete,
and the copy audit has unresolved plain-language and terminology findings.

## Findings

### Blocking

#### F-1-1 — The demo-isolation test does not test storage isolation

- Quote/location: `.factory/claims.json`, `demo-isolated`: “The sample review
  uses separate session-only storage and can be reset.”
- Evidence: `tests/app.spec.ts:33` confirms the banner, changes a plan, and
  resets the visible count. It never inspects `sessionStorage`, never seeds the
  real `proof-pile:session` namespace, and never confirms that leaving the demo
  discards only demo data.
- Why this fails: the listed test passes without proving the most important
  half of the claim. A future regression could write demo choices into real
  storage while this claim remains green.
- Fix: seed a valid real review, enter `/demo`, edit/reset/exit, and assert that
  only `demo:photo-proof-pile:session` changes, it is session-only, and the real
  value remains byte-for-byte unchanged.

Independent live verification did confirm isolation today; the finding is the
missing required regression proof.

#### F-1-2 — The local-privacy test covers the web sample, not the desktop app claim

- Quote/location: landing fact, “Photos stay on this device”; README, “The app
  does not upload photos”; privacy page, “It does not upload photos,
  thumbnails, paths, hashes, or decision logs.”
- Evidence: `@claim:local-privacy` intercepts requests only while operating the
  browser demo. It never runs a native scan or quarantine flow, and it does not
  exercise license verification with a real review loaded.
- Why this fails: the public claim is about the desktop app and all listed
  photo-derived data. A browser-only sample request log cannot prove that
  scope.
- Fix: add a native integration test around scan/quarantine with network access
  denied or audited, and extend the browser test through license verification
  while seeded paths, hashes, thumbnails, and decisions are present.

#### F-1-3 — The license-request privacy sentence is an unlisted claim

- Quote/location: README, “Photo data is never part of that request.” Privacy
  page: “It does not send photo data.”
- Evidence: no `.factory/claims.json` entry names this request-payload promise.
  `@claim:paid-license` counts a mocked request but does not inspect its URL,
  body, headers, or seeded review data.
- Why this fails: this is a specific privacy promise about an off-origin
  billing request and has no test that can catch photo data leaking into it.
- Fix: add a `license-request-privacy` claim. Seed realistic review data,
  trigger verification, and assert that the request contains only the encoded
  license token and no body, paths, names, hashes, thumbnails, or decisions.

#### F-1-4 — The evidence claim test omits most promised fields

- Quote/location: landing, “Compare paths, dimensions, dates, hashes, and
  backup counts before making a plan.” README: “Shows every path, image
  dimensions, byte size, capture date, camera, short hash, and matching-drive
  count.”
- Evidence: `@claim:match-evidence` asserts group kinds plus labels for
  Dimensions, Camera, and Other drives. It does not assert a path, byte size,
  capture date, hash, value accuracy, or that each sample file is represented.
- Why this fails: the test can stay green if most of the evidence promised to
  support a safe decision disappears.
- Fix: assert all eight sample rows and each named field with known fixture
  values. Rename the public metric first as required by F-1-20.

#### F-1-5 — Browser Back does not restore the previous scroll position

- Quote/location: route behavior in `src/main.ts`; every `route()` call runs
  `scrollTo({ top: 0, ... })`.
- Evidence: on a 390 px live landing page, scroll position was `1399`; after
  opening Privacy and pressing Back, the landing page returned at `0` rather
  than `1399`. Focus did move to the landing h1.
- Why this fails: Back returns to the route but loses the visitor's place. This
  violates the required deep-link/back behavior and is a routing defect.
- Fix: save scroll per history entry, scroll new navigations to the top, and
  restore the saved position on `popstate`. Add an end-to-end assertion for a
  non-zero restored value.

### Major

#### F-1-6 — “Safer” is an unlisted comparative claim

- Quote/location: first-screen eyebrow, “A safer photo cleanup desk.”
- Why this fails: “safer” does not say what the comparison is and has no claim
  entry or measurable test. It is also a decorative label above an already
  clear headline.
- Fix: delete it or use the factual label “Local duplicate-photo review.”

#### F-1-7 — Product-boundary promises are unlisted

- Quote/location: landing, “Proof Pile has no face recognition, cloud gallery,
  or permanent-delete command.” README: “It never offers permanent deletion.”
  and “The app does not upload photos, recognize faces, host a cloud gallery,
  or permanently delete files.”
- Why this fails: `local-privacy` covers outgoing demo requests only. No claim
  entry or test covers the absence of face processing, cloud-gallery behavior,
  or permanent-delete commands in the shipped app.
- Fix: add a `product-boundaries` claim and test the visible action set, native
  command allowlist, and request log; or remove capability promises that the
  sandbox cannot prove.

#### F-1-8 — The free-feature promise is unlisted

- Quote/location: README price section, “Saved reviews, CSV export, and every
  safety feature stay free.”
- Why this fails: the scan-limit tests cover file counts, but no entry asserts
  that an unlicensed desktop session can save, export, quarantine, and restore.
  “Every safety feature” is also open-ended.
- Fix: replace it with “The license changes only the scan limit,” then add an
  unlicensed desktop-flow claim that proves the named actions remain available.

#### F-1-9 — Payment and refund responsibility is unlisted and jargon-heavy

- Quote/location: landing and README, “Sociobot and Dodo handle payment and
  refunds as merchant of record.”
- Why this fails: `@claim:paid-checkout` checks the price and initial Sociobot
  URL but not the Dodo redirect, refund handling, or merchant role. “Merchant
  of record” is not plain first-read language.
- Fix: if only the observable flow is needed, write “Sociobot checkout takes
  payment. Contact Sociobot for refunds.” Add a claim test for the live or
  recorded checkout destination and link the refund policy. Otherwise remove
  the untestable sentence.

#### F-1-10 — Selected-folder and “in place” behavior is unlisted

- Quote/location: landing, “The desktop app reads them in place.” README: “The
  Rust core walks only the folders a user selects.”
- Why this fails: native matching uses a selected temporary root but does not
  assert that an adjacent unselected folder is ignored or that scanning leaves
  selected files unchanged.
- Fix: add a `scan-scope` claim. Place detectable images inside and outside the
  selected root, snapshot source bytes and dates, scan, and assert only the
  selected files are reported and no source changes.

#### F-1-11 — The published matching algorithms are not asserted

- Quote/location: README, “It computes SHA-256 for exact matches and a 64-bit
  difference hash for visual matches.”
- Why this fails: `@claim:native-matching` checks that three group labels are
  produced. It does not compare a known SHA-256 result or a known 64-bit visual
  hash, so a different or truncated algorithm would pass.
- Fix: either remove the implementation detail and state the tested outcome,
  or add deterministic unit fixtures that assert the full SHA-256 digest and
  64-bit visual-hash value. Plain rewrite: “It compares file bytes for exact
  copies and image content for similar photos.”

#### F-1-12 — Camera-field extraction is not listed or asserted

- Quote/location: README, “It also reads EXIF capture time and camera fields.”
- Why this fails: the native test asserts one parsed capture time, but it does
  not assert the camera value. “EXIF” is unexplained jargon in user-facing copy.
- Fix: add the camera field to the native-matching claim and assert its fixture
  value. Rewrite as “It also reads the capture time and camera stored inside
  each photo.”

#### F-1-13 — Stronger-match exclusion is an unlisted claim

- Quote/location: README, “Similarity groups exclude files already covered by
  a stronger exact match.”
- Why this fails: the native fixture proves that each kind can exist, not that
  one file cannot appear in overlapping exact and similarity groups.
- Fix: add an overlapping exact/similar fixture and assert unique membership,
  or remove the sentence.

#### F-1-14 — EXIF preservation is not represented by the safety claim

- Quote/location: README, “Moving a file preserves its bytes and embedded EXIF
  metadata.”
- Why this fails: `cross-drive-safety` asserts plain test bytes and a file date.
  Its manifest claim mentions dates, copy order, and collisions, not bytes or
  embedded metadata; it never moves an image with EXIF data.
- Fix: extend the claim text and test with an EXIF-tagged image, asserting the
  complete digest and parsed metadata before and after the forced copy path.

#### F-1-15 — Moving a license to another device is not tested

- Quote/location: README, “Buyers can paste a license into the app when moving
  to another device.”
- Why this fails: `@claim:paid-license` pastes a token in the current browser
  context. It does not start with a fresh device namespace or prove a returned
  license works after migration.
- Fix: add this wording to the paid-license claim and run the paste/verify flow
  in a second fresh context with no prior product storage; otherwise remove
  “when moving to another device.”

#### F-1-16 — Route metadata stays on the landing-page message

- Quote/location: live `/demo`, `/privacy`, and `/terms`.
- Evidence: their titles and canonicals change, but every route retains the
  landing description, OG title/description, and Twitter title: “Proof Pile —
  Review photo copies before cleanup.”
- Why this fails: shared or indexed route previews describe the landing page
  instead of the demo or policy being shared.
- Fix: update description, Open Graph, and Twitter metadata on every route and
  add route-specific assertions beside the title checks.

#### F-1-17 — The deployed 404 is outside the standard site shell

- Quote/location: live unknown routes rewrite to `public/404.html`.
- Evidence: `/missing-frame` correctly returns 404 and has one h1/main, but it
  has no wordmark header, skip link, footer, Privacy/Terms links, description,
  canonical, Open Graph image, favicon, or theme color.
- Why this fails: the 404 is designed, but it is the one route where navigation,
  policy links, identity metadata, and the consistent shell disappear.
- Fix: give `404.html` the same header/footer and required metadata as the app
  shell while keeping the archival illustration and true 404 response.

#### F-1-18 — Checkout does not announce that it leaves the site

- Quote/location: landing link, “Buy the desktop license.”
- Evidence: it navigates to `api.sociobot.in` and then Dodo. Unlike the footer
  and releases links, it has no external marker or destination in its name.
- Why this fails: a payment action unexpectedly leaves the product origin.
- Fix: label it “Buy via Sociobot checkout ↗” and add `rel="external"`.

#### F-1-19 — The exported record has three competing names

- Quote/location: “decision log,” “decision CSV,” “Exports every decision and
  move as CSV,” “Export CSV,” and “Import decision log.”
- Why this fails: visitors cannot tell whether a decision log and a CSV are the
  same artifact. The repository terminology table says the one term is
  “decision log,” but the product does not follow it.
- Fix: introduce “decision log (CSV)” once. Then use “decision log,” including
  “Export decision log” and “Import decision log,” everywhere.

#### F-1-20 — One metric is called three different things

- Quote/location: landing “backup counts”; README “matching-drive count”; demo
  label “Other drives.”
- Why this fails: “backup” implies tested recoverability, while the page later
  warns that a matching file is not a tested backup. The three names obscure
  what the number counts.
- Fix: use “copies on other drives” in prose and “Other-drive copies” as the UI
  label everywhere.

#### F-1-21 — The visual-match type changes names

- Quote/location: README “visually similar images”; claim “visual”; demo
  “Looks alike”; brief “perceptual.”
- Why this fails: the same group type changes vocabulary between explanation,
  proof, and product UI.
- Fix: use “Looks alike” in user-facing copy and claims. Reserve “difference
  hash” for an explicitly technical implementation section if it remains.

#### F-1-22 — The quarantine action does not name its result

- Quote/location: demo primary button, “Review and run plan.”
- Why this fails: after files are marked, the button opens confirmation for a
  move. “Run plan” does not say that files will move or how many.
- Fix: use a dynamic label such as “Move 2 files to quarantine,” with the
  confirmation retaining the exact source and destination summary.

### Minor

#### F-1-23 — The hero caption is a slogan, not evidence

- Quote/location: hero caption, “Copies line up. Evidence stays attached.”
- Why this fails: “line up” is metaphorical and “attached” does not identify
  which evidence is kept.
- Fix: “Each group keeps its file locations, dates, sizes, and match details.”

#### F-1-24 — “Three controlled steps” is a decorative label

- Quote/location: eyebrow above “How photo cleanup works.”
- Why this fails: it adds mood but no information beyond the numbered steps.
- Fix: delete it; the section heading and 01–03 labels already carry the fact.

#### F-1-25 — “Clear limits” does not name its section

- Quote/location: eyebrow above “Your photos are not uploaded.”
- Why this fails: heard out of context, it does not identify privacy or product
  boundaries.
- Fix: “Privacy and limits.”

#### F-1-26 — The footer one-liner is brand lore

- Quote/location: footer, “Proof before photo cleanup.”
- Why this fails: it is a slogan and does not explain what the product does.
- Fix: “Review duplicate photos before moving extra copies.”

#### F-1-27 — “Hashes” is unexplained landing-page jargon

- Quote/location: “Compare paths, dimensions, dates, hashes, and backup counts
  before making a plan.”
- Why this fails: a first-time photo owner should not need to know what a hash
  is to understand the evidence.
- Fix: “Compare file locations, image sizes, dates, and copies on other drives
  before making a plan.”

#### F-1-28 — The README leads with an implementation framework

- Quote/location: README, “The Tauri desktop app reads selected folders
  locally...”
- Why this fails: “Tauri” does not help a photo owner understand the job.
- Fix: “The desktop app reads only folders you choose, groups likely copies,
  and keeps evidence beside each decision.”

#### F-1-29 — The demo-storage sentence is developer jargon

- Quote/location: README, “The sample needs no account and writes only to a
  `demo:` session-storage key.”
- Why this fails: “session-storage key” explains an implementation, not the
  consequence a visitor needs.
- Fix: “The sample needs no account. Its choices stay only in this browser tab
  and never mix with a real review.”

#### F-1-30 — “PWA shell” is unexplained project-map jargon

- Quote/location: README project map, “`public/` — PWA shell, original art,
  sample images, and installer scripts.”
- Why this fails: the rest of the map is concrete, while “PWA shell” assumes a
  web-development acronym.
- Fix: “`public/` — offline web files, original art, sample images, and
  installer scripts.”

#### F-1-31 — “Enter a license” does not name the result

- Quote/location: landing price button, “Enter a license.”
- Why this fails: it opens a restore-purchase dialog rather than entering
  anything immediately.
- Fix: “Restore a purchase.”

#### F-1-32 — The per-file “Review” button is ambiguous

- Quote/location: demo decision control, “Review.”
- Why this fails: every file is already being reviewed; the control actually
  changes its decision state back to unresolved.
- Fix: “Mark for review” or “Clear decision.”

#### F-1-33 — “Get the desktop app” opens a chooser, not a download

- Quote/location: web demo toolbar, “Get the desktop app.”
- Why this fails: the result is a platform download dialog, and on a phone no
  app can be installed for that device.
- Fix: “Show desktop downloads.” Keep the existing macOS/Windows/Linux
  explanation in the dialog.

#### F-1-34 — Production desktop packages remain unsigned

- Quote/location: README and download dialog, “Builds are currently unsigned.”
- Evidence: the release workflow contains no signing/notarization configuration
  and explicitly publishes the same warning.
- Why this fails: the limitation is honest, but an operating-system warning is
  a trust and installation barrier for a tool that moves personal files.
- Fix: sign Windows packages and sign/notarize macOS packages using owner-held
  certificates. Keep secrets outside the repository.

## Cold first screen

### 390 px phone, before scrolling

- What it does, in my words: it compares copies of photos before I move extras
  out of my library.
- Who it is for: people with photos spread across drives who worry about losing
  the only useful copy.
- What I should click first: **Try it with sample data**; the adjacent sentence
  says it opens three ready-to-review groups.
- Result: PASS. The headline, audience sentence, action, next-step explanation,
  and three facts are visible in the first 844 px. An Android user agent shows
  “The desktop app requires macOS, Windows, or Linux,” not a false mobile
  download.

### Desktop, before scrolling

The same three answers are visible. The original archival light-table art is
specific to duplicate-photo evidence and does not resemble a generic centered
SaaS hero. Result: PASS.

Exact first-screen copy used for the decision:

> “Review photo copies before you remove them”
>
> “For people with photos across several drives who fear removing the only
> meaningful copy.”
>
> “Try it with sample data” — “Opens three ready-to-review groups.”

## One-click demo and sandbox

Result: PASS on the live behavior.

- One click opens `/demo` with eight realistic photo records in Exact bytes,
  Same moment, and Looks alike groups.
- The first demo viewport already shows populated groups and evidence.
- “Demo — sample data, nothing is saved,” Reset demo, and Start for real remain
  present.
- Marking exact extras changes the plan from 0 to 2. Reset returns it to 0.
- With a valid real review pre-seeded in `proof-pile:session`, demo edit, reset,
  and exit left that value byte-for-byte unchanged.
- Demo edits used only `demo:photo-proof-pile:session` in `sessionStorage`.
- Start for real removed the demo key and opened `/app` without removing the
  valid real review.
- The full live flow made only same-origin requests and logged no console or
  page errors.

F-1-1 remains because the registered regression test does not assert these
storage observations.

## Claims results

Every listed command was run separately after `npm ci` from the unchanged
reviewed checkout.

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-isolated` | `npm run test:e2e -- --grep @claim:demo-isolated` | PASS, coverage defect F-1-1 |
| `match-evidence` | `npm run test:e2e -- --grep @claim:match-evidence` | PASS, coverage defect F-1-4 |
| `csv-export` | `npm run test:e2e -- --grep @claim:csv-export` | PASS |
| `reversible-plan` | `npm run test:e2e -- --grep @claim:reversible-plan` | PASS |
| `local-privacy` | `npm run test:e2e -- --grep @claim:local-privacy` | PASS, scope defect F-1-2 |
| `no-account` | `npm run test:e2e -- --grep @claim:no-account` | PASS |
| `free-scan-limit` | `cargo test --manifest-path src-tauri/Cargo.toml --no-default-features claim_free_scan_limit` | PASS |
| `paid-license` | `npm run test:e2e -- --grep @claim:paid-license` | PASS |
| `paid-checkout` | `npm run test:e2e -- --grep @claim:paid-checkout` | PASS |
| `licensed-scan-limit` | `cargo test --manifest-path src-tauri/Cargo.toml --no-default-features claim_licensed_scan_limit` | PASS |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS |
| `native-matching` | `cargo test --manifest-path src-tauri/Cargo.toml --no-default-features claim_native_matching` | PASS |
| `cross-drive-safety` | `cargo test --manifest-path src-tauri/Cargo.toml --no-default-features claim_cross_drive_safety` | PASS |
| `installer-checksum` | `npm run test:unit -- --testNamePattern @claim:installer-checksum` | PASS |
| `windows-installer-checksum` | `npm run test:unit -- --testNamePattern @claim:windows-installer-checksum` | PASS |

Unlisted or materially broader public claims are recorded individually in
F-1-3 and F-1-6 through F-1-15. Operational statements about current download
availability, unsigned status, build output, and MIT licensing were checked
directly against the live links, workflow, build, and `LICENSE`.

## Copy audit

Counting method: rendered words separated by whitespace; a hyphenated term,
price, URL, code token, or version is one word. Symbols and step numerals are
not words. No sentence exceeds 22 words. Commands in fenced code blocks are
code, not sentences, and are omitted.

### Landing page

This table includes every visible sentence plus headings, navigation labels,
buttons, facts, and captions. The `PP` registration mark and 01–03 numerals are
decorative marks, not sentences.

| Copy | Words | Flag |
| --- | ---: | --- |
| Skip to main content | 4 | — |
| Proof Pile | 2 | — |
| Demo | 1 | — |
| How it works | 3 | — |
| Privacy | 1 | — |
| A safer photo cleanup desk | 5 | F-1-6 |
| Review photo copies before you remove them | 7 | — |
| For people with photos across several drives who fear removing the only meaningful copy. | 14 | — |
| Try it with sample data | 5 | — |
| Opens three ready-to-review groups. | 4 | — |
| Download for macOS / Windows / Linux | 3 per rendered variant | — |
| The desktop app requires macOS, Windows, or Linux. | 8 | — |
| Photos stay on this device | 5 | F-1-2 |
| Works without an account | 4 | — |
| Free for 1,000 files; US$29 once for full libraries | 9 | — |
| Copies line up. | 3 | F-1-23 |
| Evidence stays attached. | 3 | F-1-23 |
| The review desk | 3 | — |
| See why files match | 4 | — |
| Compare paths, dimensions, dates, hashes, and backup counts before making a plan. | 12 | F-1-4, F-1-20, F-1-27 |
| Exact bytes | 2 | — |
| 3 copies · 2 drives | 4 | F-1-20 |
| Three controlled steps | 3 | F-1-24 |
| How photo cleanup works | 4 | — |
| Scan your folders | 3 | — |
| Choose photo folders on each connected drive. | 7 | — |
| The desktop app reads them in place. | 7 | F-1-10 |
| Start with groups, not a delete list. | 7 | — |
| Review the evidence | 3 | — |
| Keep one copy and mark extras. | 6 | — |
| Every path and difference remains visible. | 6 | F-1-4 |
| Compare each copy and its metadata. | 6 | — |
| Quarantine, then verify | 3 | — |
| Move extras to a folder you choose. | 7 | — |
| Restore them from the decision log. | 6 | F-1-19 |
| Move reviewed files, then restore if needed. | 7 | — |
| Clear limits | 2 | F-1-25 |
| Your photos are not uploaded | 5 | F-1-2 |
| Proof Pile has no face recognition, cloud gallery, or permanent-delete command. | 11 | F-1-7 |
| Backup counts show matching files, not tested restores. | 8 | F-1-20 |
| Keep a tested backup. | 4 | — |
| A matching copy can still live on a failing drive. | 10 | — |
| Open important backups before cleanup. | 5 | — |
| Desktop license | 2 | — |
| Review a full library | 4 | — |
| The free app scans 1,000 files at a time. | 9 | — |
| A license removes that scan limit. | 6 | — |
| US$29 one-time purchase | 3 | — |
| Buy the desktop license | 4 | F-1-18 |
| Enter a license | 3 | F-1-31 |
| Sociobot and Dodo handle payment and refunds as merchant of record. | 11 | F-1-9 |
| Proof before photo cleanup. | 4 | F-1-26 |
| Privacy | 1 | — |
| Terms | 1 | — |
| Built by Param Factory ↗ | 4 | — |
| v0.1.3 · Generated hero imagery. | 4 | — |

### README

| Copy | Words | Flag |
| --- | ---: | --- |
| Proof Pile | 2 | — |
| Review photo copies, quarantine extras, and keep a reversible decision log. | 11 | — |
| Proof Pile is for people whose photo libraries span several drives. | 11 | — |
| The Tauri desktop app reads selected folders locally, groups likely copies, and keeps the evidence beside every decision. | 18 | F-1-28 |
| It never offers permanent deletion. | 5 | F-1-7 |
| Try the isolated sample at https://photo-proof-pile.sociobot.in/demo. | 6 | — |
| The sample needs no account and writes only to a `demo:` session-storage key. | 13 | F-1-1, F-1-29 |
| Use Reset demo for a clean state. | 7 | — |
| What it does | 3 | — |
| Groups exact byte matches, visually similar images, and images captured in the same minute. | 14 | F-1-21 |
| Shows every path, image dimensions, byte size, capture date, camera, short hash, and matching-drive count. | 15 | F-1-4, F-1-20 |
| Builds a reviewed plan before moving any file to a quarantine folder. | 12 | — |
| Keeps quarantine recovery records after restart. | 6 | — |
| Restore a decision CSV on the same computer after selecting its quarantine folder. | 13 | F-1-19 |
| Exports every decision and move as CSV. | 7 | F-1-19 |
| Keeps the review desk available offline after its first visit. | 10 | — |
| The app does not upload photos, recognize faces, host a cloud gallery, or permanently delete files. | 16 | F-1-2, F-1-7 |
| A matching backup is not proof that the backup can be restored. | 12 | — |
| Test important backups before cleanup. | 5 | — |
| Price and license | 3 | — |
| The free desktop app scans up to 1,000 image files at a time. | 13 | — |
| A US$29 one-time license removes that scan limit. | 8 | — |
| Saved reviews, CSV export, and every safety feature stay free. | 10 | F-1-8, F-1-19 |
| Buy through the Sociobot hosted checkout. | 6 | — |
| Sociobot and Dodo handle payment and refunds as merchant of record. | 11 | F-1-9 |
| The app stores a returned license under `sb_license:photo-proof-pile` and checks it with the Sociobot API at most once each day. | 20 | — |
| Photo data is never part of that request. | 8 | F-1-3 |
| Buyers can paste a license into the app when moving to another device. | 13 | F-1-15 |
| Install | 1 | — |
| Download the macOS, Windows, or Linux package from the releases page. | 11 | — |
| Builds are currently unsigned, so the operating system may ask you to confirm the first launch. | 16 | F-1-34 |
| Linux users can run: | 4 | — |
| Windows users can run in PowerShell: | 6 | — |
| Both scripts fetch release metadata and verify the downloaded package against `SHA256SUMS` before installing it. | 15 | — |
| Develop and verify | 3 | — |
| Requirements: Node.js 22+, Rust stable, and the Tauri 2 system dependencies. | 11 | —; necessary developer prerequisites |
| The exact static deployment command is `npm run build:site`. | 9 | — |
| It writes `dist/site/index.html`. | 3 | — |
| How matching works | 3 | — |
| The Rust core walks only the folders a user selects. | 10 | F-1-10 |
| It computes SHA-256 for exact matches and a 64-bit difference hash for visual matches. | 14 | F-1-11 |
| It also reads EXIF capture time and camera fields. | 9 | F-1-12 |
| Similarity groups exclude files already covered by a stronger exact match. | 11 | F-1-13 |
| Moving a file preserves its bytes and embedded EXIF metadata. | 10 | F-1-14 |
| If a move crosses drives, the app copies the file first and removes the source only after a successful copy. | 20 | — |
| A name collision receives a numbered file name instead of overwriting either copy. | 13 | — |
| Project map | 2 | — |
| `src/` — TypeScript interface, demo data, license flow, and decision log. | 10 | —; developer map |
| `src-tauri/` — local scanner, matching logic, quarantine, restore, and desktop packaging. | 10 | —; developer map |
| `public/` — PWA shell, original art, sample images, and installer scripts. | 10 | F-1-30 |
| `tests/` — model and Playwright tests. | 5 | —; developer map |
| `.factory/` — product brief, visual thesis, claims, demo contract, and handoff. | 10 | —; developer map |
| Privacy and license | 3 | — |
| Read the in-product privacy page and terms. | 7 | — |
| Source code is available under the MIT License. | 8 | — |

## Structure, links, accessibility, and identity

### Passed checks

- Root title follows “Product — what it does.” Demo, Privacy, Terms, Review,
  and 404 titles are route-specific and under 60 characters.
- Each tested route has `lang="en"`, one h1, and one main landmark.
- Root has description, canonical, OG/Twitter metadata, SVG favicon, apple
  icon, manifest, theme color, robots, sitemap, and security headers.
- `/demo`, `/privacy`, and `/terms` deep links return 200. Unknown paths return
  a designed true 404.
- New-route focus moves to the h1 and the live region announces it. The skip
  link works. F-1-5 records the separate Back-scroll failure.
- Every discovered internal link returned 200, except the intentional unknown
  route at 404. Sociobot, GitHub releases, and all four current package URLs
  returned success; checkout returned the expected 303 to Dodo. Mail links
  were treated as explicit actions.
- A live axe sweep of `/`, `/demo`, `/privacy`, `/terms`, and `/missing-frame`
  at desktop and 390 px, in light and dark mode, found zero violations.
- None of those routes overflowed horizontally at the tested widths.
- `/opt/fleet/lib/verify-url.sh` passed: one h1/main, title, language, all image
  alt attributes, labeled buttons, and zero console errors.
- The light-table, contact-sheet, offset-frame, and archival-paper identity is
  distinct and matches `.factory/design.md`; it is not a generic SaaS template.

### Remaining structure findings

F-1-5 and F-1-16 through F-1-18 cover the Back behavior, stale route metadata,
incomplete 404 shell, and unannounced checkout origin.

## History

No `.factory/review-*.md` or `.factory/polish-*.md` existed before this review,
so there are no earlier review finding IDs to retest.

The existing verification handoff was read. Its stated first-read, demo,
functional, request-log, accessibility, link, 404-status, build, and package
outcomes were rechecked rather than accepted by assertion. They pass except
for the stricter findings in this report. Its known unsigned-package operator
action is still present and is recorded as F-1-34.

## Missed leverage and AI

No additional AI feature is justified. The brief is about deterministic local
matching, evidence, reversible moves, and a CSV record; runtime AI would add
privacy and cost without completing that job. The product already has the
obvious import/export path through the decision log. Cloud sync would conflict
with the current local-first promise. No provider key or decorative AI feature
was found.

## Verification summary

| Check | Result |
| --- | --- |
| Cold first screen, desktop and real Android user agent at 390 × 844 | PASS |
| One-click populated demo, reset, exit, and independent real-storage sentinel | PASS |
| Live demo request log | PASS, same-origin only |
| All 15 exact claim commands | PASS; coverage findings remain |
| `npm test` | PASS: Rust 7/7, Vitest 7/7, Playwright 21/21 |
| `npm run build` | PASS; `dist/site/` produced |
| Live axe, 5 routes × 2 widths × 2 color schemes | PASS, zero violations |
| URL verifier and console/page errors | PASS |
| Link crawl and current download URLs | PASS |
| Route titles, h1/main, deep links, true 404 | PASS with F-1-16/F-1-17 |
| Back/forward scroll restoration | FAIL, F-1-5 |

## What would make this perfect

Close every finding above: make each claim test prove its full sentence and
scope, register or remove every remaining claim, restore Back scroll, provide
route-specific metadata and a full 404 shell, standardize the three conflicting
terms, replace the vague action labels and slogans, and sign the production
desktop packages. No AI, sync, or additional product feature is needed after
those repairs.
