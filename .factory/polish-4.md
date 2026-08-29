# Proof Pile polish 4 — cumulative finding closure

- Base candidate: `1ab50925f38ae9da34fa4489a4aaa37acb1c7573`
- Repaired source: `55a357715a64ac7bcbfbc9f4ade0a53cbfce1b06`
- Live site: <https://photo-proof-pile.sociobot.in>
- Final deployment: `5dbc2860-6ab0-4065-87fe-f2cb2c3beb28`
- Checked: 29 August 2026 UTC

All repository-controlled findings are fixed. The unsafe public-release state
is also closed: all 11 historical releases without a verified-signatures
marker are now private drafts, and the site and installers expose no package.
Actual signed Windows and notarized macOS publication still requires the
owner-held credentials listed in `.factory/handoff.md`.

## Evidence index

- Exact clean-clone result for all 22 claims:
  [`clean-clone-claims.txt`](polish-4-artifacts/clean-clone-claims.txt)
- Cold live route, demo, storage, focus, mobile, axe, privacy, offline, and
  download-gate result: [`live-qa.json`](polish-4-artifacts/live-qa.json)
- Cold first screens: [`live-cold-desktop.png`](polish-4-artifacts/live-cold-desktop.png),
  [`live-cold-mobile-390.png`](polish-4-artifacts/live-cold-mobile-390.png)
- One-click sample and 390 px sample:
  [`live-demo-one-click.png`](polish-4-artifacts/live-demo-one-click.png),
  [`live-demo-mobile-390.png`](polish-4-artifacts/live-demo-mobile-390.png)
- Trusted-download refusal:
  [`live-download-gate.png`](polish-4-artifacts/live-download-gate.png),
  [`live-install-sh.txt`](polish-4-artifacts/live-install-sh.txt), and
  [`public-releases.json`](polish-4-artifacts/public-releases.json)
- Release hard-gate run:
  [`release-workflow.json`](polish-4-artifacts/release-workflow.json) and
  [`release-workflow-jobs.json`](polish-4-artifacts/release-workflow-jobs.json)
- Worker URL checks: [`root`](polish-4-artifacts/verify-root/verify.json) and
  [`demo`](polish-4-artifacts/verify-demo/verify.json)
- Live Lighthouse: [`lighthouse-live.json`](polish-4-artifacts/lighthouse-live.json)

## Review 1 findings

| Finding | Change made | Current evidence |
| --- | --- | --- |
| F-1-1 | `?demo=1` uses `demo:photo-proof-pile:session`; reset and exit discard only sample state. | `@claim:demo-isolated`; live `demoIsolation` check; one-click screenshot. |
| F-1-2 | Browser request privacy and native file-operation privacy remain separate executable claims. | `@claim:local-privacy`; Rust `claim_native_local_privacy`; live request log. |
| F-1-3 | Registered and asserted the token-only Sociobot license request. | `@claim:license-request-privacy`; live `/privacy`. |
| F-1-4 | The evidence claim visits all three groups and checks all eight files and every promised field. | `@claim:match-evidence`; live demo screenshots. |
| F-1-5 | History entries retain path, query, hash, scroll, h1 focus, and route announcement. | `routes load without console errors and Back restores…`; live scroll `2959 → 2958` and focused h1. |
| F-1-6 | Replaced “safer” with factual “Local duplicate-photo review.” | `.factory/copy-audit.md`; cold first-screen screenshots. |
| F-1-7 | Removed unproved face, cloud-gallery, and permanent-delete boundary promises. | `tests/model.test.ts`; copy audit and live metadata. |
| F-1-8 | Copy limits the paid difference to scan size; safety tools work without a license. | `@claim:free-safety-tools`; live pricing. |
| F-1-9 | Checkout names Sociobot plainly and refund copy links a real email action. | `@claim:paid-checkout`; live `/` and `/terms`. |
| F-1-10 | Native coverage proves selected-root scope and unchanged source files. | Rust `claim_scan_scope`. |
| F-1-11 | Removed unproved algorithm detail; tests assert observable matching outcomes. | Rust `claim_native_matching`; README audit. |
| F-1-12 | Camera and capture-time values use plain labels and exact fixture assertions. | `@claim:match-evidence`; Rust `claim_native_matching`. |
| F-1-13 | Native matching prevents one file from entering overlapping groups. | Rust `claim_native_matching`. |
| F-1-14 | Cross-drive moves preserve bytes, embedded information, and dates, and avoid collisions. | Rust `claim_cross_drive_safety`. |
| F-1-15 | Removed the unproved license migration promise. | `@claim:paid-license`; copy audit. |
| F-1-16 | Every SPA route sets its own title, description, canonical, Open Graph, and Twitter text. | `the app route uses a product-first title…`; live route records. |
| F-1-17 | The HTTP 404 uses the product header, skip link, legal footer, metadata, and archival visual system. | `pages meet the automated accessibility baseline…`; live 404 status/title/legal-link record. |
| F-1-18 | Checkout says “Buy via Sociobot checkout ↗” and is marked external. | `@claim:paid-checkout`. |
| F-1-19 | The portable record is “decision log (CSV)” on introduction and “decision log” thereafter. | `@claim:csv-export`; copy audit. |
| F-1-20 | Reader copy uses “copies on other drives”; the evidence label is “Other-drive copies.” | `@claim:match-evidence`; copy audit. |
| F-1-21 | The visual match group is consistently “Looks alike.” | `@claim:match-evidence`; Rust `claim_native_matching`. |
| F-1-22 | The action names the count and result; confirmation names the destination. | `@claim:review-before-move`; `@claim:reversible-plan`. |
| F-1-23 | The hero caption lists the file evidence retained for each group. | Copy audit; cold desktop screenshot. |
| F-1-24 | Removed the decorative steps eyebrow. | Copy audit; live `/#how`. |
| F-1-25 | The section is named “Privacy and limits.” | Copy audit; cold screenshots. |
| F-1-26 | The footer is the factual sentence “Review duplicate photos before moving extra copies.” | Live route records; copy audit. |
| F-1-27 | First-read copy says locations, sizes, dates, and copies instead of unexplained hash jargon. | Copy audit; cold first screen. |
| F-1-28 | README opens with the photo-review job and audience. | README and copy audit. |
| F-1-29 | README and demo docs explain that sample choices stay in the tab and never mix with real work. | `@claim:demo-isolated`; `.factory/demo.md`. |
| F-1-30 | The project map says “offline web files,” not “PWA shell.” | README audit. |
| F-1-31 | The license action is “Restore a purchase.” | `@claim:paid-license`; live `/`. |
| F-1-32 | The undecided file action is “Mark for review.” | Keyboard-decision browser test; live demo. |
| F-1-33 | Phones state that the desktop app requires a desktop OS; desktop action checks a signed download. | `Android and iPhone visitors see truthful desktop availability`; mobile screenshot. |
| F-1-34 | Removed unsigned fallbacks; CI requires both credential sets, independently verifies downloaded signatures, and emits the marker only after success. All 11 unverified public releases were made private drafts. UI and installers now offer nothing without that marker. | `blocks release publication until trusted desktop signatures are independently verified`; run `33273116306`; public release list `[]`; download-gate screenshot; live installer exit 1. Signed publication awaits owner credentials. |

