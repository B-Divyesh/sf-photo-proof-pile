# Polish round 2 — cumulative finding closure

Product release: `v0.1.7`

Functional repair commit: `419957b`

Static deployment: `14bbb7d7-1b38-4e0f-847f-fcad14fd9db4`

Live URL: <https://photo-proof-pile.sociobot.in>

Every finding in `.factory/review-1.md`, `.factory/polish-1.md`, and
`.factory/review-2.md` was checked again. Evidence screenshots are under
`.factory/evidence/polish-2/`.

## Review 1 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Direct `?demo=1` uses `demo:photo-proof-pile:session`; reset and exit remove only that session value and never alter `proof-pile:session`. | `@claim:demo-isolated`; `live-demo-mobile.png`; cold `/?demo=1` edit/reset/exit. |
| F-1-2 | Browser sample requests and native scan/quarantine privacy are separate executable claims. | `@claim:local-privacy`, Rust `claim_native_local_privacy`; cold `/demo` request log contained only the product origin. |
| F-1-3 | License verification has a token-only request claim with seeded photo-derived data. | `@claim:license-request-privacy`; live `/privacy`. |
| F-1-4 | The evidence test checks all eight files and every displayed location, dimension, size, date, camera, identifier, and other-drive count. | `@claim:match-evidence`; `live-demo-mobile.png`; cold `/demo`. |
| F-1-5 | History entries store route scroll positions; popstate restores scroll and focuses the route h1. | `routes load without console errors and Back restores the previous scroll position`; cold `/` → `/privacy` → Back restored a non-zero position. |
| F-1-6 | The comparative eyebrow is now the factual “Local duplicate-photo review.” | `.factory/copy-audit.md`; `screenshot-mobile.png`; live `/`. |
| F-1-7 | Unsupported feature-absence claims were removed, including the leftover permanent-delete social-card sentence. | `tests/model.test.ts`; live `/` metadata inspection. |
| F-1-8 | Copy says the license changes only the scan limit; quarantine, restore, and decision-log recovery are tested unlicensed. | `@claim:free-safety-tools`; live pricing. |
| F-1-9 | Payment copy names Sociobot checkout and gives a direct refund email without merchant jargon. | `@claim:paid-checkout`; live `/` and `/terms`. |
| F-1-10 | Native coverage proves files outside the chosen root are ignored and source files stay unchanged. | Rust `claim_scan_scope`; live selected-folder wording. |
| F-1-11 | Public copy describes matching outcomes instead of unproved algorithm internals. | Rust `claim_native_matching`; README audit. |
| F-1-12 | Camera and capture-time fixture values are asserted and named in plain words. | Rust `claim_native_matching`; live `/demo`. |
| F-1-13 | Native matching asserts unique file membership when exact and similarity candidates overlap. | Rust `claim_native_matching`. |
| F-1-14 | Cross-drive quarantine compares image digest, embedded information, date, and collision outcome. | Rust `claim_cross_drive_safety`. |
| F-1-15 | Unsupported cross-device migration wording was removed. | `@claim:paid-license`; live restore-purchase dialog. |
| F-1-16 | Every SPA route updates title, description, canonical, Open Graph, and Twitter text. | Route metadata browser test; cold `/demo`, `/privacy`, and `/terms`. |
| F-1-17 | The true 404 has the common shell, legal links, metadata, icons, skip link, and archival styling. | `tests/model.test.ts`; `live-404-mobile.png`; cold `/missing-frame` returned 404. |
| F-1-18 | Checkout is labeled “Buy via Sociobot checkout ↗” and marked external. | `@claim:paid-checkout`; live `/`. |
| F-1-19 | The portable record is introduced as “decision log (CSV)” and then called “decision log.” | `@claim:csv-export`; copy audit; live `/demo`. |
| F-1-20 | Prose uses “copies on other drives”; evidence uses “Other-drive copies.” | `@claim:match-evidence`; `live-demo-mobile.png`. |
| F-1-21 | The user-facing similarity group is consistently “Looks alike.” | `@claim:match-evidence`, Rust `claim_native_matching`; live `/demo`. |
| F-1-22 | The plan action names its exact result: “Move N files to quarantine.” | `@claim:reversible-plan`; `live-demo-mobile.png`. |
| F-1-23 | Hero caption names the retained locations, dates, sizes, and match details. | Copy audit; `screenshot-desktop.png`; live `/`. |
| F-1-24 | The decorative steps eyebrow was removed. | Copy audit; `screenshot-desktop.png`. |
| F-1-25 | The section label is “Privacy and limits.” | Copy audit; `screenshot-mobile.png`. |
| F-1-26 | Footer uses “Review duplicate photos before moving extra copies.” | Copy audit; cold check on every route. |
| F-1-27 | First-read copy uses file locations, image sizes, dates, and copies on other drives. | Copy audit; live `/`. |
| F-1-28 | README starts with the photo-review job and audience, not the framework. | README audit. |
| F-1-29 | README explains that sample choices stay in the tab and never mix with a real review. | `@claim:demo-isolated`; `.factory/demo.md`. |
| F-1-30 | The project map says “offline web files,” not “PWA shell.” | README audit. |
| F-1-31 | The price action says “Restore a purchase.” | `@claim:paid-license`; live `/`. |
| F-1-32 | The unresolved per-file action says “Mark for review.” | Keyboard-decision test; `live-demo-mobile.png`. |
| F-1-33 | Web review says “Show desktop downloads,” including truthful phone availability. | `Android and iPhone visitors see truthful desktop availability`; `live-demo-mobile.png`. |
| F-1-34 / F-2-2 | The workflow has separate Windows Authenticode and macOS signing/notarization paths, followed by signature checks. Owner keys stay outside the repository. The repository currently has no signing secrets, so packages remain honestly labeled unsigned. | `.github/workflows/release.yml`; repository secret inventory returned `0`; operator action is in `.factory/handoff.md`. |

