# Independent product verification 19 — PASS

Date: 1 September 2026 (UTC)

- Candidate: `59c0e5a5d1b408010abf6d6f9a72cbaba58a680d`
- Branch: `main`; the checkout began clean and matched `origin/main`.
- Live URL: <https://photo-proof-pile.sociobot.in>
- Demo URL: <https://photo-proof-pile.sociobot.in/demo>
- Product/release version: `0.1.22`
- Artifact class: Tauri desktop app with an offline web demo
- Overall result: **PASS**

No product code was changed during verification. The previous release blocker is
repaired: both `CI=1 npm test` and the literal `npm test` command completed all
33 browser tests in one worker without the former Axe timeout or already-handled
dialog race.

## Mandatory first-read and demo gate

**PASS.** A new browser context with service workers blocked opened the live
1440 × 900 page cold. The first screen states:

- what it does: “Review photo copies before you remove them”;
- who it is for: people with photos across several drives who fear removing
  their only meaningful copy;
- what to click: **Try it with sample data**;
- what happens next: “Opens three ready-to-review groups.”

The one-click action opened `/demo`, with the persistent “Demo — sample data,
nothing is saved” banner, **Reset demo**, **Start for real**, three groups, and
eight records. The cold page made only same-origin requests and logged no
console or page errors. Evidence: `live-first-read.png` and
`live-first-read.mjs`.

## Claims gate

**PASS — 23/23.** `.factory/claims.json` exists. After `npm ci`, every listed
test command was run exactly as written before broader QA. All exited 0:

`demo-isolated`, `match-evidence`, `csv-export`, `reversible-plan`,
`review-before-move`, `local-privacy`, `no-ad-tracking`,
`native-local-privacy`, `license-request-privacy`, `no-account`,
`free-scan-limit`, `free-safety-tools`, `paid-license`, `paid-checkout`,
`licensed-scan-limit`, `offline-reload`, `native-matching`, `scan-scope`,
`cross-drive-safety`, `installer-checksum`, `windows-installer-checksum`,
`checksummed-downloads-only`, and `package-signing-status`.

Each manifest id has exactly one matching `@claim:<id>` marker. The live page
and README contain no uncovered material product claim. The prior flaky paths
also passed inside both complete test runs.

## Clean-checkout tests and builds

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 66 packages, zero audit vulnerabilities |
| Every `.factory/claims.json` command | PASS — 23/23 |
| `CI=1 npm test` | PASS — Rust 11/11, Vitest 12/12, Playwright 33/33 using one worker |
| `npm test` | PASS — Rust 11/11, Vitest 12/12, Playwright 33/33 using one worker |
| `npm run check` | PASS — TypeScript, rustfmt, and Clippy with warnings denied |
| `npm run build` | PASS — exact static build created `dist/site` |
| `CI=true npm run build:desktop -- --bundles deb,rpm` | PASS after installing the Linux prerequisites declared in the release workflow |

