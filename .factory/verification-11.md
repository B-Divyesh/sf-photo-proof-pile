# Independent product verification 11 — PASS

Date: 29 August 2026 (UTC)

- Candidate: `23f69880e140b1f20dbbbf67ace06b7ca5fee220`
- Candidate branch: `main` (`origin/main` resolved to the same commit)
- Live URL: <https://photo-proof-pile.sociobot.in>
- Demo URL: <https://photo-proof-pile.sociobot.in/demo>
- Artifact class: desktop app with a PWA review/demo surface
- Overall result: **PASS**

No release-blocking or material defects were found. No product code was changed.

## Mandatory first gates

### First-read test — PASS

A cold 1440 × 900 browser context showed:

- What it does: “Review photo copies before you remove them.”
- Who it is for: “For people with photos across several drives who fear
  removing the only meaningful copy.”
- What to click first: one visible “Try it with sample data” action, with the
  explanation “Opens three ready-to-review groups.”
- Three plain facts: photos stay on the device, no account is needed, and the
  free/US$29 limits.

One click opened `/demo`, immediately showed three populated review groups,
and displayed the persistent “Demo — sample data, nothing is saved” banner
with **Reset demo** and **Start for real**.

Evidence:

- `verification-artifacts-11/live-cold-desktop.png`
- `verification-artifacts-11/live-demo-one-click.png`

### Claims manifest — PASS (22/22)

`.factory/claims.json` exists. Every ID occurs in exactly one `@claim:<id>`
test tag. After `npm ci`, every exact command from the manifest passed
individually from the clean candidate.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-isolated` | PASS | Real and demo storage remained separate; reset removed only demo state. |
| `match-evidence` | PASS | All eight sample files exposed every declared path, size, date, camera, identifier, and other-drive field. |
| `csv-export` | PASS | Download contained one header plus eight sample rows. |
| `reversible-plan` | PASS | Recovery records survived reload and export/import/restore completed. |
| `review-before-move` | PASS | Rust rejected unreviewed plans; UI required reviewed choices and named the exact count and destination. |
| `local-privacy` | PASS | Complete sample review made no off-origin request. |
| `no-ad-tracking` | PASS | Landing, demo, and privacy loaded no advertising/tracking request or script. |
| `native-local-privacy` | PASS | Native scan and quarantine test changed only temporary local paths. |
| `license-request-privacy` | PASS | Intercepted verification was a token-only GET with an empty body. |
| `no-account` | PASS | Full sample review opened without identity fields or sign-in. |
| `free-scan-limit` | PASS | Native scan of 1,001 valid images reported exactly 1,000 and `limited=true`. |
| `free-safety-tools` | PASS | Unlicensed mocked desktop session quarantined two batches and restored records after reload. |
| `paid-license` | PASS | Restored token was checked once at 24 hours, not at 23:59:59. |
| `paid-checkout` | PASS | US$29, Sociobot checkout URL, returned-token storage, and URL cleanup passed. |
| `licensed-scan-limit` | PASS | Licensed native scan processed all 1,001 valid images. |
| `offline-reload` | PASS | Demo reloaded from the service worker with the browser offline. |
| `native-matching` | PASS | Native fixtures produced exact, perceptual, and same-moment groups with EXIF evidence and no duplicate membership. |
| `scan-scope` | PASS | Only selected folders were reported; adjacent files and source bytes/times were unchanged. |
| `cross-drive-safety` | PASS | Copy-before-remove preserved bytes, metadata, dates, and collision safety. |
| `installer-checksum` | PASS | Linux mismatch test removed the package before installation. |
| `windows-installer-checksum` | PASS | PowerShell contract removed a mismatch before `msiexec`. |
| `unsigned-builds` | PASS | Packages without the marker were labeled unsigned. |

## Clean-clone quality gates

Commands and fresh results:

```text
npm ci
  66 packages; 0 vulnerabilities

npm test
  Rust:       10 passed
  Vitest:     11 passed
  Playwright: 30 passed

npm run check
  TypeScript no-emit, cargo fmt, and strict Clippy passed

npm run build
  PASS; dist/site produced

CI=true npm run build:desktop -- --bundles deb,rpm
  PASS after installing the README/workflow's documented Ubuntu Tauri packages
  DEB and RPM produced
