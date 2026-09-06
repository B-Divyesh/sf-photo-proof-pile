# Verify reversible photo cleanup and desktop downloads — Verification 28

Verified 6 September 2026 UTC against <https://photo-proof-pile.sociobot.in>.

- Work order: `photo-proof-pile-verify-28`
- Implementation candidate: `b12d5727de44d71c91b4a496eece320e7247a853`
- Documentation checkout: `9e6662692c5c9ad6ea2541d8561568ed6e202e52`
- Required release: `v0.1.30` at `b12d5727…`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Finding count: **1**
- Untested claim count: **0**

## Verdict: FAIL

**FAIL — the live desktop download path does not serve the reviewed release.**

The candidate and its public `v0.1.30` release are valid. A fresh production
build reconstructs and verifies that release. The live page instead identifies
itself as `v0.1.29` at documentation commit `9e66626…`. It requests the
unrelated `v0.1.29` GitHub tag, exposes no package links, and stamps both
one-line installers with that unavailable identity. This prevents a visitor
from obtaining the reviewed desktop product through the documented path.

All declared claims passed. There are no untested public claims. The core
review workflow, sample isolation, privacy, accessibility, offline reload,
native artifact smoke, API allowance, and local quality gates passed. They do
not make the broken live install path acceptable for this desktop product.

## Finding

### Severity 1 — live downloads do not match the reviewed desktop release

Fresh uncached live evidence found:

- Footer: `v0.1.29 · source 9e6662692c5c`.
- Service-worker cache: `proof-pile-v29`.
- Designed 404 footer: `v0.1.29`.
- Download dialog requested `releases/tags/v0.1.29`, displayed “Downloads for
  this build are being published,” and contained zero `Download for …` links.
- Live `install.sh` and `install.ps1` each require `v0.1.29` at
  `9e6662692c5c9ad6ea2541d8561568ed6e202e52`.
- GitHub `v0.1.29` targets `758ba983…`, so it cannot satisfy the live
  `9e66626…` installer identity. GitHub `v0.1.30` correctly targets
  `b12d5727…` and contains both macOS DMGs, Windows MSI/EXE, Linux AppImage,
  DEB/RPM, `SHA256SUMS`, and `latest.json`.
- `npm run build` produced the verified `v0.1.30` site at `b12d5727…`.
  Comparing its 27 served files to production found only 18 matches; the
  release-sensitive `index.html`, JavaScript bundle, 404, installers, and
  service worker differ.

Resolution: deploy the verified `release-site` artifact for `v0.1.30` at
`b12d5727…`, then recheck that the footer, 404, service worker, dialog, and
both installers carry that same identity and that the dialog exposes four
platform choices.

## First screen and sample review

Fresh desktop (1440 × 900) and phone (390 × 844) browser profiles stated the
job, audience, and first action before scrolling:

- Job: “Review photo copies before you remove them.”
- Audience: people with photos across several drives who fear removing the
  only meaningful copy.
- First action: “Try it with sample data.” It states “Opens three
  ready-to-review groups.”

Keyboard activation opened `/demo`. The sample showed three groups and eight
files. Its persistent label said “Demo — sample data, nothing is saved” and
included Reset demo and Start for real. An independent run seeded a real-data
sentinel, rejected an unsafe move, made a two-file plan with the exact
destination confirmation, exported nine CSV rows, reloaded recovery state,
rejected an invalid import, reset, and exited. The real sentinel remained
unchanged; only `demo:photo-proof-pile:session` was removed. Sample requests
were same-origin only.

## Declared claims

From a clean local clone at documentation SHA `9e66626…`, `npm ci` installed
66 locked packages with zero reported vulnerabilities. Every exact command in
`.factory/claims.json` passed independently. The tag audit found exactly one
`@claim:` test for each claim.