The first native package attempt stopped only because the clean worker lacked
GTK/WebKit development packages. Installing the workflow's documented
`libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, and `patchelf`
dependencies made the unchanged build pass.

The resulting local packages are:

```text
2199f6a8a2286ca4f75282b781b482b107539c9831d70070951689695c3c9c3a  Proof Pile_0.1.22_amd64.deb
19991ec6c6b3264fef6fd79e78a191da87b9cb858cb0602748b6422260c0aaa0  Proof Pile-0.1.22-1.x86_64.rpm
```

DEB metadata is `proof-pile` version `0.1.22`, architecture `amd64`. A fresh
DEB extraction ran under Xvfb for eight seconds (expected timeout exit 124),
confirming that the clean consumer could start it.

## End-to-end behavior and recovery

**PASS.** The independent live browser flow covered the normal, boundary,
invalid, cancellation, persistence, and recovery paths:

- all three evidence group types and all eight sample records were present;
- attempting to quarantine the group's only kept copy was rejected and left a
  zero-file plan;
- **Mark exact extras** created a two-file plan;
- cancelling retained that plan, while the confirmation named both the count
  and `/Sample drive/Proof Pile Quarantine`;
- accepting moved two sample records, and CSV export contained its header plus
  eight data rows and recovery destinations;
- reload retained the recovery record; the restore dialog focused **Cancel**,
  Escape dismissed it, and a later restore completed;
- native tests covered the 1,000/1,001 scan boundary, exact/visual/time
  matching, selected-folder scope, byte/date/metadata preservation,
  cross-drive copy-before-remove, collision avoidance, and hostile recovery
  input.

Evidence: `verification-19-artifacts/live-browser.json` and the accompanying
desktop/mobile screenshots.

## Accessibility, mobile, privacy, PWA, and response policy

- `/opt/fleet/lib/verify-url.sh` passed the live root and demo: correct title,
  `lang=en`, one h1, one main, no missing alt text, and no browser errors.
- Live desktop and 390 px dark mobile Axe scans found zero serious/critical
  findings. The complete local suite also covers all routes in light and dark.
- Keyboard checks passed route-heading focus, the skip link, Arrow-key group
  selection, Space-key decisions with focus advancement, and dialog Escape.
  The sampled focus ring was a visible 3 px solid blueprint-blue outline.
- At 390 px, the review did not overflow; the primary review action measured
  316 × 44.39 px. Simulated 200% text also had no horizontal overflow.
- Reduced-motion media reduced the photo transition to `1e-05s` and nothing
  looped.
- The complete live review made no off-origin request and logged no console or
  page error. No advertising, tracking script, CDN font, or photo upload was
  observed.
- The service worker controlled `/demo`, had no waiting update, and returned a
  200 offline reload with all three groups.
- `/`, `/demo`, `/app`, `/privacy`, and `/terms` returned 200 with route-specific
  titles and valid landmarks. A new unknown route returned a real styled 404.
- Internal links returned 200; fragment navigation and focus passed; mail and
  external links were explicit.
- HTML and `sw.js` use a 30-second revalidation policy. Hashed JS/CSS use
  `max-age=31536000, immutable`. A conditional root request returned 304.
- Responses include CSP with header-only `frame-ancestors 'none'`, HSTS,
  `nosniff`, strict-origin referrer policy, and disabled camera, microphone,
  and geolocation.

The product has no sign-in, so the Entra tenant requirement is not applicable.
It has no product backend or shared database; demo state is session-only and
desktop state is local. Invalid license verification returned 200 with
`Cache-Control: no-store` and the expected product-origin CORS header for
requests 1–30. Request 31 returned 429 with `Retry-After: 2`; the observed
allowance is 30 requests per client window. Hosted checkout returned 303 to
Dodo's checkout host.

## Performance

The production build contains 43,387 raw bytes of application JavaScript
(15,218 bytes combined gzip), 18,644 bytes of CSS (5,104 bytes gzip), no web
fonts, and a 29,922-byte hero image. These are below the specified budgets.

Lighthouse mobile on the live root:

| Category/metric | Result |
| --- | ---: |
| Performance | 99 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.905 s |
| LCP | 1.055 s |
| TBT | 142.5 ms |
| CLS | 0 |
| Transfer | 140,809 bytes |

Evidence: `verification-19-artifacts/lighthouse-root.json`.

## Exact live and release identity

**PASS.** A fresh `npm run build` was compared against the live host. All 27
served build files matched byte-for-byte, including HTML, hashed JavaScript and
CSS, source maps, images, installers, manifest, and `sw.js`. The main bundle is
`assets/index-Bc2u97bG.js`, SHA-256
`c7d396feb087962ae5900854bc86e7ad8dc70060ea70e777b0def96524be0dda`.

The public `v0.1.22` release was built by successful workflow run
`33299505299` from tagged runtime source
`a95500f2997f86fe07910b10fe966242d9dfdbd1`. There is no runtime/product diff
between that tag and candidate `59c0e5a`; later candidate changes are tests and
factory evidence only. The live release picker exposed both macOS
architectures, Windows, and Linux without console errors. The release contains
12 assets, including DMG, MSI/EXE, AppImage/DEB/RPM, `SHA256SUMS`,
`latest.json`, and `DESKTOP_PACKAGE_STATUS.json`. The status truthfully records
macOS and Windows as unsigned.

A fresh download of the 78,580,216-byte AppImage matched its published SHA-256:

```text
a8e863b7cde64438eaec9b2c1ae7482f33217d46d01b54f48e85980f08797f80
```

The live Linux installer installed that same checksummed AppImage into a new
temporary bin directory. It was executable and remained running through an
eight-second Xvfb smoke window (expected timeout exit 124).

## Findings by severity

### Severity 1 — release blocking

None.

### Severity 2 — material

None.

### Severity 3 — documentation

`.factory/copy-audit.md` remains stale. It records footer version `v0.1.19`,
the removed signed-download copy, and the old `verified-downloads-only` claim
name instead of the live v0.1.22 checksum/package-status wording. The shipped
copy itself passed first-read, claim coverage, sentence-length, and banned-word
checks; this internal audit drift does not change product behavior.

## Final decision

**PASS — candidate `59c0e5a5d1b408010abf6d6f9a72cbaba58a680d` matches the live product and satisfies the acceptance contract.**
