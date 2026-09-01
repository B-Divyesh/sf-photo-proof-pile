# Landing page copy audit

Audited 1 September 2026 for release `v0.1.24`. Counts treat hyphenated
terms, prices, and URLs as one word. No reader sentence exceeds 22 words. No
banned marketing word appears.

| Landing copy | Words | Check |
| --- | ---: | --- |
| Skip to main content | 4 | Navigation |
| Proof Pile | 2 | Wordmark |
| Demo / How it works / Privacy | 1 / 3 / 1 | Navigation |
| Local duplicate-photo review | 3 | Useful label |
| Review photo copies before you remove them | 7 | Headline |
| For people with photos across several drives who fear removing the only meaningful copy. | 14 | Audience |
| Try it with sample data | 5 | `demo-isolated` |
| Opens three ready-to-review groups. | 4 | `match-evidence` |
| Check desktop downloads | 3 | `desktop-release-assets` |
| Open this page on a desktop computer to check desktop packages. | 11 | Mobile guidance |
| Photos stay on this device | 5 | `native-local-privacy` |
| Works without an account | 4 | `no-account` |
| Free for 1,000 files; US$29 once for full libraries | 9 | Price and limit claims |
| Each group keeps its file locations, dates, sizes, and match details. | 11 | `match-evidence` |
| The review desk / See why files match | 3 / 4 | Section label and heading |
| Compare file locations, image sizes, dates, and copies on other drives before making a plan. | 15 | `match-evidence` |
| Exact bytes / 3 copies · 2 drives | 2 / 4 | Sample labels |
| How photo cleanup works | 4 | Section heading |
| Scan your folders / Choose photo folders on each connected drive. / The app reads files where they are. / Start with groups, not a delete list. | 3 / 7 / 7 / 7 | Step copy |
| Review the evidence / Keep one copy and mark extras. / Every path and difference remains visible. / Compare each copy and its metadata. | 3 / 6 / 6 / 6 | Step copy |
| Quarantine, then verify / Move extras to a folder you choose. / Restore them from the decision log. / Move reviewed files, then restore if needed. | 3 / 7 / 6 / 7 | Step copy |
| Privacy and limits / Your photos are not uploaded | 3 / 5 | Section and privacy claims |
| Copies on other drives are matching files, not tested backups. / Keep a tested backup. / A matching copy can still live on a failing drive. / Open important backups before cleanup. | 10 / 4 / 9 / 5 | Safety copy |
| Desktop license / Review a full library | 2 / 4 | Section label and heading |
| The free app scans 1,000 files at a time. / A license removes that scan limit. | 9 / 6 | Limit claims |
| US$29 one-time purchase | 3 | `paid-checkout` |
| Buy via Sociobot checkout ↗ / Restore a purchase | 4 / 3 | Result actions |
| Sociobot checkout takes payment. / For refunds, email support@sociobot.in. | 4 / 4 | `paid-checkout` |
| Review duplicate photos before moving extra copies. | 7 | Footer description |
| Terms / Built by Param Factory ↗ / v0.1.24 · source [commit id] | 1 / 4 / 4 | `desktop-release-identity` |

## Download dialog copy

| Dialog copy | Words | Check |
| --- | ---: | --- |
| Close download window | 3 | Accessible name |
| Desktop app / Desktop downloads | 2 / 2 | Label and heading |
| Checking the latest release… / Checking release verification… | 4 / 3 | Loading state |
| Downloads for this build are being published. | 7 | Empty state |
| No package is offered until this source, the full package set, and the SHA-256 file match. | 17 | `desktop-release-assets`, `desktop-release-identity` |
| v0.1.24 is ready from this source. | 7 | `desktop-release-identity` |
| Packages are unsigned. / Match the SHA-256 file before opening one. | 3 / 8 | Release state |
| Download for macOS (Apple silicon) / Download for macOS (Intel) / Download for Windows / Download for Linux | 5 / 4 / 3 / 3 | Result actions |
| Downloads are not published yet. Check again later. | 8 | Error and next step |
| View release status on GitHub ↗ | 6 | External status action |
| No package was offered because release verification could not be checked. | 10 | Error explanation |

