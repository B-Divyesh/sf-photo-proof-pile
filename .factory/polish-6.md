# Proof Pile polish 6 — cumulative finding closure

- Reviewed candidate: `be062b8bf3b5a6ff723dacf6298a6cd5881e9d2c`
- Repair commits: `c43d88f`, `c5be1f3`
- Release tag: `v0.1.19`
- Live site: <https://photo-proof-pile.sociobot.in>
- Cold live check: 30 August 2026 UTC

Every finding in reviews 1–6 is addressed. In particular, no desktop package
is public or offered without independent Windows Authenticode and macOS
signing/notarization proof. The unsafe v0.1.17 and v0.1.18 releases were made
private drafts. The v0.1.19 release workflow stopped before release creation
because the repository has no owner signing credentials.

## Evidence index

- All 22 claim commands and aggregate clean-clone gates:
  [`clean-clone-claims.txt`](polish-6-artifacts/clean-clone-claims.txt)
- Cold live routes, demo, storage, focus, axe, requests, mobile, offline, and
  release gate: [`live-qa.json`](polish-6-artifacts/live-qa.json)
- Cold first screens: [`desktop`](polish-6-artifacts/live-cold-desktop.png) and
  [`390 px mobile`](polish-6-artifacts/live-cold-mobile-390.png)
- One-click sample: [`desktop`](polish-6-artifacts/live-demo-one-click.png) and
  [`390 px mobile`](polish-6-artifacts/live-demo-mobile-390.png)
- Download refusal: [`dialog`](polish-6-artifacts/live-download-gate.png),
  [`public release and installer checks`](polish-6-artifacts/live-release-gate.txt)
- Worker URL checks: [`root`](polish-6-artifacts/verify-root/verify.json) and
  [`demo`](polish-6-artifacts/verify-demo/verify.json)
- Live headers and routes: [`live-headers.txt`](polish-6-artifacts/live-headers.txt)
- Lighthouse: [`summary`](polish-6-artifacts/lighthouse-summary.txt) and
  [`full report`](polish-6-artifacts/lighthouse-live.json)

## Review 1 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | `?demo=1` uses the separate `demo:photo-proof-pile:session` session namespace; reset and exit discard only sample state. | `@claim:demo-isolated`; live `demoIsolation`; demo screenshots. |
| F-1-2 | Browser request privacy and native file-operation privacy are separate executable claims. | `@claim:local-privacy`; Rust `claim_native_local_privacy`; live `requestPrivacy`. |
| F-1-3 | The token-only Sociobot license request is registered and asserted. | `@claim:license-request-privacy`; live `/privacy`. |
| F-1-4 | The evidence test visits all groups and checks all eight files and every promised field. | `@claim:match-evidence`; live sample screenshots. |
| F-1-5 | History retains path, query, hash, scroll, heading focus, and announcements. | Browser history test; live `historyAndFocus` and `hashRoute`. |
| F-1-6 | Replaced “safer” with the factual “Local duplicate-photo review.” | `.factory/copy-audit.md`; cold desktop screenshot. |
| F-1-7 | Removed unsupported face, cloud-gallery, and permanent-delete promises. | Model copy test; copy audit. |
| F-1-8 | Copy limits the paid difference to scan size; safety tools remain free. | `@claim:free-safety-tools`; live pricing section. |
| F-1-9 | Checkout names Sociobot and refunds link to a real email action. | `@claim:paid-checkout`; live `/terms`. |
| F-1-10 | Native tests prove selected-root scope and unchanged source files. | Rust `claim_scan_scope`. |
| F-1-11 | Copy states observed matching results instead of unsupported algorithm detail. | Rust `claim_native_matching`; README. |
| F-1-12 | Camera and capture-time fields use plain labels and fixture assertions. | `@claim:match-evidence`; Rust `claim_native_matching`. |
| F-1-13 | Matching keeps each file in only one match group. | Rust `claim_native_matching`. |
| F-1-14 | Cross-drive moves preserve bytes, embedded information, and dates and avoid collisions. | Rust `claim_cross_drive_safety`. |
| F-1-15 | Removed the unsupported license-migration promise. | `@claim:paid-license`; copy audit. |
| F-1-16 | Every route sets its title, description, canonical, Open Graph, and Twitter metadata. | Live route records for `/`, `/demo`, `/app`, `/privacy`, `/terms`, and 404. |
| F-1-17 | The real HTTP 404 uses the shared header, skip link, legal footer, metadata, and art. | Live unknown-route record: HTTP 404, one h1/main, all structural links. |
| F-1-18 | Checkout says “Buy via Sociobot checkout ↗” and identifies the external destination. | `@claim:paid-checkout`; cold landing. |
| F-1-19 | The portable record is consistently “decision log (CSV),” then “decision log.” | `@claim:csv-export`; live nine-row CSV. |
| F-1-20 | Reader copy uses “copies on other drives”; the field label is “Other-drive copies.” | `@claim:match-evidence`; copy audit. |
| F-1-21 | The visual-match group is consistently “Looks alike.” | `@claim:match-evidence`; Rust `claim_native_matching`. |
| F-1-22 | The move action names the count and result; confirmation names the destination. | `@claim:review-before-move`; live exact confirmation. |
| F-1-23 | The first-screen caption lists the evidence retained in each group. | Copy audit; cold desktop screenshot. |
| F-1-24 | Removed the decorative steps label. | Copy audit; live `/#how`. |
| F-1-25 | Renamed the section “Privacy and limits.” | Copy audit; cold desktop screenshot. |
| F-1-26 | Replaced footer lore with the product job in plain words. | Live route records; copy audit. |
| F-1-27 | First-read copy names locations, sizes, dates, and copies instead of hash jargon. | Copy audit; cold desktop screenshot. |
| F-1-28 | README starts with the photo-review job and its audience. | README; copy audit. |
| F-1-29 | Demo docs explain that choices stay in the tab and never mix with real work. | `@claim:demo-isolated`; `.factory/demo.md`; live isolation. |
| F-1-30 | The project map says “offline web files,” not “PWA shell.” | README. |
| F-1-31 | The license action is “Restore a purchase.” | `@claim:paid-license`; cold landing. |
| F-1-32 | The undecided file action is “Mark for review.” | Keyboard browser test; live demo. |
| F-1-33 | Desktop uses “Check desktop downloads”; phones explain that downloads must be checked on a desktop. | Platform browser test; live 390 px screenshot. |
| F-1-34 | Removed every unsigned fallback. Publication requires all Apple/Windows secrets, native signature checks, independent downloaded-package checks, and `DESKTOP_SIGNATURES_VERIFIED.json`. UI and installers reject its absence. All prior public packages are private. | Workflow model test; `@claim:verified-downloads-only`; Actions run `33295415409`; public list `[]`; live dialog and installer refusal. |

