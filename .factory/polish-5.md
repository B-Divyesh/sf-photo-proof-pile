# Proof Pile polish 5 — cumulative finding closure

- Reviewed candidate: `e05605f301ebc105f7574c1a911216581086e46d`
- Review base: `a00798f9776aa2a33c821552c344bf642cf4bb79`
- Repair implementation: `395628297e9331e8ead19279abd7858d60288f5a`
- Live site: <https://photo-proof-pile.sociobot.in>
- Static deployment: `c91cb9c6-8f16-4a3e-b8c3-fd39718b40f0`
- Cold live check: 30 August 2026 UTC

Every repository-controlled finding from reviews 1–5 is closed. The unsafe
v0.1.15 release is now a private draft, its old MSI and DMG URLs return 404,
and the site and installers expose no package without independently verified
Windows and macOS signatures. The release workflow now stops before any build
or publication job when the owner-held credentials are absent.

## Evidence index

- All 22 claim commands and aggregate clean-clone gates:
  [`clean-clone-claims.txt`](polish-5-artifacts/clean-clone-claims.txt)
- Cold live routing, demo, storage, focus, axe, request, mobile, and offline
  checks: [`live-qa.json`](polish-5-artifacts/live-qa.json)
- Cold first screens: [`desktop`](polish-5-artifacts/live-cold-desktop.png) and
  [`390 px mobile`](polish-5-artifacts/live-cold-mobile-390.png)
- One-click sample: [`desktop`](polish-5-artifacts/live-demo-one-click.png) and
  [`390 px mobile`](polish-5-artifacts/live-demo-mobile-390.png)
- Download refusal: [`dialog screenshot`](polish-5-artifacts/live-download-gate.png),
  [`public release and installer checks`](polish-5-artifacts/live-release-gate.txt),
  and [`GitHub Actions hard gate`](polish-5-artifacts/release-workflow-gate.txt)
- Worker URL checks: [`root`](polish-5-artifacts/verify-root/verify.json) and
  [`demo`](polish-5-artifacts/verify-demo/verify.json)
- Desktop package build/smoke evidence:
  [`desktop-build.txt`](polish-5-artifacts/desktop-build.txt)
- Live response headers: [`live-headers.txt`](polish-5-artifacts/live-headers.txt)
- Live Lighthouse: [`lighthouse-live.json`](polish-5-artifacts/lighthouse-live.json)

## Review 1 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | `?demo=1` uses `sessionStorage["demo:photo-proof-pile:session"]`; reset and exit discard only sample state. | `@claim:demo-isolated`; live `demoIsolation`; sample screenshots. |
| F-1-2 | Browser request privacy and native file-operation privacy are separate executable claims. | `@claim:local-privacy`; Rust `claim_native_local_privacy`; live `requestPrivacy`. |
| F-1-3 | Registered and asserted the token-only Sociobot license request. | `@claim:license-request-privacy`; cold live `/privacy` route. |
| F-1-4 | The evidence test visits all groups and checks all eight files and every promised field. | `@claim:match-evidence`; live sample screenshots. |
| F-1-5 | History entries retain path, query, hash, scroll, h1 focus, and announcements. | Browser test `routes load without console errors and Back restores…`; live `historyAndFocus` and `hashRoute`. |
| F-1-6 | Replaced “safer” with the factual label “Local duplicate-photo review.” | `.factory/copy-audit.md`; cold desktop screenshot. |
| F-1-7 | Removed unproved face, cloud-gallery, and permanent-delete promises. | `tests/model.test.ts`; live landing copy audit. |
| F-1-8 | Copy limits the paid difference to scan size; safety tools stay free. | `@claim:free-safety-tools`; cold live landing pricing. |
| F-1-9 | Checkout names Sociobot and refund copy links a real email action. | `@claim:paid-checkout`; cold live `/terms`. |
| F-1-10 | Native tests prove selected-root scope and unchanged source files. | Rust `claim_scan_scope`. |
| F-1-11 | Copy states observable matching results instead of unsupported algorithm detail. | Rust `claim_native_matching`; README copy audit. |
| F-1-12 | Camera and capture-time fields have plain labels and fixture assertions. | `@claim:match-evidence`; Rust `claim_native_matching`. |
| F-1-13 | Matching prevents one file from entering overlapping groups. | Rust `claim_native_matching`. |
| F-1-14 | Cross-drive moves preserve bytes, embedded information, and dates and avoid collisions. | Rust `claim_cross_drive_safety`. |
| F-1-15 | Removed the unproved license-migration promise. | `@claim:paid-license`; copy audit. |
| F-1-16 | Each route sets its own title, description, canonical, Open Graph, and Twitter text. | Browser metadata test; live route records for `/`, `/demo`, `/app`, `/privacy`, `/terms`, and 404. |
| F-1-17 | The HTTP 404 uses the shared header, skip link, legal footer, metadata, and product art. | Browser accessibility test; live unknown route returned 404 with one h1/main and legal links. |
| F-1-18 | Checkout says “Buy via Sociobot checkout ↗” and announces the external destination. | `@claim:paid-checkout`; cold live landing. |
| F-1-19 | The portable record is consistently called the “decision log (CSV)” then “decision log.” | `@claim:csv-export`; live `demoJob` exported nine CSV rows. |
| F-1-20 | Reader copy uses “copies on other drives”; the field label is “Other-drive copies.” | `@claim:match-evidence`; copy audit. |
| F-1-21 | The visual-match group is consistently “Looks alike.” | `@claim:match-evidence`; Rust `claim_native_matching`. |
| F-1-22 | The move action names the count and result; confirmation names the destination. | `@claim:review-before-move`; `@claim:reversible-plan`; live exact confirmation. |
| F-1-23 | The hero caption lists the file evidence retained in each group. | Copy audit; cold desktop screenshot. |
| F-1-24 | Removed the decorative steps label. | Copy audit; cold live `/#how`. |
| F-1-25 | Renamed the section “Privacy and limits.” | Copy audit; cold desktop screenshot. |
| F-1-26 | Replaced footer lore with “Review duplicate photos before moving extra copies.” | Live route records; copy audit. |
| F-1-27 | First-read copy names locations, sizes, dates, and copies instead of unexplained hash jargon. | Copy audit; cold desktop screenshot. |
| F-1-28 | README starts with the photo-review job and its audience. | README; copy audit. |
| F-1-29 | Demo docs explain that sample choices stay in the tab and never mix with real work. | `@claim:demo-isolated`; `.factory/demo.md`; live isolation check. |
| F-1-30 | The project map says “offline web files,” not “PWA shell.” | README copy audit. |
| F-1-31 | The license action is “Restore a purchase.” | `@claim:paid-license`; cold live landing. |
| F-1-32 | The undecided file action is “Mark for review.” | Keyboard-decision browser test; live demo. |
| F-1-33 | Desktop visitors can check signed downloads; phones receive action guidance instead of a false download control. | Browser test `Android and iPhone visitors…`; 390 px cold screenshot. |
| F-1-34 | Removed every unsigned fallback. Publication requires all Apple/Windows secrets, native signature checks, independent downloaded-package checks, and `DESKTOP_SIGNATURES_VERIFIED.json`. UI and installers reject its absence. v0.1.15 is private. | Model test `blocks release publication until trusted desktop signatures are independently verified`; `@claim:verified-downloads-only`; Actions run `33282734730`; live download screenshot; old MSI/DMG 404; installer exit 1. |