```

The first native build attempt correctly reported missing GTK/WebKit system
development libraries in the disposable image. Installing the prerequisites
listed in the project workflow made the exact build pass; this was an
environment prerequisite, not a product defect.

Production site output:

| Asset | Raw | Gzip |
| --- | ---: | ---: |
| Initial JavaScript entry | 38,566 B | 13.37 KB |
| All emitted JavaScript | 42,349 B | about 14.9 KB |
| CSS | 18,563 B | 5.09 KB |
| Hero WebP | 29,922 B | n/a |

This is below the 200 KB JavaScript, 50 KB CSS, and 300 KB hero budgets.

The locally built DEB was `proof-pile` 0.1.13, amd64, and 4,105,674 bytes. Its
SHA-256 was
`6fc86d2e3194de45ea525a827bbcd3b5a1f1b0cf7e29ab0fbebff97d564ca637`.
Its executable contained the reviewed-plan guard messages and stayed running
through the intentional eight-second Xvfb timeout; only expected headless EGL
warnings appeared.

## Independent end-to-end exercise

The live demo was tested in a fresh context with normal, boundary, invalid,
cancel, and recovery cases:

1. Attempting to quarantine the initial kept copy produced “Keep one copy in
   this group…” and left the plan at zero.
2. **Mark exact extras** created a two-file, 9.6 MB plan.
3. Cancelling preserved the plan. Confirmation said exactly: “Move 2 files to
   /Sample drive/Proof Pile Quarantine? You can restore them from the decision
   log.”
4. Accepting moved two sample files and left recovery records.
5. CSV export contained its header and eight file rows, including recovery
   hashes and quarantine paths.
6. Restore opened a modal focused on the safe **Cancel** action; Escape closed
   it. The declared restore workflow also passed export, reload, import, and
   restore in the claim test.
7. A CSV without recovery hashes produced a clear import error and did not
   create an authoritative restore record.
8. Arrow keys changed groups and moved focus with the selected option.

The native core independently exercised valid/invalid folders, 0/1,000/1,001
file boundaries, exact/similar/same-moment matching, source immutability,
collision handling, cross-filesystem copy-before-remove, rollback, verified
recovery hashes, and existing-original restore rejection through the Rust and
browser suites.

## Accessibility and responsive behavior — PASS

- `/`, `/demo`, `/privacy`, and `/terms` each have `lang=en`, one `<h1>`, one
  `<main>`, route-specific titles, ordered headings, labeled controls, and alt
  text.
- The supplied `/opt/fleet/lib/verify-url.sh` passed `/` and `/demo` with zero
  console/page errors. Reports are in
  `verification-artifacts-11/verify-root/verify.json` and
  `verification-artifacts-11/verify-demo/verify.json`.
- Independent axe scans found zero serious or critical findings on all four
  routes in light and dark presentation, plus the 390 px demo.
- Keyboard-only checks passed skip-link focus, group arrow keys, decision
  controls, confirmation cancellation, dialog focus, and Escape dismissal.
- The selected group received a visible 3 px blueprint-blue solid outline.
- At 390 CSS pixels, document width was exactly 390; visible tested buttons
  and header/footer links were at least 44 × 44 CSS pixels.
- At 200% text sizing, document width remained 390 and all content/actions
  remained available.
- With reduced motion, the 220 ms card transition became `1e-05s`; nothing
  looped.

Evidence: `verification-artifacts-11/live-demo-mobile-390.png` and the
repeatable `verification-artifacts-11/live-qa.mjs` check.

## Privacy, network, and headers — PASS

The complete non-license demo flow made only same-origin requests. No
analytics, ads, external fonts, or photo/thumbnail requests left the product
origin. The optional download dialog contacted GitHub only after the explicit
download action. License tests proved the request contains only the token.

Production responses included:

- CSP: self-only default/style/script; explicit GitHub/Sociobot connect
  origins; `object-src 'none'`; `base-uri 'self'`; `frame-ancestors 'none'`.
- HSTS with subdomains and preload.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- camera, microphone, and geolocation disabled by Permissions Policy.
- shell/revalidatable resources: `max-age=30`.
- hashed JS/CSS: `max-age=31536000, immutable`.

The live license endpoint allowed 30 requests from one client. Requests 1–30
returned 200; request 31 and later returned 429 with `Retry-After: 2`.

The product has no sign-in requirement or identity-provider UI, so the Entra
tenant check does not apply.

## PWA/offline behavior — PASS

The live worker registered from `/sw.js`, controlled the page, used cache
`proof-pile-v10`, completed an explicit `registration.update()`, and served a
200 offline reload of `/demo` with all three sample groups. The worker removes
older `proof-pile-*` caches during activation.

## Deployment and build identity — PASS

The candidate production build matched the live files byte for byte:

| File | Local/live SHA-256 |
| --- | --- |
| `index.html` | `40d610cd054cd9c10d724a67a502fd782732208dd015bc41861e0059848a67b5` |
| `assets/index-HAZsCnrB.js` | `c1b083980399ff772ea648eb8c7b484a22ae7be91e6818a8863578a18c128ed3` |
| `assets/index-9kPWVZ_p.css` | `b9d4b2827295f73d1eb063bbaa3e5e5f023c2fd45e9ba39d90dcd3d6e1b3681a` |
| `sw.js` | `7b9d20003b2f131865ff16917c89da4a877dcc207881c35989767e012946b71e` |
| `hero-proof-table.webp` | `466341b945e6c4b99a6ed7c8c9326cbf342687738868d5c2d7106b89c8d01fef` |
| `manifest.webmanifest` | `bd18d42636648da0c6c4780c17b304efa48433909a9c8775464922741389fd3f` |

The release manifest records desktop source
`71afc93f8d9370bfda853f707b103370ba3e3b1d`. A scoped diff from that commit to
the candidate contains no change under `index.html`, `package*.json`,
`public/`, `src/`, or `src-tauri/`; the only later candidate changes are the
release workflow, its regression test, and factory handoff documentation.
Therefore the shipped desktop runtime is the candidate's exact runtime source,
while the later candidate workflow fixes how immutable download URLs are
published and verified.

## Desktop distribution and paid unlock — PASS

Public release `v0.1.13` is non-draft and contains:

- macOS arm64 and x64 DMGs plus app archives;
- Windows MSI and EXE;
- Linux AppImage, DEB, and RPM;
- `SHA256SUMS` and valid `latest.json` with canonical tagged URLs.

All platform links in the live dialog returned 200. The dialog detected Linux,
Windows, and macOS correctly, offered both Mac architectures, and clearly said
the current packages are unsigned.

Fresh release checks:

- Published DEB SHA-256:
  `a95fcc55566fe2a6356f079672c4972125420270074652118788a9a3d7105ba6`;
  it matched `SHA256SUMS`.
- Extracted package metadata was `proof-pile` 0.1.13 amd64. Its native safety
  guards were present and the app stayed running through the eight-second
  Xvfb smoke timeout.
- The Linux one-line installer installed the 74.9 MB AppImage into an isolated
  temporary `XDG_BIN_HOME` only after verifying SHA-256
  `20bbfd00416a5b7f30b2e57f501e58b4a6ff7d2a4f8490fef6b393cebeffb27e`.
- GitHub Actions release run `33267683489` passed the four-platform matrix,
  checksums, publication, and post-publication jobs.

The Sociobot product endpoint returned a 303 to the hosted Dodo checkout. The
rendered order showed **Proof Pile**, **$29.00**, and a one-time desktop license
that removes only the 1,000-image scan limit. No alternate payment provider is
embedded in the product.

## Performance — PASS

Fresh mobile Lighthouse against production:

| Category/metric | Result |
| --- | ---: |
| Performance | 97 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.9 s |
| LCP | 1.1 s |
| TBT | 210 ms |
| CLS | 0 |
| Transfer | 137 KiB |

INP is not produced by a non-interactive lab navigation. The product's
interaction checks remained immediate. Raw Lighthouse evidence is
`verification-artifacts-11/lighthouse-live.json`.

## Defects by severity

- Severity 1 / release blocking: none.
- Severity 2 / material: none.
- Severity 3 / minor: none.

## Disclosed operational limits (not defects)

- macOS and Windows packages are unsigned because owner certificates are not
  configured. The release page, README, and product dialog disclose this.
- A trusted future release needs the Apple and Windows signing secrets already
  named in the handoff.

## Final decision

**PASS — candidate `23f69880e140b1f20dbbbf67ace06b7ca5fee220` is accepted for release at
<https://photo-proof-pile.sociobot.in>.**
