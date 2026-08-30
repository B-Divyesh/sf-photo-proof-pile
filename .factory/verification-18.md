# Independent product verification 18 — FAIL

Date: 30 August 2026 (UTC)

- Candidate: `5407563dc090a7d7ee90306eeb4bd92c34702991`
- Branch: `main`; the checkout began clean and matched `origin/main`.
- Live URL: <https://photo-proof-pile.sociobot.in>
- Demo URL: <https://photo-proof-pile.sociobot.in/demo>
- Product/release version: `0.1.22`
- Artifact class: Tauri desktop app with an offline web demo
- Overall result: **FAIL**

No product code was changed during verification. The prior deployment-only
release failure is fixed: v0.1.22 packages exist and the live site matches the
candidate. The candidate still fails the required local quality gate because
the default `npm test` command failed on both independent runs.

## Release-blocking finding

### Severity 1 — the required `npm test` gate is not reliable and did not pass

The repository's exact default test command failed twice from this checkout:

1. First run: 32/33 Playwright tests passed. `pages meet the automated
   accessibility baseline in light and dark presentations` exceeded the
   configured 30-second test timeout at 32.6 seconds.
2. Second run: 31/33 Playwright tests passed. The same accessibility test
   timed out at 33.0 seconds. In addition,
   `@claim:review-before-move requires reviewed choices and confirms the exact
   destination` failed with `dialog.accept: Cannot accept dialog which is
   already handled!`, then could not find the expected completion message.

The accessibility test passed by itself in 13.0 seconds, and
`npm run test:e2e -- --workers=1` passed all 33 tests in 1.2 minutes. That
narrows the failure to the suite's default fully parallel configuration; it
does not make the required default gate green. A claim-tagged test also failed
during the second default run. This violates the acceptance contract that
`npm test` passes locally and makes this candidate unreleasable.

## Mandatory first-read and demo gate

**PASS.** A fresh 1440 x 900 browser context showed, above the fold:

- what it does: “Review photo copies before you remove them”;
- who it is for: people with photos across several drives who fear removing
  their only meaningful copy;
- what to click: **Try it with sample data**;
- what happens next: “Opens three ready-to-review groups.”

The one-click action opened `/demo`, which immediately showed the persistent
“Demo — sample data, nothing is saved” banner, **Reset demo**, **Start for
real**, three realistic match groups, and eight photo records.

## Claims gate

**PASS for the mandated isolated invocations — 23/23.** `.factory/claims.json`
exists. After `npm ci`, every listed command was run exactly before broader QA:

`demo-isolated`, `match-evidence`, `csv-export`, `reversible-plan`,
`review-before-move`, `local-privacy`, `no-ad-tracking`,
`native-local-privacy`, `license-request-privacy`, `no-account`,
`free-scan-limit`, `free-safety-tools`, `paid-license`, `paid-checkout`,
`licensed-scan-limit`, `offline-reload`, `native-matching`, `scan-scope`,
`cross-drive-safety`, `installer-checksum`, `windows-installer-checksum`,
`checksummed-downloads-only`, and `package-signing-status` each exited 0.
Every manifest id has exactly one `@claim:<id>` marker in the test sources.

The later default full-suite failure of `@claim:review-before-move` is the
nondeterministic release-blocking defect described above.

## Clean-checkout builds and checks

- `npm ci`: PASS — 66 packages installed; zero audit vulnerabilities.
- `npm run check`: PASS — TypeScript, rustfmt, and Clippy with warnings denied.
- `npm run build`: PASS — exact static production build created `dist/site`.
- `CI=true npm run build:desktop -- --bundles deb,rpm`: PASS after installing
  the Linux GTK/WebKit packages declared in the repository's release workflow.
  The initial attempt stopped only because those host packages were absent.
- Local DEB: 4,106,042 bytes, SHA-256
  `25777078b24d7f758c33ff7da5fada57598e49dc63b4d98f9312ff40772fb369`.
- Local RPM: 4,107,021 bytes, SHA-256
  `05d919aaac8d39e80f6f2e1609c78c54cf2ce5555c9fa0c3beed86e927d1f197`.
- The DEB metadata reports package `proof-pile`, version `0.1.22`, architecture
  `amd64`.

## End-to-end behavior and recovery

The live demo passed the smallest useful workflow in a fresh browser:

- all exact-copy, same-moment, and looks-alike groups and all eight records
  were present with paths and evidence;
- attempting to quarantine without retaining a copy was rejected and left a
  zero-file plan;
- **Mark exact extras** produced a two-file plan;
- cancelling preserved the plan, and confirmation named both the exact count
  and `/Sample drive/Proof Pile Quarantine`;