## Review 2 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-2-1 | Package, Cargo, Tauri, site, service worker, and static 404 identities are aligned at `0.1.16`. | Model test `keeps the static 404 release identity in sync…`; live true-404 route. |
| F-2-2 | The recurring unsigned-release defect is closed by the hard gate and v0.1.15 withdrawal. | Same evidence as F-1-34; public releases API returned `[]`. |
| F-2-3 | The license test checks reuse, 23:59:59, and the exact 24-hour boundary. | `@claim:paid-license`. |
| F-2-4 | Visitor-facing asset-provenance claims were removed; provenance remains in `.factory/design.md`. | `tests/model.test.ts`; live footer record. |
| F-2-5 | Refund instructions use the tested `support@sociobot.in` mail action. | `@claim:paid-checkout`; cold live `/terms`. |
| F-2-6 | Installer docs explain the published verification files in plain words. | `@claim:installer-checksum`; `@claim:windows-installer-checksum`; README. |

## Review 3 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-3-1 | The recurring unsigned-release defect is closed as described under F-1-34. | Actions run `33282734730`; public release list `[]`; live refusal screenshot. |
| F-3-2 | SPA navigation preserves full path/query/hash and focuses “How photo cleanup works.” | Browser hash-route test; live `hashRoute`. |
| F-3-3 | Registered `review-before-move`; native and browser checks reject unsafe plans and assert the exact confirmation. | `npm run test:claim:review-before-move`; live `demoJob`. |
| F-3-4 | `/app` uses “Proof Pile — Review photo copies” with matching route metadata. | Browser title test; cold live `/app` route record. |

## Review 4 finding

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-4-1 | No unsigned branch, public release, dialog link, or installer write remains. Only verified Authenticode plus Apple signing/notarization can reach publication. | Model regression test; Actions gate run; live release list/dialog/installer checks. |

## Review 5 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-5-1 | Replaced the v0.1.15 unsigned publication contract with a fail-closed signature contract and withdrew the public release without deleting its recoverable draft assets. | `@claim:verified-downloads-only`; workflow model test; Actions run `33282734730`; [`live-release-gate.txt`](polish-5-artifacts/live-release-gate.txt); [`live-download-gate.png`](polish-5-artifacts/live-download-gate.png). |
| F-5-2 | Replaced the unlisted operating-system promise with “Open this page on a desktop computer to check signed downloads.” | Browser mobile-platform test; [`live-cold-mobile-390.png`](polish-5-artifacts/live-cold-mobile-390.png); live mobile check confirms no download button. |

## Final verification

- A fresh remote clone of implementation commit `395628297e9` completed
  `npm ci` with 66 packages and zero vulnerabilities. All 22 exact claim
  commands passed separately; there are 22 unique claim tags, each used once.
- Clean-clone `npm test` passed: 10 Rust, 11 Vitest, and 30 Playwright tests.
  `npm run check` and `npm run build` passed; `dist/site` was produced.
- `actionlint 1.7.12 .github/workflows/release.yml` passed.
- A clean-clone Tauri build produced version 0.1.16 DEB and RPM packages. The
  native binary stayed running throughout an eight-second Xvfb smoke test.
  These local packages were not published.
- GitHub Actions run
  <https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33282734730>
  failed at `validate-signing` as designed. All build and publication jobs were
  skipped because owner certificates are unavailable.
- Cold live QA passed real routing/titles/canonicals/404, route focus and Back,
  one-click `/demo`, direct `?demo=1`, storage isolation/reset/exit, quarantine,
  CSV export, restore focus, request privacy, offline reload, and zero console
  errors outside the expected 404 network response.
- Axe found zero serious or critical issues on five routes in both themes and
  on the 390 px mobile demo. There was no overflow at 390 px or 200% text;
  checked touch targets were at least 44 px; reduced motion was active.
- Lighthouse mobile scored 100 performance, 100 accessibility, 100 best
  practices, and 100 SEO. FCP was 1.03 s, LCP 1.18 s, TBT 73 ms, CLS 0, and
  transfer size 140,575 bytes.