| Claim | Result |
| --- | --- |
| `demo-isolated`, `match-evidence`, `csv-export`, `reversible-plan` | PASS |
| `review-before-move`, `local-privacy`, `no-ad-tracking`, `native-local-privacy` | PASS |
| `license-request-privacy`, `no-account`, `free-scan-limit`, `free-safety-tools` | PASS |
| `paid-license`, `license-verification-allowance`, `paid-checkout`, `licensed-scan-limit` | PASS |
| `offline-reload`, `native-matching`, `scan-scope`, `cross-drive-safety` | PASS |
| `installer-checksum`, `windows-installer-checksum`, `desktop-release-assets`, `desktop-release-identity`, `unsigned-package-state` | PASS |

Landing, demo, privacy, terms, download, and README capability statements
were cross-checked with this registry. No unlisted public claim was found.

## Local build and installed artifact

- `npm run check`: PASS — TypeScript, rustfmt, and warnings-denied Clippy.
- `CI=1 npm test`: PASS — 11 Rust, 22 unit, and 37 browser tests.
- `npm run build`: PASS — reconstructs and verifies `v0.1.30` at
  `b12d5727…`, then writes `dist/site`.
- Fresh consumer check: the public Linux AppImage matched `SHA256SUMS`. After
  installing the documented Tauri graphics prerequisites (`libegl1` and
  `libgles2`) in the clean consumer environment, extracted `AppRun` stayed
  running under Xvfb for eight seconds. Exit 124 was the expected timeout.

## Browser, accessibility, privacy, and performance

- `/`, `/demo`, `/app`, `/privacy`, and `/terms` returned 200 with route
  titles, `lang=en`, one H1, one main landmark, header/footer, canonical URL,
  description, and image alt attributes. The deliberate missing route returned
  the designed 404; its normal failed-resource console entry was the only
  allowed error.
- Ten Axe scans (five routes in light and dark) and the 404 found zero serious
  or critical violations. The supplied URL verifier passed with no console
  errors.
- Keyboard skip link, Enter activation, route focus, arrow-key group choice,
  Escape dialog exit, decision focus, and the visible 3 px focus outline
  passed. At 390 px all checked targets were at least 44 px with no horizontal
  overflow; reduced motion reduced the checked transition to `0.00001s`.
- The service worker controlled the demo and reloaded all three groups offline
  with HTTP 200. This behavior passes, but its `v29` cache identity belongs to
  the Severity 1 deployment finding.
- Live license verification returned 200 for requests 1–30 and 429 with
  `Retry-After: 4` for request 31. CORS allowed the product origin and the
  response was `no-store`.
- Fresh mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.0 s, LCP 1.1 s, TBT 30 ms, CLS 0.

## Earlier findings

| Earlier finding family | Current disposition |
| --- | --- |
| Review 1–7 workflow, copy, route, accessibility, privacy, recovery, and mobile findings | Closed by the current clean claim suite and live browser exercise. |
| Earlier unsigned-package findings | Closed under the current disclosed-and-tested unsigned package policy; the valid `v0.1.30` release has the complete package matrix. |
| Verification 18 duplicate claim tag and copy-audit drift | Closed: every claim has one tag and the audit identifies `v0.1.30` at `b12d5727…`. |
| Verifications 22–27 release-identity failures | Still open as the Severity 1 finding above. The live state has moved from `68d676a…` to `9e66626…`, but it remains an ordinary `v0.1.29` build rather than the verified release-site artifact. |

## Evidence

The clean-clone evidence was collected under
`/tmp/photo-proof-pile-verify-28.T0JS0F/repo/.factory/` during this review:
`verification-28-claims.json`, `verification-28-npm-test.log`,
`verification-28-build.log`, `verification-28-deployment-parity.json`,
`verification-28-api-output.json`, `verification-28-url/verify.json`,
`verification-27-artifacts/live-qa.json`, and
`verification-28-lighthouse.json`. The consumer artifact smoke was collected
under `/tmp/photo-proof-pile-consumer-28.2WdTmv/`.

## Acceptance decision

**FAIL. Finding count: 1. Untested claim count: 0.**
