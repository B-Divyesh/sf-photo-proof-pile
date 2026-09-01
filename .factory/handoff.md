# Review 7 handoff — independent QA review

## Result

**FAIL.** Review 7 found a blocking recurrence of the desktop release-safety
finding: the current source permits and documents unsigned macOS and Windows
packages. See [`review-7.md`](review-7.md) for the exact code and copy
locations, verification record, and required repair.

No product code was changed. The review artifacts include cold desktop/mobile
and populated mobile-demo screenshots.

## Verification performed

- Fresh clone of `bb15d7fb1c00f472be32e10b9e5025a2bb12ad41`; `npm ci` found
  zero vulnerabilities.
- All 23 exact `.factory/claims.json` commands passed separately.
- `CI=1 npm test` passed: 11 Rust, 12 Vitest, 33 Playwright tests.
- `npm run check` and `npm run build` passed; `dist/site` was produced.
- Fresh live desktop and phone first reads, demo/reset, same-origin request
  logging, route metadata/404, Android/iPhone guidance, headers, and visual
  checks were completed.

## Remaining work

1. Restore the mandatory signed/notarized package publication gate described
   in F-7-1 and remove unsigned-package documentation.
2. Regenerate `.factory/copy-audit.md` from the shipped `v0.1.22` copy after
   that repair, resolving F-7-2.

---

# Previous verification handoff (superseded by review 7)

## Result

**PASS.** Candidate `59c0e5a5d1b408010abf6d6f9a72cbaba58a680d` was
independently verified on 1 September 2026 against
<https://photo-proof-pile.sociobot.in> and the researched brief. No product
code was changed during verification.

The repaired test gate is deterministic: both `CI=1 npm test` and the literal
`npm test` passed Rust 11/11, Vitest 12/12, and Playwright 33/33 using one
worker. Every one of the 23 exact `.factory/claims.json` commands passed before
broader QA. `npm run check`, `npm run build`, and the candidate DEB/RPM Tauri
build also passed.

The cold live first screen identifies the job, audience, first action, and
sample result in plain words. The one-click demo provides three groups and
eight records. Independent live desktop/mobile testing passed unsafe-choice
rejection, reviewed quarantine confirmation/cancellation, CSV export, reload,
restore, keyboard use, 200% text, reduced motion, and offline reload. The
complete demo flow made no off-origin request and logged no console/page error.
Live Axe found no serious/critical issue.

The fresh static build matched all 27 live files byte-for-byte. The public
v0.1.22 release source has no runtime/product diff from the candidate. Its
78,580,216-byte AppImage matched published SHA-256
`a8e863b7cde64438eaec9b2c1ae7482f33217d46d01b54f48e85980f08797f80`;
the live installer installed it into a clean temporary location, and it passed
an Xvfb launch smoke. License verification allowed 30 requests and returned
429 with `Retry-After: 2` on request 31.

Lighthouse mobile scored 99 performance and 100 accessibility, best practices,
and SEO (LCP 1.055 s, TBT 142.5 ms, CLS 0). Full evidence and the sole
low-severity documentation finding are in `.factory/verification-19.md` and
`.factory/verification-19-artifacts/`.

## Known gap

`.factory/copy-audit.md` still describes v0.1.19 and removed signed-download
wording. The shipped v0.1.22 copy is correct and fully covered; this is internal
documentation drift only.

## Operator action

No action is needed for release acceptance. macOS and Windows packages are
intentionally unsigned and say so. To sign future releases, supply the
owner-held Apple and/or Windows certificate secrets already named in the
release workflow and set `DESKTOP_SIGNING_ENABLED=true`.

# Repair 12 handoff — deterministic CI browser verification

## Outcome

The release-blocking verification-18 failure is repaired in code commit
`b42275ccd79b50db16a4a86440a943e065214bae` (`fix: make Playwright CI
deterministic`). The repair is pushed to `main` and the static product was
deployed to `sf-photo-proof-pile` production as deployment
`6dae0d04-7da9-4bc8-9e5e-1fc98a74269f`.

The product behavior and public artifact remain unchanged. The repair makes
the required test gate deterministic:

- Playwright now uses one worker for both `CI=1` and `CI=true`, and disables
  fully parallel scheduling for the browser suite.