## README copy

| Copy | Words | Check |
| --- | ---: | --- |
| Review photo copies, quarantine extras, and keep a reversible decision log. | 11 | Summary |
| Proof Pile is for people whose photo libraries span several drives. | 11 | Audience |
| The desktop app reads only folders you choose, groups likely copies, and keeps evidence beside each decision. | 17 | `scan-scope`, `match-evidence` |
| The sample needs no account. / Its choices stay only in this browser tab and never mix with a real review. / Use Reset demo for a clean state. | 5 / 14 / 7 | Demo copy |
| Groups exact copies, photos that look alike, and photos taken at the same time. | 13 | `match-evidence` |
| Shows each file location, image size, file size, capture date, camera, file identifier, and copies on other drives. | 17 | `match-evidence` |
| Builds a reviewed plan before moving any file to a quarantine folder. | 12 | `review-before-move` |
| Keeps quarantine recovery records after restart. / Restore verified decision-log records after selecting their quarantine folder. / Exports every decision and move in a decision log (CSV). | 6 / 9 / 10 | Recovery and export claims |
| Keeps the review desk available offline after its first visit. | 10 | `offline-reload` |
| The free desktop app scans up to 1,000 image files at a time. / A US$29 one-time license removes that scan limit. | 13 / 8 | Price and limit claims |
| The license changes only the scan limit: quarantine, restore, and decision-log recovery remain available without one. | 15 | `free-safety-tools` |
| Buy through the Sociobot checkout. / For refunds, email support@sociobot.in. | 5 / 4 | `paid-checkout` |
| The app stores a returned license under `sb_license:photo-proof-pile` and checks it with the Sociobot API at most once each day. | 19 | `paid-license` |
| The request contains only the license token. | 7 | `license-request-privacy` |
| Use Check desktop downloads on the website. | 6 | Install action |
| A package is offered only when both macOS builds, a Windows installer, Linux packages, SHA256SUMS, and latest.json are published. | 19 | `desktop-release-assets` |
| The download must also match the source shown in the site footer. | 11 | `desktop-release-identity` |
| Current packages are unsigned: on macOS, Control-click and choose Open; on Windows, inspect the publisher warning before continuing. | 17 | `unsigned-package-state` |
| Both scripts compare the downloaded package with the published SHA-256 verification file before installing it. | 15 | Installer tests |
| The service allows 30 verification requests per client window. / Request 31 returns HTTP 429 with Retry-After; the app does not retry it automatically. | 9 / 15 | `license-verification-allowance` |
| The local scanner reads only folders you select. / It compares file bytes for exact copies and image content for photos that look alike. / It also reads the capture time and camera stored inside each photo. / Files in an exact-copy group do not appear again in another match group. | 8 / 15 / 13 / 14 | Matching claims |
| Moving a file preserves its bytes and embedded photo information. / If a move crosses drives, the app copies the file first and removes the source only after a successful copy. / A name collision receives a numbered file name instead of overwriting either copy. | 10 / 20 / 13 | `cross-drive-safety` |

## Terminology

| Concept | Product word |
| --- | --- |
| A set of suspected copies | group |
| The copy that remains | keep |
| A reversible file move | quarantine |
| The portable record | decision log (CSV), then decision log |
| A matching copy on another selected root | copies on other drives / Other-drive copies |
| Similar-image group | Looks alike |
| The isolated trial state | demo |
| An installable release | desktop download |

The move confirmation says “Move 2 files to /Sample drive/Proof Pile
Quarantine?” in the demo. `review-before-move` covers that destination-aware
confirmation. The catalog description starts with a verb and is 98 characters.
