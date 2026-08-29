# Polish round 3 — cumulative finding closure

Repair commits: `3cc76fd`, `c19ecd6`

Static deployment: `38ac84a2-25c6-4514-9aef-e55697378e13`

Live URL: <https://photo-proof-pile.sociobot.in>

Evidence screenshots and machine reports are under
`.factory/evidence/polish-3/`. The live checks used fresh browser contexts.

## Review 1 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Kept `?demo=1` in the isolated `demo:photo-proof-pile:session` namespace; reset and exit remove only demo state. | `@claim:demo-isolated`; `live/demo-mobile.png`; cold `/?demo=1` check. |
| F-1-2 | Kept browser request auditing separate from native scan/quarantine coverage. | `@claim:local-privacy`; Rust `claim_native_local_privacy`; cold `/demo` offline/request check. |
| F-1-3 | Kept the token-only license request claim with seeded private review data. | `@claim:license-request-privacy`; live `/privacy`. |
| F-1-4 | Kept exact fixture checks for all eight files and every promised evidence field. | `@claim:match-evidence`; `live/demo-mobile.png`; live `/demo`. |
| F-1-5 | Kept per-history-entry scroll restoration; hash destinations now have separate scroll keys. | `routes load without console errors and Back restores the previous scroll position`; live route audit. |
| F-1-6 | Kept the factual first-screen label “Local duplicate-photo review.” | `.factory/copy-audit.md`; `live/landing-mobile.png`; live `/`. |
| F-1-7 | Unsupported face, cloud-gallery, and delete-boundary promises remain absent. | `tests/model.test.ts`; live copy/metadata inspection. |
| F-1-8 | Kept the narrow license promise and unlicensed quarantine/restore proof. | `@claim:free-safety-tools`; live pricing. |
| F-1-9 | Kept plain Sociobot checkout and direct refund email copy. | `@claim:paid-checkout`; live `/` and `/terms`. |
| F-1-10 | Kept native proof that only selected roots are read and sources remain unchanged. | Rust `claim_scan_scope`; live `/`. |
| F-1-11 | Kept outcome-based matching copy without unproved algorithm detail. | Rust `claim_native_matching`; README audit. |
| F-1-12 | Kept plain camera/capture wording and exact fixture assertions. | Rust `claim_native_matching`; live `/demo`. |
| F-1-13 | Kept the unique-membership assertion across stronger and weaker match groups. | Rust `claim_native_matching`. |
| F-1-14 | Kept full-byte, embedded-information, date, and collision checks for cross-drive moves. | Rust `claim_cross_drive_safety`. |
| F-1-15 | Unsupported device-migration wording remains absent. | `@claim:paid-license`; live purchase-restoration dialog. |
| F-1-16 | Kept route-specific title, description, canonical, Open Graph, and Twitter metadata. | `the app route uses a product-first title and route metadata`; live route audit. |
| F-1-17 | Kept the styled true-404 shell and added its missing “How it works” header link. | `pages meet the automated accessibility baseline…`; live `/missing-frame` returned 404. |
| F-1-18 | Kept the checkout destination explicit and external. | `@claim:paid-checkout`; live `/`. |
| F-1-19 | Kept “decision log (CSV)” then “decision log” terminology. | `@claim:csv-export`; copy audit. |
| F-1-20 | Kept “copies on other drives” and “Other-drive copies.” | `@claim:match-evidence`; live `/demo`. |
| F-1-21 | Kept “Looks alike” as the user-facing match name. | `@claim:match-evidence`; Rust `claim_native_matching`. |
| F-1-22 | Kept the dynamic “Move N files to quarantine” action and added the destination to confirmation. | `@claim:review-before-move`; live `/demo`. |
| F-1-23 | Kept the factual hero caption naming its evidence. | `.factory/copy-audit.md`; `live/landing-mobile.png`. |
| F-1-24 | The decorative steps label remains removed. | `.factory/copy-audit.md`; live `/#how`. |
| F-1-25 | Kept the named “Privacy and limits” section. | `.factory/copy-audit.md`; live `/`. |
| F-1-26 | Kept the factual footer description on every route. | live route audit. |
| F-1-27 | Kept first-read evidence wording free of unexplained hash jargon. | `.factory/copy-audit.md`; live `/`. |
| F-1-28 | README still starts with the user and photo-review job. | README audit. |
| F-1-29 | README and demo docs describe tab-only sample isolation in user terms. | `@claim:demo-isolated`; `.factory/demo.md`. |
| F-1-30 | Project map still says “offline web files.” | README audit. |
| F-1-31 | Kept “Restore a purchase.” | `@claim:paid-license`; live `/`. |
| F-1-32 | Kept “Mark for review.” | `keyboard decisions move focus to the next file…`; live `/demo`. |
| F-1-33 | Kept truthful desktop-download wording on phones. | `Android and iPhone visitors see truthful desktop availability`; live mobile check. |
| F-1-34 | Removed all unsigned macOS/Windows fallback jobs. Release creation now fails before publication without both trusted credential sets; successful jobs verify Authenticode, app signatures, Gatekeeper, and notarization, then publish a signature marker. The download dialog recognizes that marker. | `blocks release publication until trusted desktop signatures can be verified`; `.github/workflows/release.yml`. Current v0.1.10 assets remain unsigned because the repository exposes zero signing secrets. |

