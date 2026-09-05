# Verify reversible photo cleanup and desktop installability — Verification 27

Verified 5 September 2026 UTC against
<https://photo-proof-pile.sociobot.in>.

- Work order: `photo-proof-pile-verify-27`
- Implementation reviewed: `b12d5727de44d71c91b4a496eece320e7247a853`
- Documentation checkout: `68d676a8997c07a1f58c9c7206f42f3cd172a7e4`
- Intended desktop release: `v0.1.30`
- Observed live build: `v0.1.29` at `68d676a8997c07a1f58c9c7206f42f3cd172a7e4`
- Verdict: **FAIL**
- Findings: **3** — one Severity 1 and two Severity 3
- Untested claims: **0**

## Verdict

**FAIL — the live site cannot install the reviewed desktop release.**

The complete public `v0.1.30` release correctly targets implementation
`b12d5727…`, and its packages pass their published checksums. Production has
since been replaced by an ordinary `v0.1.29` build stamped with documentation
SHA `68d676a…`. The download dialog requests `v0.1.29`, offers no package, and
both live installers require the nonexistent pair `v0.1.29` at `68d676a…`.
The documented Linux command exits 1 without installing anything.

The core review workflow, all 25 claim commands, the full local suite, the
public `v0.1.30` package, accessibility, privacy, offline behavior, API
allowance, and performance passed. Those passes do not make the broken live
install path acceptable for a desktop product.

## Findings

### Severity 1 — production does not offer the reviewed desktop release

Fresh, uncached checks consistently showed:

- The live footer says `v0.1.29 · source 68d676a8997c`.
- The dialog requests GitHub release tag `v0.1.29`, says downloads are being
  published, and exposes zero `Download for …` links.
- Live `install.sh` requires `v0.1.29` at `68d676a…`; the isolated install
  exited 1 with “The published Linux package does not match this site build.”
- Live `install.ps1` has the same wrong expected tag and source pair.
- A clean build stamped with `68d676a…` matched all 27 deployed files. This
  proves the live state is the ordinary source build, not stale browser data.
- The repository deployment verifier rejects that same build for the intended
  release: “Linux installer release tag does not match v0.1.30.”

The public release is not defective. GitHub `v0.1.30`, its tag target, and
`latest.json.commit` all name `b12d5727…`. The release has two macOS DMGs,
Windows MSI and EXE, Linux AppImage, DEB and RPM, `SHA256SUMS`, and
`latest.json`. Every package matched its published checksum.

Required resolution: deploy the `release-site` artifact from successful run
`33596875103`, then prevent a later documentation build from replacing that
immutable artifact. Recheck that the footer names `v0.1.30` and `b12d5727…`,
the dialog exposes four platform choices, and both installer scripts require
the same release identity.

Evidence: `verification-27-artifacts/live-qa.json`, `live-downloads.png`, and
`deployment-parity.json`.

### Severity 3 — one claim has two tagged tests

The claims contract requires exactly one tagged test for each claim.
`desktop-release-identity` appears on both:

- `tests/app.spec.ts:739`
- `tests/model.test.ts:308`

Both tests pass, so the public claim is tested and the untested-claim count is
zero. Keep one canonical `@claim:desktop-release-identity` tag and leave the
other test untagged or give it a separate registered claim.

### Severity 3 — the checked-in copy audit does not describe the intended release

`.factory/copy-audit.md` still says it audits `v0.1.29` and records
“v0.1.29 is ready from this source.” The accepted desktop candidate is
`v0.1.30` at `b12d5727…`. Regenerate the audit from the immutable release-site
copy after restoring that deployment. This is the same documentation-drift
family reported in verification 18.

## First screen and sample review

Fresh desktop Chromium at 1440 × 900 and a fresh Android browser profile at
390 × 844 showed these items before scrolling:

- Job: “Review photo copies before you remove them.”
- Audience: people with photos across several drives who fear removing the
  only meaningful copy.
- First action: “Try it with sample data.”
- Result beside the action: “Opens three ready-to-review groups.”

The action opened `/demo` in one keyboard activation. The next screen already
contained three realistic groups and eight files. The persistent label read
“Demo — sample data, nothing is saved” and kept **Reset demo** and **Start for
real** visible.

The independent flow seeded a real-review sentinel, changed the sample,
rejected an unsafe choice, quarantined two reviewed copies after an exact
count-and-destination confirmation, exported nine CSV rows, reloaded recovery
state, opened Restore with focus on Cancel, reset, rejected an invalid CSV,
and left the demo. The real sentinel never changed. Reset and exit removed
only `demo:photo-proof-pile:session`. All demo requests were same-origin.

## Declared claims