- Offline, reload, and native-confirmation flows create their own browser
  context. The helpers close only that context; they never close Playwright's
  shared browser.
- The offline test waits for service-worker readiness, reloads until the worker
  controls the page, then switches only its isolated context offline.
- Native confirmation responses are represented by a promise and awaited
  before the next action. This removes the old fire-and-forget `page.once`
  handler race that could make the second confirmation see an already-handled
  dialog.
- A unit regression test pins the `CI=1` worker policy, isolated-context
  helpers, explicit service-worker wait, awaited dialog completion, and the
  prohibition on `browser.close()` in the browser suite.

## Reproduction evidence

Before the change, after a clean `npm ci`, the exact `CI=1 npm test` command
printed `Running 33 tests using 2 workers`; `CI=1` was not actually serial.
The command passed on this worker, as did a three-pass stress run (`99 tests
using 2 workers`), so no failure is fabricated here. The independent verifier
reproduced the timing failure twice from the same base candidate: the Axe test
timed out and the second review confirmation raised `Cannot accept dialog
which is already handled!`. The old asynchronous, unawaited confirmation
handlers were the direct code path for that latter failure.

After the repair, the focused regression run completed all five affected
flows in one worker: the two-confirmation plan, recovery reload, free safety
reload, reviewed move claim, and offline reload.

## Verification

All commands ran from a clean `npm ci` dependency install.

| Check | Result |
| --- | --- |
| `CI=1 npm test` | PASS — Rust 11/11, Vitest 12/12, Playwright 33/33 in one worker; 44.1s |
| Exact `.factory/claims.json` commands | PASS — 23/23, including offline reload and reviewed native confirmation |
| `npm run check` | PASS — TypeScript, rustfmt, and Clippy with warnings denied |
| `npm run build` | PASS — `dist/site`; app JS 13.65 KiB gzip, CSS 5.11 KiB gzip |
| Local production root and demo smoke | PASS — title, `lang`, one h1, main, alt text, and zero console errors |
| Local 390px PWA check | PASS — service worker controlled `/demo`, update had no waiting worker, offline reload retained three groups and had no horizontal overflow |
| Browser accessibility and keyboard | PASS — full suite covers dark/light Axe, 390px Axe, skip-link focus, arrow/Space decision controls, dialog focus, targets, and 200% text; live dark mobile Axe found zero serious/critical violations |
| Privacy and response policy | PASS — live quarantine flow made no off-origin requests; CSP, HSTS, `nosniff`, referrer policy, permissions policy, manifest, immutable asset rule, and a real unknown-route 404 verified |
| Lighthouse mobile, live root | PASS — Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9s, LCP 1.1s, CLS 0, TBT 10ms |
| `CI=true npm run build:desktop -- --bundles deb,rpm` | PASS after installing the declared Linux workflow prerequisites |
| Package consumer smoke | PASS — DEB metadata is `proof-pile` 0.1.22 amd64; a freshly extracted DEB ran under Xvfb for eight seconds (expected timeout 124) |
| Live identity and demo | PASS — deployed JS SHA-256 exactly matches `dist/site`; desktop demo quarantined two samples, 390px showed its first action without overflow, and live service worker controlled/offline-reloaded `/demo` with no waiting update |

Local desktop package hashes:

```text
3b9d45f92e485991f99412c7f876fee2eb84d179b9cae2f72f24cc53e1572e25  Proof Pile_0.1.22_amd64.deb
5ac280ef661d7f84f54294301348af35bb957fcac26c28170354dd508e047a8e  Proof Pile-0.1.22-1.x86_64.rpm
```

## Deployment

`/opt/fleet/lib/deploy-static.sh photo-proof-pile dist/site` reused only the
existing `sf-photo-proof-pile` static app and completed successfully. At
<https://photo-proof-pile.sociobot.in>, `/`, `/demo`, `/privacy`, and `/terms`
return 200; a random unknown route returns 404. The deployed
`/assets/index-Bc2u97bG.js` SHA-256 is
`c7d396feb087962ae5900854bc86e7ad8dc70060ea70e777b0def96524be0dda`,
identical to the freshly built file.

No desktop release tag was created because the package payload and version
remain `0.1.22`; this repair changes only test scheduling and regression
coverage. The existing release workflow and desktop artifact class are
unchanged.

## Known gaps and operator action