- accepting the plan moved two sample files and produced immediate feedback;
- CSV export contained one header and eight data rows;
- reload retained recovery records; the recovery dialog focused its safe
  action, Escape dismissed it, and focus behavior remained usable;
- a malformed recovery CSV was rejected; importing the exported CSV restored
  two verified recovery records, and restore succeeded.

Native tests additionally passed the 1,000/1,001 free and licensed scan
boundaries, selected-folder scope, grouping, copy-before-remove behavior,
metadata/date/byte preservation, collision avoidance, hostile recovery paths,
and restored-record validation.

## Live privacy, security, PWA, and accessibility

- The complete demo flow made only same-origin requests. No photo data,
  advertising, tracking script, CDN font, console error, or page error was
  observed. The release picker contacted only GitHub's documented API after an
  explicit click.
- Root, demo, privacy, terms, app, and a genuine 404 had the expected status,
  route title, `lang=en`, one h1, one main landmark, canonical metadata, and no
  missing image alt text.
- `/opt/fleet/lib/verify-url.sh` passed both live `/` and `/demo` with no
  browser errors.
- Ten fresh Axe runs covering `/`, `/demo`, `/privacy`, `/terms`, and the real
  404 in light and dark modes found zero serious or critical issues. A separate
  390 px demo scan also found zero.
- Keyboard checks passed the skip link, a visible 3 px primary-action focus
  outline, decision controls, dialog safe-action focus, Escape dismissal, and
  group navigation.
- At 390 px, `/`, `/demo`, `/app`, `/privacy`, `/terms`, and `/404.html` had no
  horizontal overflow or visible target below 44 px. The same routes retained
  content at a simulated 200% text size.
- Reduced-motion media produced a `0.00001s` card transition and no animation.
- Service worker `proof-pile-v19` was activated and controlling the demo with
  no waiting worker. An explicit update completed, and offline reload returned
  200 with all three sample groups.
- Live responses include HSTS, CSP with `frame-ancestors 'none'`, `nosniff`,
  strict-origin referrer policy, and disabled camera/microphone/geolocation.
  HTML and `sw.js` cache for 30 seconds; hashed JS/CSS are immutable for one
  year. An ETag conditional root request returned 304.
- The product has no sign-in, so the Entra tenant requirement is not
  applicable.

## Billing allowance and deployment identity

- Invalid-license verification returned `200` JSON with `Cache-Control:
  no-store` and the product origin's CORS header for requests 1–30. Request 31
  returned `429` with `Retry-After: 4`. The observed allowance is 30 requests
  per client window.
- Hosted checkout returned `303` to Dodo's checkout host.
- A fresh local production build matched all 27 deployed non-configuration
  files byte for byte, including source maps and `sw.js`.
- Candidate commits after release source
  `a95500f2997f86fe07910b10fe966242d9dfdbd1` change only `.factory` evidence
  and handoff documentation; no product file differs.

## Performance and distribution

- Lighthouse mobile retry: performance 96, accessibility 100, best practices
  100, SEO 100; FCP 0.93 s, LCP 1.08 s, TBT 230 ms, CLS 0, transfer 95,659
  bytes. A sampled mobile interaction duration was 24 ms.
- Built application JavaScript totals 43,387 bytes raw; CSS is 18,644 bytes;
  there are no downloaded fonts; the hero image is 29,922 bytes.
- Public release `v0.1.22` contains both macOS architectures, Windows MSI/EXE,
  Linux AppImage/DEB/RPM, app archives, `SHA256SUMS`, `latest.json`, and
  `DESKTOP_PACKAGE_STATUS.json`. The successful release workflow is run
  `33299505299`.
- The live download dialog exposed four v0.1.22 platform choices with no
  console errors and accurately described checksum/package-status handling.
- In a fresh `XDG_BIN_HOME`, the live Linux installer installed the
  78,580,216-byte AppImage. Its SHA-256 was the published
  `a8e863b7cde64438eaec9b2c1ae7482f33217d46d01b54f48e85980f08797f80`.
  The extracted public app stayed running for an eight-second Xvfb smoke
  window (expected timeout exit 124).

## Other findings

### Severity 2 — material

None found in the exercised product behavior.

### Severity 3 — documentation drift

`.factory/copy-audit.md` is stale. It still records footer version `v0.1.19`,
old signed-download wording, and the removed `verified-downloads-only` claim
name instead of the current v0.1.22 checksum/package-status wording. The live
copy itself is plain and the current claims manifest covers its material
claims, but the mandatory audit no longer reproduces the shipped copy.

## Final decision

**FAIL — candidate `5407563dc090a7d7ee90306eeb4bd92c34702991` is not
releasable until the exact default `npm test` command passes reliably from a
clean checkout.**
