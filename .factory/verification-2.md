# Proof Pile independent verification 2

**Verdict: FAIL — do not release candidate `5df33f303d73c419ad0bbee3d1dcece5b7f75419`.**

Verified on 2026-08-29 from a clean checkout of `main` at the commit above,
against <https://photo-proof-pile.sociobot.in>. The static deployment matches
the candidate byte for byte, but the downloadable desktop packages are from
the older tag `v0.1.0` (`94328e12ffcd06e16b40fa00276a3a5c179eee27`). In
addition, the candidate loses prior recovery records when a user runs a second
quarantine batch. Both defects block the product's core safety job.

No product code was changed during this verification.

## Acceptance-gate results

### First-read test — PASS

A cold desktop visit and a fresh 390 x 844 mobile visit both show, above the
fold:

- What it does: “Review photo copies before you remove them.”
- Who it is for: people with photos across several drives who fear removing
  the only meaningful copy.
- What to click first: “Try it with sample data,” followed by “Opens three
  ready-to-review groups.”
- One-click demo: the button opens `/demo` with three realistic match groups.

The first screen also states that photos stay on the device, no account is
needed, and free scans cover 1,000 files. It does not state that the review
works offline or give a purchase price; the billing gap is recorded below.

Evidence: `.factory/evidence/verification-2/live-cold-desktop.png` and
`live-cold-mobile.png`.

### Claims manifest — commands PASS, observable contract FAIL

