# Proof Pile polish 7 — complete finding closure

- Reviewed candidate: `59c0e5a5d1b408010abf6d6f9a72cbaba58a680d`
- Repair commit: `3791aad` (`fix: require verified desktop release signatures`)
- Current version: `v0.1.23`
- Product: <https://photo-proof-pile.sociobot.in>

Every finding in reviews 1–7 was read and rechecked. The repeated
desktop-signing finding is closed by the stricter current release gate, not by
an unsigned-package disclaimer.

## Evidence index

- Clean-clone claim run: 22 exact commands passed (recorded in this handoff).
- Local root check: [`verify.json`](polish-7-artifacts/local-verify/verify.json),
  [`desktop`](polish-7-artifacts/local-verify/screenshot-desktop.png), and
  [`mobile`](polish-7-artifacts/local-verify/screenshot-mobile.png).
- Local direct-demo check: [`verify.json`](polish-7-artifacts/local-demo-verify/verify.json),
  [`desktop`](polish-7-artifacts/local-demo-verify/screenshot-desktop.png), and
  [`mobile`](polish-7-artifacts/local-demo-verify/screenshot-mobile.png).
- Final live evidence is added after the deployment and cold recheck.

## Finding mapping

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Demo uses its own `demo:` storage namespace; reset and exit discard sample state only. | `@claim:demo-isolated`; `/demo` local verifier. |
| F-1-2 | Browser and native local-only privacy tests cover the separate code paths. | `@claim:local-privacy`; Rust `claim_native_local_privacy`. |
| F-1-3 | Only the license token is sent for verification. | `@claim:license-request-privacy`; `/privacy`. |
| F-1-4 | The sample exposes three groups, eight files, and each promised evidence field. | `@claim:match-evidence`; `/demo` screenshots. |
| F-1-5 | History, hash, scroll, focus, and announcement behavior remain route-tested. | Browser route/history tests. |
| F-1-6 | The first screen says “Local duplicate-photo review.” | Current copy audit; root screenshot. |
| F-1-7 | Unsupported face, cloud-gallery, and permanent-delete promises remain absent. | Model copy test; current copy audit. |
| F-1-8 | Free safety actions remain available; the license changes only scan size. | `@claim:free-safety-tools`. |
| F-1-9 | Checkout and refund destination are explicit. | `@claim:paid-checkout`; `/terms`. |
| F-1-10 | Scanner scope is selected folders only. | Rust `claim_scan_scope`. |
| F-1-11 | Copy describes observed matching results rather than unsupported algorithm claims. | Rust `claim_native_matching`; copy audit. |
| F-1-12 | Camera and capture-time fixture evidence stays labeled plainly. | `@claim:match-evidence`; Rust matching test. |
| F-1-13 | A file appears in only one exact-match group. | Rust `claim_native_matching`. |
| F-1-14 | Cross-drive moves preserve bytes and metadata without overwrite collisions. | Rust `claim_cross_drive_safety`. |
| F-1-15 | Unsupported license-migration promise remains removed. | `@claim:paid-license`; copy audit. |
| F-1-16 | Every app route assigns title, description, canonical, Open Graph, and Twitter metadata. | Browser route metadata tests. |
| F-1-17 | Unknown paths serve the designed HTTP 404 with header, legal footer, and return action. | Browser 404 route test; static 404 build. |
| F-1-18 | Checkout says “Buy via Sociobot checkout ↗”. | `@claim:paid-checkout`; copy audit. |
| F-1-19 | Export is consistently a decision log (CSV). | `@claim:csv-export`. |
| F-1-20 | “Copies on other drives” is used consistently. | `@claim:match-evidence`; copy audit. |
| F-1-21 | Visual groups are consistently named “Looks alike.” | Matching tests; copy audit. |
| F-1-22 | Move action and confirmation include count and destination. | `@claim:review-before-move`. |
| F-1-23 | First-screen caption names each group’s retained evidence. | Root screenshot; copy audit. |
| F-1-24 | Decorative steps label remains removed. | Copy audit; `/#how`. |
| F-1-25 | The section is named “Privacy and limits.” | Copy audit; root check. |
| F-1-26 | Footer names the photo-review job in plain words. | Copy audit; route tests. |
| F-1-27 | First-read copy names locations, sizes, dates, and copies. | Root screenshot; copy audit. |
| F-1-28 | README leads with the review job and audience. | README; copy audit. |
| F-1-29 | Demo documentation describes the isolated tab-only sample. | `@claim:demo-isolated`; `.factory/demo.md`. |
| F-1-30 | Project map says “offline web files.” | README. |
| F-1-31 | The license action reads “Restore a purchase.” | `@claim:paid-license`. |
| F-1-32 | Undecided action remains “Mark for review.” | Keyboard browser test. |
| F-1-33 | Desktop button and phone guidance use the intended platform-specific wording. | Browser platform test; 390 px check. |
| F-1-34 | Repaired again with mandatory credentials, signing/notarization checks, independent downloaded-package checks, and a required marker. | Workflow regression test; `@claim:verified-downloads-only`. |
| F-2-1 | Package, Tauri, runtime, 404, and service-worker identities are aligned at `v0.1.23`. | Model identity test; build. |
| F-2-2 | Same unsafe-publication recurrence as F-1-34; it is now fail-closed. | `@claim:verified-downloads-only`; workflow regression test. |
| F-2-3 | License verification has pre-24-hour and exact-boundary coverage. | `@claim:paid-license`. |
| F-2-4 | Visitor-facing generated-image provenance claims remain absent. | Model copy test; copy audit. |
| F-2-5 | Refund action is the explicit support email. | `@claim:paid-checkout`; `/terms`. |
| F-2-6 | README explains the published signed-package verification record plainly. | README; installer tests. |
| F-3-1 | Same unsafe-publication recurrence as F-1-34; it is now fail-closed. | Workflow regression test; verified-download claim. |
| F-3-2 | Deep links preserve full path/query/hash and focus the destination heading. | Browser hash-route test. |
| F-3-3 | Unsafe plans are rejected and the exact move confirmation is tested. | `@claim:review-before-move`. |
| F-3-4 | `/app` keeps product-first metadata. | Browser title/metadata test. |
| F-4-1 | No unsigned release branch, public dialog link, or installer action remains. | Workflow regression test; installer tests. |
| F-5-1 | The signing gate, withdrawal, and marker requirement are restored. | Verified-download claim; GitHub release API check. |
| F-5-2 | Mobile offers desktop guidance rather than a package control. | Browser platform test; mobile verifier. |
| F-6-1 | The repeated signing defect is closed by the required marker and independent checks. | Workflow and installer tests; verified-download claim. |
| F-6-2 | README names the signed-package verification record in plain words. | README; installer tests. |
| F-6-3 | The action remains “Check desktop downloads.” | Browser exact-label test. |
| F-6-4 | The former unsupported promise is replaced by a registered, executable claim. | `verified-downloads-only` manifest and test. |
| F-7-1 | Removed unsigned branches, claim, and documentation; introduced mandatory full signing credentials, independent checks, marker-only public availability, and withdrew public v0.1.22. | `npm run test:unit`; `@claim:verified-downloads-only`; installer tests; public release list `[]`, `/releases/latest` 404. |
| F-7-2 | Regenerated the copy audit from v0.1.23, with the exact marker rule and current catalog count. | `.factory/copy-audit.md`; model identity test; current build. |

## Final verification

Before deployment, a fresh clone completed `npm ci`, all 22 exact claim
commands, `CI=1 npm test` (11 Rust, 12 Vitest, 33 Playwright), `npm run check`,
and `npm run build`. The desktop package build produced a v0.1.23 DEB and RPM;
an extracted DEB stayed running under Xvfb for eight seconds. The local root
and `/demo` verifier found one title, `lang=en`, one h1, a main landmark,
complete image alt text, and no console errors.

The final section is updated after static deployment with a cold live root,
direct demo, routing, accessibility, mobile, and download-gate recheck.