## Review 2 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-2-1 | Package, Cargo, Tauri, site, service worker, and 404 identities are aligned at `0.1.19`. | Model identity test; live 404. |
| F-2-2 | The recurring unsigned-release defect is closed by the hard gate and withdrawal of v0.1.17/v0.1.18. | Same evidence as F-1-34. |
| F-2-3 | License reuse is tested at 23:59:59 and the exact 24-hour boundary. | `@claim:paid-license`. |
| F-2-4 | Visitor-facing provenance claims were removed; provenance remains in `.factory/design.md`. | Model copy test; live footer. |
| F-2-5 | Refund instructions use the tested `support@sociobot.in` mail action. | `@claim:paid-checkout`; live `/terms`. |
| F-2-6 | README explains that installers compare packages with the published verification file; the unexplained filename is gone from reader copy. | README; both installer claims. |

## Review 3 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-3-1 | The recurring unsigned-release defect is closed as described under F-1-34. | Actions run `33295415409`; public list `[]`; live refusal. |
| F-3-2 | SPA navigation preserves full path/query/hash and focuses the destination heading. | Browser hash-route test; live `hashRoute`. |
| F-3-3 | `review-before-move` rejects unsafe plans and asserts exact confirmation copy. | Exact claim command; live `demoJob`. |
| F-3-4 | `/app` uses the product-first title and matching route metadata. | Browser title test; live `/app` record. |

## Review 4 finding

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-4-1 | No unsigned branch, public release, dialog link, or installer write remains; only verified Windows and macOS packages can reach publication. | Workflow test; Actions gate; live release and installer checks. |

## Review 5 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-5-1 | Restored the fail-closed signature contract and made the v0.1.17 and v0.1.18 releases private drafts. | `@claim:verified-downloads-only`; Actions run; live release gate. |
| F-5-2 | Mobile copy is guidance, not an operating-system compatibility promise, and mobile exposes no download button. | Platform browser test; live mobile check and screenshot. |

## Review 6 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-6-1 (recurring F-1-34) | Restored fail-closed signing and notarization validation, withdrew unsafe public packages, and required the verified-signatures marker in the site and both installers. | `@claim:verified-downloads-only`; installer claims; workflow model test; run `33295415409`; live gate screenshot and log. |
| F-6-2 (recurring F-2-6) | Rewrote README installation text to explain the published verification file and its purpose in plain words. | README; copy scan finds no reader-facing `SHA256SUMS`; installer claims. |
| F-6-3 | Renamed the first-screen action exactly “Check desktop downloads.” | Browser exact-label tests; live cold desktop and dialog screenshots. |
| F-6-4 | Removed the unlisted promise. The remaining download safety promise is registered as `verified-downloads-only` and tests both trusted and untrusted fixtures. | Claims manifest; unique-tag audit; exact claim command. |

## Final verification

- Fresh clean clone at `c5be1f3`: `npm ci` found zero vulnerabilities; all 22
  claim commands passed separately; `npm test` passed 11 Rust, 11 Vitest, and
  33 Playwright tests; `npm run check` and `npm run build` passed.
- `actionlint 1.7.12` passed the release workflow. The static build produced
  15.15 kB gzip JavaScript and 5.11 kB gzip CSS.
- Actions run
  <https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33295415409>
  failed at `validate-signing` as designed. Every build, upload, checksum, and
  publication job was skipped; no v0.1.19 release was created.
- Cold live QA passed every route and the real 404, route focus and Back,
  one-click `/demo`, direct `?demo=1`, isolated reset/exit, quarantine, CSV,
  restore focus, request privacy, offline reload, and zero unexpected console
  errors.
- Axe found zero serious or critical findings across five routes in both
  themes and on the mobile demo. At 390 px and 200% text there was no overflow;
  checked targets were at least 44 px and reduced motion was active.
- Lighthouse scored 100 in performance, accessibility, best practices, and
  SEO. LCP was 1.13 s, TBT 14 ms, CLS 0, and transfer was 140,830 bytes.