## Review 2 findings

| Finding | Change made | Current evidence |
| --- | --- | --- |
| F-2-1 | Package, Tauri, Cargo, site, service worker, and static 404 identity are aligned at `0.1.14`. | `keeps the static 404 release identity in sync…`; live true-404 route record. |
| F-2-2 | Same trusted-signature hard gate and public withdrawal as F-1-34. | Workflow regression/run; public release list `[]`; live dialog exposes zero links. |
| F-2-3 | The license claim checks 23:59:59, the exact 24-hour boundary, and immediate reuse. | `@claim:paid-license`. |
| F-2-4 | Removed visitor-facing generated-asset provenance claims; provenance remains in the visual thesis. | `tests/model.test.ts`; live footer records. |
| F-2-5 | Refund instructions use the tested `support@sociobot.in` mail action. | `@claim:paid-checkout`; live `/terms`. |
| F-2-6 | Installer docs explain the published verification file in plain words. | `@claim:installer-checksum`; `@claim:windows-installer-checksum`; README audit. |

## Review 3 findings

| Finding | Change made | Current evidence |
| --- | --- | --- |
| F-3-1 | Same release hard gate and unsigned-publication withdrawal as F-1-34/F-2-2. | Run `33273116306`; public release list `[]`; live dialog and installer refusal. |
| F-3-2 | SPA navigation preserves the full path, query, and hash and focuses “How photo cleanup works.” | `How it works keeps its hash and focuses…`; live routing audit. |
| F-3-3 | Registered `review-before-move`; native and browser checks reject unsafe plans and assert exact confirmation. | `npm run test:claim:review-before-move`; Rust `claim_review_before_move_rejects_unreviewed_native_plans`. |
| F-3-4 | `/app` title is “Proof Pile — Review photo copies,” with matching route metadata. | `the app route uses a product-first title…`; live `/app` record. |

## Review 4 finding

| Finding | Change made | Current evidence |
| --- | --- | --- |
| F-4-1 | Closed every unsigned distribution path: no unsigned fallback, no public unsigned release, no unverified dialog link, and no installer write. Publication can resume only after Authenticode and Apple signing/notarization checks pass. | Workflow run `33273116306` stopped at `validate-signing`; all later publication jobs skipped; public release list `[]`; live dialog screenshot; installer exited 1 without creating a file. Owner credentials are the sole remaining prerequisite for signed binaries. |

## Final verification

- Clean clone of `55a357715a64ac7bcbfbc9f4ade0a53cbfce1b06`: `npm ci`
  passed with zero audit vulnerabilities. Every one of the 22 claim commands
  passed separately; every claim ID occurs in exactly one test tag.
- Clean-clone `npm test`: 10 Rust, 11 Vitest, and 30 Playwright tests passed.
  `npm run check` and `npm run build` passed; `dist/site` was produced.
- `actionlint 1.7.12` passed the release workflow.
- `CI=true npm run build:desktop -- --bundles deb,rpm` produced both Linux
  packages. The DEB is `proof-pile` `0.1.14` `amd64`, SHA-256
  `2c66565ae5727a5b26f5ebf18d0c3b82b28b933764a8ea087a8203829ab4b5e9`.
  The binary remained running under Xvfb through the intentional eight-second
  timeout.
- Live axe: zero serious or critical findings on `/`, `/demo`, `/privacy`,
  `/terms`, and the true 404 in light and dark. Mobile axe also passed.
- Live mobile: no horizontal overflow at 390 px or 200% text; every checked
  touch target is at least 44 px; reduced motion is active.
- Live privacy/offline: ordinary use made no off-origin request; the explicit
  download check contacted only `api.github.com`; `/demo` reloaded offline
  with all three groups.
- Live Lighthouse: performance 100, accessibility 100, best practices 100,
  SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 0 ms, CLS 0, transfer 137 KiB.
