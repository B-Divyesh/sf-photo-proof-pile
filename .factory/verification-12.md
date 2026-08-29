# Independent product verification 12 — FAIL

Date: 29 August 2026 (UTC)

- Candidate: `c573996dbaabdba0190785b34e1ec6e6cafcc693`
- Branch: `main` (`origin/main` matched before verification)
- Live URL: <https://photo-proof-pile.sociobot.in>
- Demo URL: <https://photo-proof-pile.sociobot.in/demo>
- Artifact class: desktop app with a PWA review/demo surface
- Overall result: **FAIL**

The website, demo, native core, local Linux package, and every declared claim
passed. The candidate is still not releasable: there is no public desktop
release for Linux, Windows, or macOS. A visitor cannot install the product and
therefore cannot perform the real local-library job described in the brief.
No product code was changed during verification.

## Release-blocking finding

### Severity 1 — no installable desktop release exists

Fresh evidence on 29 August 2026:

- `GET https://api.github.com/repos/B-Divyesh/sf-photo-proof-pile/releases?per_page=5`
  returned HTTP 200 with `[]`.
- `GET .../releases/tags/v0.1.14` returned GitHub API 404 `Not Found`.
- The visible live action **Check signed download for Linux** opens a dialog
  saying “Trusted downloads are not published yet. Check again later.” and
  offers zero links.
- Running the published one-line Linux installer in an isolated temporary
  `XDG_BIN_HOME` exited 1 with “A trusted Linux release is not published yet.
  Nothing was installed.” It wrote no files.
- Release workflow run
  [33273116306](https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33273116306)
  for `v0.1.14` / `f9094139f428cbfb290aecfc8bf823bc5fe2bfbc`
  failed in `validate-signing`; every build, package, checksum, and publish job
  was skipped.
- The handoff confirms that the required Apple and Windows signing secrets are
  absent. The workflow refuses to build any platform, including Linux, until
  those secrets exist.

This violates the desktop/installers acceptance contract: releases must have
working assets for all three platforms, `SHA256SUMS`, `latest.json`, and a real
detected-platform download. Failing closed protects users from unverified
packages, but it does not make an unavailable desktop product releasable.

Evidence:

- `verification-artifacts-12/distribution.json`
- `verification-artifacts-12/live-download-gate.png`
- `verification-artifacts-12/live-qa.json` → `checks.downloadGate`

## Mandatory first gates

### Claims manifest — PASS (22/22)

`.factory/claims.json` exists. Starting from the clean candidate, `npm ci`
installed 66 packages with zero audit vulnerabilities. Every exact `test`
command in the manifest then passed separately. Every claim ID maps to one
test tagged `@claim:<id>` (the combined `review-before-move` script runs its
one Rust test plus its one tagged browser test).

| Claim | Result | Evidence exercised |
| --- | --- | --- |
| `demo-isolated` | PASS | Real and demo namespaces stayed separate; reset/exit discarded only demo state. |
| `match-evidence` | PASS | Eight sample files showed paths, dimensions, sizes, dates, cameras, IDs, and other-drive counts. |
| `csv-export` | PASS | CSV contained its header plus eight file rows. |
| `reversible-plan` | PASS | Recovery records survived reload and export/import/restore. |
| `review-before-move` | PASS | Native core rejected unsafe plans; UI required review and confirmed exact count/destination. |
| `local-privacy` | PASS | Complete demo review made no off-origin request. |
| `no-ad-tracking` | PASS | Landing, demo, and privacy loaded no ad/tracking scripts. |
| `native-local-privacy` | PASS | Native scan/quarantine test used only temporary local paths. |
| `license-request-privacy` | PASS | Verification was a token-only GET with an empty body. |
| `no-account` | PASS | Sample review opened without sign-in or identity fields. |
| `free-scan-limit` | PASS | 1,001-image fixture stopped at exactly 1,000 and reported the limit. |
| `free-safety-tools` | PASS | Unlicensed quarantine, restart, and restoration remained available. |
| `paid-license` | PASS | Cached verification made no request before 24 hours and one at 24 hours. |
| `paid-checkout` | PASS | US$29 copy, Sociobot URL, refund action, returned-token storage, and URL cleanup passed. |
| `licensed-scan-limit` | PASS | Licensed scan processed all 1,001 images. |
| `offline-reload` | PASS | Demo reloaded under browser offline mode after service-worker control. |
| `native-matching` | PASS | Exact, perceptual, and same-moment fixtures grouped correctly with EXIF evidence. |
| `scan-scope` | PASS | Only chosen folders were read; adjacent/source files remained unchanged. |
| `cross-drive-safety` | PASS | Copy-before-remove preserved bytes, metadata, dates, and avoided collisions. |
| `installer-checksum` | PASS | Linux installer contract rejected untrusted/mismatched packages. |
| `windows-installer-checksum` | PASS | Windows contract required signature status and checksum before `msiexec`. |
| `verified-downloads-only` | PASS | The browser exposed no package without the signature marker. |