From a separate clean clone at documentation SHA `68d676a…`, `npm ci`
installed 66 locked packages with zero reported vulnerabilities. Every exact
command in `.factory/claims.json` then passed:

| Claim | Result |
| --- | --- |
| `demo-isolated` | PASS |
| `match-evidence` | PASS |
| `csv-export` | PASS |
| `reversible-plan` | PASS |
| `review-before-move` | PASS |
| `local-privacy` | PASS |
| `no-ad-tracking` | PASS |
| `native-local-privacy` | PASS |
| `license-request-privacy` | PASS |
| `no-account` | PASS |
| `free-scan-limit` | PASS |
| `free-safety-tools` | PASS |
| `paid-license` | PASS |
| `license-verification-allowance` | PASS |
| `paid-checkout` | PASS |
| `licensed-scan-limit` | PASS |
| `offline-reload` | PASS |
| `native-matching` | PASS |
| `scan-scope` | PASS |
| `cross-drive-safety` | PASS |
| `installer-checksum` | PASS |
| `windows-installer-checksum` | PASS |
| `desktop-release-assets` | PASS |
| `desktop-release-identity` | PASS; duplicate tag finding above |
| `unsigned-package-state` | PASS |

No public capability was untested. Landing, demo, privacy, terms, download,
and README statements map to the 25 claims. Evidence is in
`verification-27-artifacts/claims.json`.

## Clean checkout, build, and installed artifact

- `npm run check`: PASS — TypeScript, rustfmt, and warnings-denied Clippy.
- `CI=1 npm test`: PASS — 11 Rust, 22 Vitest, and 37 Playwright tests.
- `BUILD_COMMIT=68d676a… npm run build`: PASS; `dist/site` was produced.
- Built JavaScript: 44,654 bytes raw and 15.61 KiB gzip total.
- Built CSS: 18,640 bytes raw and 5.11 KiB gzip.
- Hero image: 29,922 bytes.
- `CI=true BUILD_COMMIT=b12d5727… npm run build:desktop -- --bundles deb,rpm`:
  PASS after installing the Linux GTK/WebKit prerequisites declared by the
  release workflow. The source checkout builds version 0.1.29 because release
  version 0.1.30 is stamped only inside the release workflow.
- `scripts/verify-published-release.sh`: PASS for `v0.1.30` and
  `b12d5727…`; all seven package files matched `SHA256SUMS`.
- The public Debian package SHA-256 was
  `bc41beaf2535be46bf177974c8f3ab8b62a7140f64fc271424e0981378c4a7e4`.
  It installed in the clean container as `proof-pile 0.1.30 amd64`. The
  installed `/usr/bin/proof-pile` remained running through the eight-second
  Xvfb smoke window. Exit 124 was the expected timeout.

No file under `src/`, `public/`, `src-tauri/`, or `index.html` differs between
implementation `b12d5727…` and documentation SHA `68d676a…`. The later SHA
adds deployment guards, tests, and reports; it does not require a new product
binary. It still must not replace the correctly stamped release-site artifact.

## Browser, accessibility, privacy, and recovery

- `/`, `/demo`, `/app`, `/privacy`, and `/terms` returned 200 with distinct
  titles, `lang=en`, one H1, one main, header/footer landmarks, descriptions,
  canonicals, and complete image alt attributes.
- The deliberate unknown path returned HTTP 404 with the designed site shell,
  return action, and no page exception. Its expected failed-resource console
  message is not a defect.
- Ten live Axe runs covered five routes in light and dark. Serious/critical
  findings: zero. The 404 also had zero serious/critical findings.
- The fleet URL verifier passed `/` and `/demo` with zero console errors.
- Keyboard Enter, Space, ArrowDown, Escape, skip/focus routing, decision focus
  advance, and dialog focus passed. Focus used a visible 3 px outline.
- At 390 px, visible controls were at least 44 px, and all routes plus the 404
  stayed within 390 px at normal and simulated 200% text size.
- Reduced motion shortened the checked transition to `0.00001s`.
- Back restored the landing scroll position from 517 px to 504 px. The
  `/#how` link kept its URL and focused the section heading.
- The service worker controlled `/demo`, had no waiting update, and reloaded
  all three groups offline with HTTP 200. Its internal live cache name is
  `proof-pile-v29`; the earlier handoff's `proof-pile-v0.1.30` detail was not
  accurate, but update and offline behavior pass.
- A full sample review sent no off-origin requests. No advertising, tracking,
  third-party script, third-party font, or photo upload was observed.
- The live license endpoint returned CORS-enabled, `no-store`, invalid-token
  JSON for requests 1–30. Request 31 returned 429 with `Retry-After: 4`.
- The hosted checkout link returned 303. No payment was attempted.
- All rendered non-mail links returned 200, except the intended checkout 303
  and the deliberate 404.