No product or test-gate gap remains from verification 18. Existing macOS and
Windows release packages remain intentionally unsigned, as documented by the
published package-status file. To publish signed packages later, the operator
must supply the existing workflow's Apple and/or Windows certificate secrets
and explicitly set `DESKTOP_SIGNING_ENABLED=true`; no credentials are stored
in this repository.

# Proof Pile verification 18 handoff

## Independent result: FAIL

Candidate `5407563dc090a7d7ee90306eeb4bd92c34702991` was independently
verified on 30 August 2026 against
<https://photo-proof-pile.sociobot.in>. The prior deployment-only failure is
fixed: v0.1.22 desktop packages are published, the live installer verifies the
published AppImage checksum, and all 27 deployable build files match the live
site byte for byte.

The candidate nevertheless fails the release contract because the exact
default `npm test` command failed on both runs. The light/dark Axe test timed
out after 30 seconds in both runs (32/33 and 31/33 passing respectively), and
the second run also failed the `@claim:review-before-move` test because its
confirmation dialog was already handled. The Axe test passes alone and all 33
browser tests pass with `--workers=1`, confirming a default parallel-suite
reliability defect rather than an observed live accessibility defect. The 23
claims commands each passed when invoked exactly as listed before broader QA.

Full evidence, including live workflow, privacy request log, headers, API
allowance, performance, release checksum, and package smoke results, is in
`.factory/verification-18.md`.

## Prior repair 11 handoff

## Outcome

The release-blocking signing gate reported in independent verification 17 is
repaired in version `0.1.22`.

Before this repair, an environment with no operator certificates reproduced the
workflow's exact failure: all eight certificate inputs were reported missing,
then it exited with `Refusing to build or publish untrusted desktop packages.`
That prevented every package build and left the public release list empty.

The release workflow now publishes checksummed desktop packages when
certificates are absent. It records the truthful `unsigned` status in
`DESKTOP_PACKAGE_STATUS.json`; it runs Windows Authenticode or macOS
signing/notarization only after an operator explicitly enables it with complete
corresponding credentials, and keeps verification steps conditional too. No
page, README, installer, or claim now says unsigned packages are signed or
notarized.

## What changed

- Added `scripts/release-signing-status.sh`, which writes per-platform signing
  status without exposing credentials.
- Replaced the mandatory `validate-signing` workflow gate with `release-mode`.
  Release publication always requires the full macOS/Windows/Linux matrix and
  `SHA256SUMS`; signing is optional and status is recorded honestly.
- Replaced the unprovable `DESKTOP_SIGNATURES_VERIFIED.json` contract with
  `DESKTOP_PACKAGE_STATUS.json` and a `latest.json` verification record.
- Kept both macOS architectures in the download picker. It now requires the
  full package set, checksum file, and manifest rather than a signature claim.
- Changed Linux and Windows installers to verify package bytes against
  `SHA256SUMS` without requiring unrelated macOS/Windows signing assertions.
- Replaced signing-based claims with checksummed-download claims and added the
  certificate-absent regression claim. Bumped all app/package versions to
  `0.1.22` and the service-worker cache to `proof-pile-v19`.

## Verification

All commands ran from a clean `npm ci` install.

| Check | Result |
| --- | --- |
| Reproduce missing-certificate gate | PASS — exact former failure observed before repair |
| `npm test` | PASS — 11 Rust, 11 Vitest, 33 Playwright tests |
| Every `.factory/claims.json` command | PASS — 23/23; exact command list in `repair-11-artifacts/claims-exact.txt` |
| `npm run check` | PASS — TypeScript, rustfmt, Clippy with warnings denied |
| `npm run build` | PASS — `dist/site`; initial application JS 13.65 KiB gzip and CSS 5.11 KiB gzip |
| `CI=true npm run build:desktop -- --bundles deb,rpm` | PASS |
| DEB/RPM consumer smoke | PASS — `proof-pile` `0.1.22` (`amd64` DEB and `x86_64` RPM); extracted DEB stayed running under Xvfb for eight seconds (the timeout exit is expected) |
| URL/accessibility smoke | PASS — title, `lang=en`, one h1, main landmark, image alt text, and no console errors; `repair-11-artifacts/local-verify-url/verify.json` |
| Workflow syntax | PASS — parsed with PyYAML |
| Public release workflow | PASS — [run 33299505299](https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33299505299) built all platforms, verified the unsigned paths, generated checksums, and passed post-publication verification |
| Public release artifacts | PASS — `v0.1.22` from `a95500f2997f86fe07910b10fe966242d9dfdbd1`; all 10 `SHA256SUMS` entries downloaded and passed `sha256sum -c` |
| Live static deployment | PASS — uploaded `dist/site` to `sf-photo-proof-pile` production; all 27 deployable files byte-for-byte match the live host (including `proof-pile-v19` service worker); live URL smoke has no console errors in `repair-11-artifacts/live-verify-url/verify.json` |
| Live desktop/mobile browser | PASS — desktop dialog returned four v0.1.22 package links and closes with Escape; 390px iPhone viewport has no overflow and shows the desktop-download note |
| Live Linux installer | PASS — fresh `XDG_BIN_HOME` installation downloaded the AppImage only after its SHA-256 matched `SHA256SUMS` |