The live landing and README were cross-checked against the manifest; no
unlisted product claim was found.

### Cold first-read test — PASS

At 1440 × 900 and 390 × 844, the initial viewport answers all three questions:

- What: “Review photo copies before you remove them.”
- For whom: “For people with photos across several drives who fear removing
  the only meaningful copy.”
- First action: **Try it with sample data**, immediately explained by “Opens
  three ready-to-review groups.”

One click opened `/demo`, populated three review groups, and showed the
persistent “Demo — sample data, nothing is saved” banner with **Reset demo**
and **Start for real**.

Evidence:

- `verification-artifacts-12/live-cold-desktop.png`
- `verification-artifacts-12/live-cold-mobile-390.png`
- `verification-artifacts-12/live-demo-one-click.png`

## Clean-clone build and test results

```text
npm ci
  PASS — 66 packages, 0 vulnerabilities

npm test
  PASS — Rust 10/10, Vitest 11/11, Playwright 30/30

npm run check
  PASS — TypeScript no-emit, cargo fmt, strict Clippy

npm run build
  PASS — production site written to dist/site

CI=true npm run build:desktop -- --bundles deb,rpm
  PASS after installing the release workflow's documented Ubuntu packages
```

The first native build attempt stopped at the clean container's missing GLib
development package. After installing the exact Linux prerequisites declared
in `.github/workflows/release.yml`, the same command produced:

- DEB: `Proof Pile_0.1.14_amd64.deb`, SHA-256
  `41d178630ca916ef166b4998e3f654d95564b6bf4826e95116241a97c57de93e`
- RPM: `Proof Pile-0.1.14-1.x86_64.rpm`, SHA-256
  `32a5a385c1121c288ae182374f2423c494d7d33ca0a38f0c1fb4237609a52d95`

The DEB metadata reports `proof-pile`, version `0.1.14`, amd64. Its files were
extracted into a fresh temporary root and the packaged executable remained
running for the full intentional eight-second Xvfb timeout with no application
error. Only the expected headless EGL warnings appeared when the unpackaged
binary was also smoked.

## Independent product exercise

The live demo was exercised in fresh browser state with normal, boundary,
invalid, cancellation, and recovery paths:

1. Trying to quarantine the initial kept copy produced a specific “Keep one
   copy…” error and left the plan at zero.
2. **Mark exact extras** made a two-file plan.
3. Cancelling the confirmation preserved that plan. The prompt named both the
   exact count and `/Sample drive/Proof Pile Quarantine`.
4. Accepting moved two sample files and reported that no device files changed.
5. CSV export produced `proof-pile-decisions.csv`, one header plus eight rows,
   recovery hashes, and quarantine paths.
6. The restore dialog focused **Cancel**; Escape dismissed it.
7. An invalid CSV produced a plain recovery error and no unsafe restore.
8. Arrow Down selected the next group and moved focus. The focused group had a
   visible 3 px blueprint-blue outline.

The Rust suite independently covered 0/1,000/1,001-file scan boundaries,
invalid paths, exact/visual/time matching, source immutability, collision-safe
quarantine, cross-filesystem copy-before-remove, rollback, and verified
restore records.

## Accessibility, responsive behavior, and routing — PASS

- `/`, `/demo`, `/?demo=1`, `/app`, `/privacy`, and `/terms` returned 200;
  an unknown route returned the designed HTTP 404.
- Every tested route had `lang=en`, one `<h1>`, one `<main>`, a route-specific
  title/canonical description, and no image without `alt`.
- `/opt/fleet/lib/verify-url.sh` passed live `/` and `/demo` with zero
  console/page errors.
- Independent axe scans found zero serious or critical findings on `/`,
  `/demo`, `/app`, `/privacy`, and `/terms` in light and dark, plus the 390 px
  demo.
- Keyboard checks passed the skip link, Enter/Space controls, group arrow-key
  selection, safe dialog focus, and Escape dismissal; no trap was found.
- Focus-ring contrast is 5.90:1 in light and 8.75:1 in dark.
- At 390 px, document width was 390 px and tested controls were at least 44 px.
  At 200% text sizing the width remained 390 px with content/actions present.