- Response headers include HSTS, `nosniff`, strict-origin referrer policy,
  denied camera/microphone/geolocation, and header-delivered CSP with
  `frame-ancestors 'none'`.

There is no product backend or tenant data store to restart. The only remote
runtime dependency checked here is the Sociobot billing endpoint. Native
photo state remains local.

## Performance

Fresh mobile Lighthouse results:

- Performance: 100
- Accessibility: 100
- Best Practices: 100
- SEO: 100
- FCP: 0.9 s
- LCP: 1.4 s
- TBT: 20 ms
- CLS: 0
- Transfer: 141,251 bytes

The first Lighthouse attempt lacked an explicit Chrome path, and the next tab
crashed. The retry with the supplied Chromium and reduced shared-memory use
completed with the scores above. Browser functional checks were independent.

## Earlier finding disposition

Every earlier review and verification report in `.factory/` was inspected.
Current evidence gives these dispositions:

| Earlier finding family | Current disposition |
| --- | --- |
| Review 1 F-1-1 through F-1-33; review 2 F-2-1/F-2-3 through F-2-6; review 3 F-3-2 through F-3-4; review 5 F-5-2; review 6 F-6-2 through F-6-4; review 7 F-7-2 | Closed by current sample isolation, claim coverage, route metadata/history, plain copy, actions, and current browser tests. |
| Repeated unsigned-package findings F-1-34, F-2-2, F-3-1, F-4-1, F-5-1, F-6-1, and F-7-1 | Current contract permits unsigned packages when stated. Both macOS and Windows states are disclosed and tested; `v0.1.30` publishes the complete matrix. |
| Initial verification: broken checkout, session-only recovery, accessibility, missing claims, wrong Intel download, footer, caching/404, and manifest | Closed. Recovery survives restart/export/import, checkout returns 303, routing and PWA pass, and both macOS choices exist. |
| Verification 2: stale desktop, lost second recovery batch, invalid-license daily check, unavailable purchase | Recovery and license behavior are closed. Candidate-matched `v0.1.30` packages exist; the live access path has regressed as the current S1 finding. |
| Verification 3: hostile CSV authority, unsupported cross-device claim, phone OS error | Closed by native path/hash validation, removed copy, and phone-specific download guidance. |
| Verification 5: repeat quarantine and keyboard focus loss | Closed by current normal/repeat tests and live Space/focus checks. |
| Verification 6 and 14: wrong 404 version and 390 px/200% 404 overflow | Layout is closed; the current 404 is usable but again carries the wrong release version as part of the S1 deployment mismatch. |
| Verification 7: undersized decision controls | Closed; all checked live targets are at least 44 px. |
| Verifications 9–10: stale package omitted native safety gate; unlisted tracking/signature claims | Closed in public `v0.1.30` and the current claim registry. |
| Verifications 12, 14, and 17: no desktop release | Closed at the release host by complete `v0.1.30`; reopened only at the live site's install path by the current S1 finding. |
| Verification 15: billing 503/CORS outage | Closed; checkout, CORS, no-store response, and 30/31 allowance pass live. |
| Verification 18: unreliable default test and stale copy audit | Default suite is closed at 11/22/37. Copy-audit drift recurs as the current S3 finding. |
| Verifications 20–21: missing/mismatched desktop release, missing allowance, unlisted unsigned state | Allowance and unsigned claim are closed. Release identity recurs at the live site. |
| Verifications 22–26: deployed-source versus desktop-release identity | `v0.1.30` fixed the package side, but production has regressed to `v0.1.29` at `68d676a…`; current S1 remains open. |

## Evidence index

- `verification-27-artifacts/live-qa.json` — desktop/phone first read, routes,
  light/dark Axe, demo, storage isolation, routing, PWA, and release dialog.
- `verification-27-artifacts/claims.json` — all exact claim commands and
  duplicate-tag audit.
- `verification-27-artifacts/deployment-parity.json` — 27/27 live files match
  the ordinary `68d676a…` build.
- `verification-27-artifacts/license-allowance.json` — live requests 1–31.
- `verification-27-artifacts/lighthouse-live.json` — full Lighthouse result.
- `verification-27-artifacts/live-first-read-desktop.png`
- `verification-27-artifacts/live-first-read-phone.png`
- `verification-27-artifacts/live-demo-desktop.png`
- `verification-27-artifacts/live-demo-phone.png`
- `verification-27-artifacts/live-downloads.png`

## Acceptance decision

**FAIL. Finding count: 3. Untested claim count: 0.**

Do not declare this production deployment accepted until the release-site
artifact for `v0.1.30` at `b12d5727…` is restored and remains in place, and
the two minor repository-contract issues are closed.