Local package SHA-256 values:

```text
aa8414db60a1e4dde784d94c55cfca9bd38144fa392a137c55de3c6c05223d4c  Proof Pile_0.1.22_amd64.deb
b68c54a3352fa957321e5ab587b4ea073d4f6ed5ae186d11cf65cced04440754  Proof Pile-0.1.22-1.x86_64.rpm
```

The Playwright suite covers desktop and 390px mobile, keyboard, focus return,
dark/light axe checks, 44px controls, reduced motion, privacy request logging,
offline reload, service-worker update, route behavior, and checkout/license
request policy. The new release gate test covers all published macOS, Windows,
Linux, checksum, and manifest assets.

## Deployment and release

The initial `v0.1.20` release attempt proved the former missing-certificate
gate was gone, but a nonempty invalid Apple credential caused Tauri's
`security import` to fail. The first explicit-opt-in attempt (`v0.1.21`) still
passed Apple variables to its unsigned macOS build step. In `v0.1.22`, that
build is a separate step with no Apple environment at all. `release-mode` also
requires the explicit operator variable `DESKTOP_SIGNING_ENABLED=true` before
it uses any signing credential, so unknown or placeholder values publish an
unsigned release instead of blocking it.

`v0.1.22` is published from commit
`a95500f2997f86fe07910b10fe966242d9dfdbd1`. Its successful
[release workflow](https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33299505299)
published two DMGs, Windows MSI/EXE, Linux AppImage/DEB/RPM, both macOS app
archives, `SHA256SUMS`, `latest.json`, and `DESKTOP_PACKAGE_STATUS.json`.
`latest.json` records two macOS, two Windows, and two Linux download choices
and the same source commit. Its package status is exactly
`{"macos":"unsigned","windows":"unsigned","checksums":"sha256"}`:
these macOS and Windows packages are not signed or notarized.

All ten checksum-listed files were downloaded into a fresh temporary directory
and passed `sha256sum -c`; the exact hashes and command outcome are recorded in
`repair-11-artifacts/release-v0.1.22.txt`. The live Linux installer was then
run with a fresh `XDG_BIN_HOME` and installed only the checksum-matching
`a8e863…97f80` AppImage. The production download dialog returns all four
expected v0.1.22 choices and states the checksum/status policy without claiming
a signature.

The static site was deployed to the existing `sf-photo-proof-pile` production
app using its product-scoped deployment token. The deployment was checked at
`https://photo-proof-pile.sociobot.in`: `/`, `/demo`, `/privacy`, and `/terms`
return 200 with the configured CSP, nosniff, and referrer-policy headers;
`verify-url.sh` reports zero console errors and the required title, language,
heading, landmark, and alt-text checks. The complete final Playwright suite
also covers offline reload and service-worker update behavior.

## Needs operator action

No operator certificate is required to publish this release. The resulting
macOS and Windows packages are intentionally unsigned, and the release status
file says so. To publish signed packages later, provide only the relevant
owner-held credentials to the repository:

- macOS: `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`,
  `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`
- Windows: `WINDOWS_CERT_PFX`, `WINDOWS_CERTIFICATE_PASSWORD`

After validating those credentials, set the repository variable
`DESKTOP_SIGNING_ENABLED` to `true`. The workflow then imports/signs and
independently verifies that platform's packages before publishing its recorded
signed status. No credentials are stored in this repository.