## Review 2 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-2-1 | Kept package, Tauri, app, and static-404 version identity aligned. | `keeps the static 404 release identity in sync with the product version`; live `/404.html`. |
| F-2-2 | Same release hard gate and verification path as F-1-34/F-3-1. | Signing workflow unit check; repository secret inventory: `0`. |
| F-2-3 | Kept exact 23:59:59 and 24:00:00 license-cache boundary coverage. | `@claim:paid-license`. |
| F-2-4 | Asset-provenance marketing text remains absent from both footers. | `tests/model.test.ts`; live `/` and `/missing-frame`. |
| F-2-5 | Refund text remains a tested email action. | `@claim:paid-checkout`; live `/terms`. |
| F-2-6 | Installer copy remains the plain “published verification file” explanation. | `@claim:installer-checksum`; `@claim:windows-installer-checksum`. |

## Review 3 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-3-1 | Releases can no longer fall back to unsigned macOS or Windows packages. Publication requires credentials and post-build OS signature checks; the site changes its trust copy only when the verified marker exists. Existing v0.1.10 binaries cannot be retroactively trusted without owner-held certificates. | `blocks release publication until trusted desktop signatures can be verified`; GitHub secret inventory `0`; latest release API check. |
| F-3-2 | Internal routing now preserves path, query, and hash. `/#how` focuses “How photo cleanup works,” scrolls it into view, and works from home, policy pages, and direct loads. | `How it works keeps its hash and focuses the section from home and another route`; live `/#how` focused `#how-title` at viewport top `0`. |
| F-3-3 | Added `review-before-move`. The native core rejects unreviewed entries and plans without a readable kept copy. UI confirmation names count and destination before invoking native work. | `npm run test:claim:review-before-move`; Rust `claim_review_before_move_rejects_unreviewed_native_plans`; live `/demo`. |
| F-3-4 | Changed `/app` to “Proof Pile — Review photo copies” and covered canonical/social metadata. | `the app route uses a product-first title and route metadata`; live `/app`. |

## Additional final-pass work

- Added `/app` to `sitemap.xml` and regression coverage for every indexable route.
- Added “How it works” to the static 404 header so the common shell remains complete.
- Updated `.factory/catalog-description.txt` to a 75-character verb-first sentence.
- Preserved the archival light-table visual system and its mobile layout.

## Verification

- Clean clone of `3cc76fd`: all 20 exact `.factory/claims.json` commands passed.
- Clean clone full suite: 10 Rust, 9 Vitest, and 28 Playwright tests passed.
- `npm run build` and `npm run check` passed; production output is `dist/site`.
- Initial JavaScript is 14.90 kB gzip total; CSS is 5.09 kB gzip.
- Local Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.6 s, CLS 0, 138 KiB.
- Live Lighthouse mobile: 100/100/100/100; LCP 1.2 s, CLS 0, 137 KiB.
- Live axe audit: zero serious/critical violations on `/`, `/demo`, `/app`, `/privacy`, `/terms`, and the true 404.
- Live routing: normal routes returned 200; `/missing-frame` returned 404; every route had one h1 and one main.
- Live demo: direct `?demo=1`, isolated edit, reset, exit, real-data preservation, three groups, and offline reload passed.
- `/opt/fleet/lib/verify-url.sh` found `lang=en`, one h1, main, complete alt text, labeled buttons, and no root console errors.

## External signing dependency

The repository has no Apple or Windows signing secrets, and the Azure
subscription has no Trusted Signing account. Trusted Authenticode signing and
Apple notarization cannot be fabricated in source control. No new unsigned
release was created. Add the credentials listed in `.factory/handoff.md`, then
dispatch the release workflow; it now refuses any weaker release.