- Reduced motion changed the 220 ms card transition to `0.01ms`; no animation
  loop remained.
- Every discovered internal/external site link returned 200, the checkout link
  returned its expected 303, and only the intentionally missing route returned
  404.

Repeatable browser evidence is in
`verification-artifacts-12/live-qa.mjs` and `live-qa.json`.

## Privacy, headers, and API allowance — PASS

- During the complete sample decision/quarantine/export/restore flow, all
  network activity was same-origin; post-load interactions made zero requests.
- No analytics, ads, third-party scripts, or font requests were observed.
- The optional download check contacted only `api.github.com`, after the user
  activated it.
- A live invalid-license attempt sent one token-only GET with no body to the
  Sociobot verify endpoint. Its response was JSON, `Cache-Control: no-store`,
  and allowed only the product origin through CORS.
- Static responses sent CSP, HSTS, `nosniff`, strict-origin referrer policy,
  and a camera/microphone/geolocation-denying Permissions Policy. CSP limits
  scripts/styles to self, allows only GitHub and Sociobot connections, and
  denies objects and framing.
- HTML, the worker, and unhashed media revalidate after 30 seconds. Hashed JS
  and CSS use `max-age=31536000, immutable`.
- The license endpoint allowance was **30 requests per client window**:
  requests 1–30 returned 200; request 31 returned 429 with `Retry-After: 3`
  (later blocked responses also included `Retry-After`).
- The product requires no sign-in, so the Microsoft Entra authority check does
  not apply.

## PWA/offline behavior — PASS

The live service worker controlled `/demo`, used cache `proof-pile-v11`,
completed an explicit `registration.update()`, and returned a 200 offline
reload with the banner and all three sample groups. Activation removes older
`proof-pile-*` caches.

## Deployment identity and budgets — PASS for the website

The candidate's production build matches the live website byte for byte:

| File | Local/live SHA-256 |
| --- | --- |
| `index.html` | `b81871176f17d036ee4666513c2fcf83102f865017912723fe55686e95f37e95` |
| `assets/index-CsomTF7o.js` | `e654d3d7a263c72b801294cfa7af41cd7a464b645694c27d02b448bf12f2f1af` |
| `assets/index-9kPWVZ_p.css` | `b9d4b2827295f73d1eb063bbaa3e5e5f023c2fd45e9ba39d90dcd3d6e1b3681a` |
| `sw.js` | `c7f8a3b7f5e02577af6345366987885a453c68b85803419a646f796742e58f1d` |
| `hero-proof-table.webp` | `466341b945e6c4b99a6ed7c8c9326cbf342687738868d5c2d7106b89c8d01fef` |
| `manifest.webmanifest` | `bd18d42636648da0c6c4780c17b304efa48433909a9c8775464922741389fd3f` |

Candidate `c573996` changes only factory documentation/evidence relative to the
deployed runtime source, so the matching output is sufficient website identity
evidence. There is no published desktop package to compare with the candidate.

| Budget | Result |
| --- | ---: |
| All emitted JavaScript | 42,605 B raw / 14,967 B gzip |
| CSS | 18,563 B raw / 5,092 B gzip |
| Hero WebP | 29,922 B |
| Lighthouse performance | 92 |
| Lighthouse accessibility | 100 |
| Lighthouse best practices | 100 |
| Lighthouse SEO | 100 |
| FCP | 1.0 s |
| LCP | 1.2 s |
| TBT | 340 ms |
| CLS | 0 |
| Transfer | 137 KiB |

Lighthouse navigation does not produce INP. The tested interactions responded
without visible delay. Raw evidence is
`verification-artifacts-12/lighthouse-live.json`.

## Paid flow — PASS, subject to unavailable desktop delivery

The Sociobot endpoint returned 303 to hosted Dodo checkout. The localized
checkout showed Proof Pile and described a one-time desktop license that only
removes the 1,000-image limit. The product embeds no payment provider and the
license restore/verification behavior passed. Purchasing cannot currently
lead to an installable desktop product because of the release blocker above.

## Defects by severity

- **Severity 1 / release blocking:** no public desktop release or downloadable
  artifact exists for any supported platform.
- **Severity 2 / material:** none beyond the consequence of the Severity 1
  distribution failure.
- **Severity 3 / minor:** none found.

## Final decision

**FAIL — candidate `c573996dbaabdba0190785b34e1ec6e6cafcc693` is not accepted for
release.** The deployed website matches and passes its checks, but the required
desktop product cannot be installed. Publish a verified release with Linux,
Windows, and both macOS architectures, checksums, and `latest.json`; then rerun
the download/install and candidate-package identity checks.