## Review 2 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-2-1 | All version sources and the static 404 say `v0.1.7`; a unit test prevents drift. | `keeps the static 404 release identity in sync with the product version`; `live-404-mobile.png`; cold `/missing-frame`. |
| F-2-2 | See F-1-34. Signed build paths and verification are implemented; trusted credentials remain owner-controlled. | Workflow inspection and repository secret inventory. |
| F-2-3 | The claim proves no request at 23:59:59, exactly one at 24:00:00, and none on immediate reload. | `@claim:paid-license` from the clean clone. |
| F-2-4 | “Generated hero imagery” was removed from both footers; provenance remains in the visual thesis and sidecar. | `tests/model.test.ts`; cold `/` and `/missing-frame`. |
| F-2-5 | Refund text links `support@sociobot.in` with a prefilled subject; payment coverage asserts it. | `@claim:paid-checkout`; cold `/` and `/terms`. |
| F-2-6 | README says the scripts compare a package with the published verification file. | Both installer checksum claims; README audit. |

## Additional final-pass fixes

- Replaced the static and SPA 404 metaphor with “This page was not found.”
- Removed “without permanent deletion” from initial social metadata.
- Removed duplicate claim-tag comments so each ID has one executable test.
- Updated the verb-first catalog description to 85 characters.

## Verification

- Fresh clone: `npm ci` and all 19 exact claim commands passed individually.
- Full repository: 9 Rust, 9 Vitest, and 24 Playwright tests passed.
- `npm run check` and `npm run build` passed; `dist/site` was produced.
- Initial assets: 13.12 kB JavaScript gzip and 5.10 kB CSS gzip.
- Lighthouse mobile: 100 in all four categories, LCP 1.1 s, CLS 0, 137 KiB.
- Cold light/dark axe checks on all routes and 404 found zero serious or
  critical violations and zero console errors.
- `verify-url.sh`: one h1, `lang=en`, main, complete alt text, labeled buttons.