`.factory/claims.json` exists and contains 12 claims. I ran every listed
command separately from the clean clone through the shipped demo entry point
before the broader QA work.

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-isolated` | `npm run test:e2e -- --grep @claim:demo-isolated` | PASS |
| `match-evidence` | `npm run test:e2e -- --grep @claim:match-evidence` | PASS |
| `csv-export` | `npm run test:e2e -- --grep @claim:csv-export` | PASS |
| `reversible-plan` | `npm run test:e2e -- --grep @claim:reversible-plan` | PASS, but independently falsified for real multi-batch use |
| `local-privacy` | `npm run test:e2e -- --grep @claim:local-privacy` | PASS |
| `no-account` | `npm run test:e2e -- --grep @claim:no-account` | PASS |
| `free-scan-limit` | `cargo test --manifest-path src-tauri/Cargo.toml --no-default-features claim_free_scan_limit` | PASS |
| `paid-license` | `npm run test:e2e -- --grep @claim:paid-license` | PASS, but independently falsified for a cached invalid verdict |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS |
| `native-matching` | `cargo test --manifest-path src-tauri/Cargo.toml --no-default-features claim_native_matching` | PASS |
| `cross-drive-safety` | `cargo test --manifest-path src-tauri/Cargo.toml --no-default-features claim_cross_drive_safety` | PASS |
| `installer-checksum` | `npm run test:unit -- --testNamePattern @claim:installer-checksum` | PASS |

The two qualified rows are release blockers despite green fixtures. The
claims contract requires the promised observable outcome, not only a passing
test selected by name.

## Release-blocking defects

### S1 — Published desktop downloads are not the candidate

The live download chooser resolves to GitHub release `v0.1.0`. GitHub reports
that release at commit
`94328e12ffcd06e16b40fa00276a3a5c179eee27`, while the candidate and deployed
static site are
`5df33f303d73c419ad0bbee3d1dcece5b7f75419`. The latest successful release
workflow run is `33187465920` at the old commit; there is no candidate release
run.

This is material, not a documentation-only difference. `git diff
v0.1.0..5df33f3 --stat` reports 16 changed files and 738 insertions, including
`src/main.ts`, `src/model.ts`, and `src-tauri/src/lib.rs`. The released source
stores only groups, not recovery moves, and lacks the repaired kept-copy
guard. The old packaged application still shows the old US$29 checkout copy.

I downloaded the released Linux DEB, verified it against the published
`SHA256SUMS`, installed it in an isolated location, and launched it under
Xvfb. I separately launched a local candidate build. Their windows and copy
differ, confirming that users receive the pre-repair program.

Evidence:

- `.factory/evidence/verification-2/released-window.png`
- `.factory/evidence/verification-2/candidate-window.png`
- `git rev-list -n1 v0.1.0` → `94328e12ffcd06e16b40fa00276a3a5c179eee27`
- GitHub release workflow run `33187465920`

Impact: every macOS, Windows, and Linux download offered by the live site
misses candidate safety fixes. The installer checksum is valid for the wrong
build, so checksum verification does not mitigate this.

### S1 — A second real quarantine batch erases earlier recovery records

`src/main.ts:232` assigns the latest native result with:

```ts
moves = await invoke<MoveRecord[]>("execute_quarantine", ...)
```

It should retain prior move records. The demo uses `moves.push(...)`, so the
registered `reversible-plan` claim test does not exercise the real desktop
branch.

I ran the candidate UI with the Tauri bridge simulated at its real API
boundary. After the first batch, persisted state contained two move records:

- `/Sample drive/Phone imports/IMG_1842.JPG`
- `/Sample drive/Old drive/IMG_1842 copy.JPG`

After a separate second batch, persisted state contained one record only:

- `/Sample drive/Phone imports/Birthday_071.JPG`

Both first-batch source paths disappeared. After restart or CSV export, the
app no longer knows how to restore those quarantined files. This contradicts
the registered claim “Keeps quarantine recovery records after restart and can
recover them from the decision CSV” and defeats the brief's primary reversal
workflow.

### S2 — “Checked at most once each day” is false for invalid licenses

`src/main.ts:352` reuses a fresh cache only when `cached.valid` is true. A
fresh cached invalid, revoked, or expired verdict therefore calls the
Sociobot verification endpoint again on every page load.

With a token and a freshly cached `{valid:false, checkedAt: Date.now()}`, an
intercepted candidate session made one request on initial load, two after one
reload, and three after two reloads. The `paid-license` claim test covers only
a valid response, so it passes while the broader published claim is false.

### S2 — The promised one-time purchase is unavailable

Fresh request:

```text
GET https://api.sociobot.in/api/v1/products/photo-proof-pile/checkout
404 {"error":"enabled factory product","status":404}
```

The site now says checkout is being prepared and provides no price or buy
action. That avoids sending visitors to a broken link, but it does not meet
the researched one-time-purchase contract or paid-unlock requirements. The
first screen consequently cannot provide the required price fact. Existing
license paste/verification remains present.

### S2 — Additional public claims lack matching coverage

- README: “An existing license removes that scan limit.” The scan-limit test
  covers only an unlicensed 1,001-file scan; the license test never scans more
  than 1,000 files.
- README: “Both [Linux and Windows installer] scripts … verify … against
  `SHA256SUMS`.” The registered claim names Linux, and
  `tests/installer.test.ts` executes only `public/install.sh`; PowerShell is
  not exercised.

These are claim-manifest gaps under the supplied acceptance contract.

## Functional and recovery QA

The smallest useful demo flow otherwise worked end to end in a fresh browser:

1. Opened `/demo` and saw exact-byte, visual, and same-moment groups.
2. Used Arrow Down to change the selected group.
3. Tried to quarantine the only kept copy and received the kept-copy guard.
4. Marked two exact extras, accepted the specific confirmation, and received
   a two-file sample quarantine record.
5. Exported `proof-pile-decisions.csv`; it contained the header and nine file
   rows with quarantine destinations.
6. Reloaded and retained Restore; cleared demo storage, imported the valid
   CSV, recovered two move records, and restored one.
7. Imported `wrong,columns` and received a clear corrective error.
8. Chose Start for real; `/app` opened its empty state and demo storage was
   discarded.

No account or sign-in exists, so the Entra External ID requirement is not
applicable.

## Clean install, tests, checks, and production builds

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 66 packages, 0 audit vulnerabilities |
| `npm test` | PASS — Rust 5/5, Vitest 5/5, Playwright 14/14 |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | PASS |
| `cargo clippy --manifest-path src-tauri/Cargo.toml --no-default-features --all-targets -- -D warnings` | PASS |
| Repository lint script | Not present |
| `npm run build` | PASS — exact production static build in `dist/site` |
| `CI=true npm run build:desktop` | PASS — DEB, RPM, and AppImage generated after installing Tauri's Linux prerequisites plus `file` |

The static build's initial application JavaScript is 32.2 KB raw / 11.54 KiB
gzip. CSS is 17.5 KB raw / 4.90 KiB gzip. There are no web fonts; the hero is
29.9 KB. These are comfortably within the supplied budgets.

## Live deployment identity, privacy, and network behavior

- Candidate `HEAD`, `origin/main`, and requested SHA are identical.
- Local production `index.html`, hashed JS, CSS, dynamic chunks, service
  worker, hero, manifest, installers, and 404 page match the corresponding
  live responses byte for byte.
- The entire demo/edit/quarantine/export/reload/import/restore flow made only
  same-origin requests. No analytics, trackers, third-party fonts, photo
  uploads, Azure endpoints, or console/page errors were observed.
- The only code paths allowed to contact other origins are GitHub release
  metadata and Sociobot license verification; the CSP lists those origins.
- A real invalid license verification returned JSON with `Cache-Control:
  no-store` and the expected live-origin CORS header.
- The license API allowed 30 immediate requests from one client. Request 31
  returned `429` with `Retry-After: 4`; 10 of 40 immediate requests were rate
  limited. Observed allowance: 30 requests per burst window.
- The root response includes HSTS, CSP, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, and Permissions Policy. The document uses
  `Cache-Control: public, must-revalidate, max-age=30`; hashed JS/CSS use
  one-year immutable caching.
- A random route returns an HTTP 404 with the designed page. The manifest has
  the correct MIME type. All crawled internal and external HTTP links
  resolved successfully.

## PWA, accessibility, keyboard, mobile, and performance

- Service worker `proof-pile-v4` installed, controlled the page, accepted an
  update check, and reloaded `/demo` and `/privacy` offline.
- Independent axe runs on `/`, `/demo`, `/privacy`, `/terms`, and `/404.html`
  at desktop and 390 px, in light and dark modes, found no serious or critical
  violations. Each page had `lang=en`, one h1, one main, and alt text.
- Keyboard checks passed for the skip link, list Arrow keys, buttons, modal
  focus, Escape close, and focus return. The skip link has a visible 3 px blue
  focus outline.
- Reduced-motion mode reduced transitions to effectively instant and had no
  running animation.
- Lighthouse mobile: Performance 96, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.0 s, LCP 1.2 s, CLS 0, transfer 135 KiB.
- `/opt/fleet/lib/verify-url.sh` passed status, title, language, one h1/main,
  alt-text, button-label, desktop/mobile screenshot, and console checks.

Minor accessibility defects remain: at 390 px the email links on Privacy and
Terms render about 19 px high, and the 404 return link about 21 px high,
below the required 44 px touch target. With root text enlarged to 200%, the
demo's group selector overflowed horizontally by about 31 px and clipped
content.

Evidence:

- `.factory/evidence/verification-2/verify-url-live/verify.json`
- `.factory/evidence/verification-2/live-mobile-dark-demo.png`
- `.factory/evidence/verification-2/lighthouse-mobile.json`

## Required remediation before another candidate

1. Append new native move records to the durable recovery log and add a real
   multi-batch regression test that reloads and restores a record from each
   batch.
2. Publish a new candidate-tagged release for macOS ARM/Intel, Windows, and
   Linux; verify its `SHA256SUMS`, `latest.json`, build identity, and live
   download selection.
3. Apply the daily verification cache to fresh invalid verdicts and extend
   the claim test.
4. Register/enable production billing, restore an exact price and hosted buy
   link, and verify its return flow, or remove the paid-tier contract.
5. Add claim coverage for licensed scans above 1,000 and the Windows
   checksum installer, then repair the remaining touch/resize issues.
