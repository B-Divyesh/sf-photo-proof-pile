# Polish round 1 — adversarial finding closure

Repair commit: `214007d84cc4acdee5bc4a6fae30cb95553981c1`  
Release tag: `v0.1.4`  
Demo checks: `/demo` and `/?demo=1`

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Direct `?demo=1` now enters the isolated sample. The demo claim seeds real storage, proves demo session storage changes alone, then proves reset and exit discard it. | `@claim:demo-isolated` |
| F-1-2 | Added a native local scan/quarantine claim test and kept browser sample request auditing separate. | `@claim:native-local-privacy`, `@claim:local-privacy` |
| F-1-3 | Added the token-only license-request claim and request-payload assertion with seeded photo paths, identifiers, thumbnails, and moves. | `@claim:license-request-privacy` |
| F-1-4 | The evidence claim now visits all three groups and checks all eight rows, every displayed field, and fixture values. | `@claim:match-evidence` |
| F-1-5 | History entries save scroll positions; Back restores them and retains h1 focus/announcement. | `routes load without console errors and Back restores the previous scroll position` |
| F-1-6 | Replaced the comparative eyebrow with “Local duplicate-photo review.” | landing copy audit |
| F-1-7 | Removed unsupported feature-absence promises from public copy; copy now states tested local behavior. | README/copy audit cross-check |
| F-1-8 | Rewrote price copy to say the license changes only the scan limit and added an unlicensed desktop-flow claim. | `@claim:free-safety-tools` |
| F-1-9 | Replaced merchant-of-record jargon with plain Sociobot checkout/refund copy. | `@claim:paid-checkout` |
| F-1-10 | Added selected-root versus adjacent-root native scan coverage with source-byte and source-date checks. | `@claim:scan-scope` |
| F-1-11 | Removed algorithm implementation detail from public copy; public outcome is tested instead. | `@claim:native-matching` |
| F-1-12 | Rewrote the camera sentence in plain words and asserted the fixture camera field. | `@claim:native-matching` |
| F-1-13 | The native match fixture now asserts unique file membership across groups. | `@claim:native-matching` |
| F-1-14 | Cross-drive coverage now moves an EXIF-tagged image and compares full SHA-256, parsed metadata, timestamps, and collision outcome. | `@claim:cross-drive-safety` |
| F-1-15 | Removed unsupported cross-device license-migration wording. | README cross-check |
| F-1-16 | Route changes now update description, canonical, Open Graph, and Twitter metadata per route. | route metadata assertions in `routes load without console errors…` |
| F-1-17 | Rebuilt `404.html` with skip link, wordmark, nav, footer/legal links, favicon, theme color, canonical, social metadata, and product styling. | static 404 inspection; `/missing-frame` axe coverage |
| F-1-18 | Checkout now reads “Buy via Sociobot checkout ↗” and carries `rel="external"`. | `@claim:paid-checkout` |
| F-1-19 | Standardized the portable artifact as “decision log (CSV)” once, then “decision log” in UI and docs. | `@claim:csv-export`, copy audit |
| F-1-20 | Replaced ambiguous backup/matching-drive labels with “copies on other drives” and “Other-drive copies.” | `@claim:match-evidence`, copy audit |
| F-1-21 | Standardized the user-facing visual-match name as “Looks alike.” | `@claim:match-evidence`, README audit |
| F-1-22 | The plan action is dynamic: “Move N files to quarantine.” | `@claim:reversible-plan` |
| F-1-23 | Replaced the hero slogan with a concrete evidence caption. | landing copy audit |
| F-1-24 | Removed the decorative steps eyebrow. | landing copy audit |
| F-1-25 | Replaced “Clear limits” with “Privacy and limits.” | landing copy audit |
| F-1-26 | Replaced footer lore with a factual product one-liner. | landing copy audit |
| F-1-27 | Replaced landing-page hash jargon with file locations, image sizes, dates, and copies on other drives. | landing copy audit |
| F-1-28 | Rewrote the README opening in user terms; framework naming no longer leads. | README audit |
| F-1-29 | Rewrote demo storage copy as the user-visible consequence. | README/demo audit |
| F-1-30 | Replaced “PWA shell” with “offline web files.” | README audit |
| F-1-31 | Replaced “Enter a license” with “Restore a purchase.” | `@claim:paid-license` |
| F-1-32 | Replaced ambiguous per-file “Review” with “Mark for review.” | browser desk coverage |
| F-1-33 | Replaced “Get the desktop app” with “Show desktop downloads.” | mobile/browser availability coverage |
| F-1-34 | Desktop signing cannot be completed without the owner-held macOS and Windows certificate material. The product remains honestly marked unsigned; the release workflow completed its unsigned package build. | external credential dependency; see handoff |

## Verification summary

- Fresh clone: `npm ci`, then every command in `.factory/claims.json` completed successfully.
- Repository: `npm test` (9 Rust, 7 unit, 22 Playwright), `npm run check`, and `npm run build` passed.
- Accessibility: Playwright axe coverage exercises light/dark routes and a 390 px review; no serious or critical violations.
- Release: GitHub Actions run `33239435244` is the v0.1.4 release workflow for the repair commit.

## Live check

Static deployment `0b6ae448-14e6-478f-a146-8d8b92e4821d` was checked cold at 2026-08-29 UTC.

- `/`, `/demo`, `/?demo=1`, `/privacy`, `/terms`, and `/missing-frame` each had zero axe serious/critical violations at 390 px.
- `/?demo=1` showed the demo banner, modified only `demo:photo-proof-pile:session`, reset that namespace, and left real session storage untouched. `Start for real` returned to the real URL.
- `/privacy` served `Privacy — Proof Pile`, its route description, and its canonical URL. `/missing-frame` returned HTTP 404 with the designed 404 page and no console errors.
- `verify-url.sh` recorded a 200 root response with one h1, `lang=en`, a main landmark, complete image alt coverage, and no console errors. Screenshots: `.factory/evidence/polish-1/live-demo-mobile.png`, `screenshot-desktop.png`, and `screenshot-mobile.png`.
