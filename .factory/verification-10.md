# Proof Pile independent verification 10

## Verdict: FAIL

Candidate `29b889667794c36baaeceab0828c6de7dcde2756` is **not
releasable**. Verification was performed on 29 August 2026 UTC from the clean
work-order checkout against <https://photo-proof-pile.sociobot.in>. No product
source code was changed.

- Work order: `photo-proof-pile-verify-10`
- Candidate: `29b889667794c36baaeceab0828c6de7dcde2756`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Result: **FAIL — the downloadable desktop product is still an older,
  safety-material build**

## Release-blocking defects

### S1 — live desktop downloads do not contain the candidate safety gate

Fresh evidence reproduces the deployment failure independently:

- The live download picker says **“v0.1.10 is ready”** and links every macOS,
  Windows, and Linux action to `v0.1.10` assets.
- GitHub's latest-release API returns `v0.1.10`, published at
  `2026-08-29T12:57:56Z`.
- Its `latest.json` identifies commit
  `444b4d151296c6f75045a3a1e5f077e267bdffcb`.
- The downloaded Linux package
  `Proof.Pile_0.1.10_amd64.deb` is version `0.1.10`, SHA-256
  `598780f1aaf5d4554481a50735754e7cce5c357bfc9ac702d5e9b9526682bfef`,
  and passes the published `SHA256SUMS` check. It launched under virtual X and
  remained running until the intentional 10-second timeout.
- Tag `v0.1.11` resolves to
  `21c4c0ce9e2d17422e53d23e1d7aeb92705008a6`, but GitHub's release API returns
  404 for that tag. Candidate `29b8896` is one documentation-only commit after
  that tag.
- Release workflow run
  [33263273062](https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33263273062)
  failed in `validate-signing`; `prepare-release`, all platform builds, and
  checksums were skipped.

This is safety material. The published `v0.1.10` native command accepts an
arbitrary list of paths. The candidate command accepts reviewed plan entries
and rejects an entry unless it is marked `quarantine`, names a distinct kept
copy, and that kept copy is still readable. The installed product therefore
does not have the candidate's native protection against moving an unreviewed
file or a group's only copy.

The static site is current: all four built JS/CSS chunks and `sw.js`, the web
manifest, 404 page, and both installer scripts matched the candidate build
byte-for-byte. That does not make the stale desktop package acceptable for a
desktop-app artifact.

### S2 — two public claims are absent from the claims manifest

The claims contract requires every visitor-facing claim to be represented in
`.factory/claims.json`. The manifest has no entry for these statements:

- Privacy page: **“We do not run advertising or tracking scripts.”**
- README and live download dialog: **“Current builds are unsigned.”**

The first statement was true in the observed request log and the second is
consistent with the stale release, but neither statement has its own listed
claim and tagged test. This is independently release-blocking under the
supplied claims acceptance contract. The unsigned-build sentence will also
become stale when the workflow's required signed Windows and notarized macOS
release is finally published.

## Mandatory gates

### Claims: PASS after the documented install

`.factory/claims.json` exists with 20 entries. After `npm ci`, every exact
listed command was run separately through its declared demo or native entry
point and returned zero.

| Claims | Result |
| --- | --- |
| `demo-isolated`, `match-evidence`, `csv-export`, `reversible-plan`, `review-before-move`, `local-privacy`, `license-request-privacy`, `no-account`, `free-safety-tools`, `paid-license`, `paid-checkout`, `offline-reload` | PASS — exact Playwright commands; `review-before-move` also passed its native test |
| `native-local-privacy`, `free-scan-limit`, `licensed-scan-limit`, `native-matching`, `scan-scope`, `cross-drive-safety` | PASS — exact Cargo commands |
| `installer-checksum`, `windows-installer-checksum` | PASS — exact Vitest commands |

Every listed claim has exactly one matching `@claim:<id>` tag. The unlisted
public claims above are a manifest coverage defect, not a failure of these 20
tests.

### First read and demo: PASS

A new 1440 x 900 browser profile showed all mandatory information above the
fold:

- What: **“Review photo copies before you remove them.”**
- For whom: **“For people with photos across several drives who fear removing
  the only meaningful copy.”**
- First action: **“Try it with sample data,”** followed by **“Opens three
  ready-to-review groups.”**

One click opened `/demo` with three populated groups and the persistent
**“Demo — sample data, nothing is saved”** banner, Reset demo, and Start for
real.

## Clean checkout and production builds

- Checkout identity and initial worktree: exact candidate, clean.
- `npm ci`: PASS; 66 packages installed; audit reported zero vulnerabilities.
- `npm test`: PASS — 10 Rust tests, 11 Vitest tests, and 28 Playwright tests.
- `npm run check`: PASS — TypeScript, Rust format, and strict Clippy.
- `npm run build`: PASS; `dist/site` produced.
- Site output: 14.90 kB gzip JavaScript total and 5.09 kB gzip CSS. The 29.9
  kB hero is below its 300 kB budget.
- The verifier image exports `CI=1`; Tauri requires `CI=true|false`, so the
  first desktop invocation stopped before compilation. With `CI=true` and the
  same Linux packages installed by the release workflow, the release binary,
  DEB, and RPM built. The default all-bundle command then stopped at
  `linuxdeploy` while creating AppImage; this container has no `/dev/fuse`.
- `CI=true npx tauri build --bundles deb,rpm`: PASS. The final DEB reports
  package `proof-pile`, version `0.1.11`, architecture `amd64`, SHA-256
  `342ca2c66ab6e8fe1717be6f2e2e17de949beabe94f6427f63edaa331250e3bc`.
  Extracting it into a clean temporary consumer and launching its binary under
  virtual X stayed alive until an intentional 5-second timeout. Only expected
  headless EGL warnings were emitted.

The AppImage limitation does not change the verdict: the official tagged
workflow did not reach any platform build because its signing gate failed.

## Independent live product exercise

- Normal flow: `/demo` loaded 3 groups and 8 records. **Mark exact extras**
  produced a 2-file plan. Confirmation said **“Move 2 files to /Sample
  drive/Proof Pile Quarantine?”** and promised decision-log recovery. The demo
  reported that no device files changed.
- Export: `proof-pile-decisions.csv` contained the expected 12-column header
  and 8 data rows.
- Persistence and recovery: reload exposed **Restore last move**. The recovery
  dialog named both quarantine and original paths; restore reported success.
- Invalid decision: attempting to quarantine the current kept copy was blocked
  with **“Keep one copy in this group before marking another copy for
  quarantine.”**
- Invalid import: a malformed CSV was rejected as not being a Proof Pile log
  and instructed the user to choose a Proof Pile CSV.
- Invalid license: a fake token returned the actionable message **“This
  license is not active. Check the token and your connection.”**
- Native boundary and failure coverage passed for 1,001-file licensed/free
  limits, selected-folder isolation, exact/visual/metadata-near matching,
  collision-safe cross-drive moves, unreadable/missing kept copies, and hostile
  imported recovery paths.

## Accessibility, responsive behavior, and errors

- The supplied `verify-url.sh` passed on live `/` and `/demo`: HTTP 200,
  correct title and `lang=en`, one h1, one main landmark, no missing image alt,
  no unlabeled buttons, and no console/page errors.
- Independent axe scans of `/`, `/demo`, `/privacy`, `/terms`, and the designed
  404 at desktop and 390 px, in light and dark modes, found zero serious or
  critical violations.
- There was no horizontal overflow at 1440 px or 390 px. At 200% text, the
  390 px layout and all three group options remained within the viewport.
- Review decision targets measured at least 44 px high. Keyboard-only Tab
  traversal exposed a designed 3 px blue focus ring. Space operated a decision
  and moved focus to the next file's Keep action. The skip link moved focus to
  `main`; group arrows worked.
- With reduced motion, checked transition and animation durations were
  `0.00001s`.
- Ordinary live routes emitted no console/page errors. Navigating intentionally
  to the 404 produced Chromium's expected failed-document 404 console message,
  with no application exception.

## Privacy, headers, PWA, and request allowance

- A complete live demo review, export, reload, and restore made 27 requests,
  all same-origin. No analytics, third-party font, script, thumbnail, path, or
  decision-log request was observed.
- License verification is a token-only GET to `api.sociobot.in`; the exact
  privacy claim test passed.
- Live HTML sends HSTS, `nosniff`, strict-origin referrer policy, a restrictive
  permissions policy, and a header CSP including `frame-ancestors 'none'`.
- HTML and `sw.js` use 30-second revalidation. Hashed JS/CSS use
  `max-age=31536000, immutable`.
- The service worker controlled `/demo`, completed `registration.update()`, and
  preserved the banner, all 3 groups, and the review h1 after an offline reload.
- A fresh client received 200 for license verification requests 1–30. Requests
  31–40 returned 429 with `Retry-After: 4`. Observed allowance: **30 requests
  per burst window**.
- No sign-in is required; identity-provider checks are not applicable. There is
  no product backend beyond the external billing endpoint, so backend
  concurrency and persistence tests are not applicable.

## Performance and routing

Mobile Lighthouse on the live landing page scored 99 performance, 100
accessibility, 100 best practices, and 100 SEO. FCP was 0.98 s, LCP 1.20 s,
total blocking time 140 ms, CLS 0, and total transfer 140,487 bytes.

All internal product routes returned their intended 200 status, the designed
missing route returned 404, and checked external links were reachable. The
Sociobot checkout returned a 303 redirect to hosted Dodo checkout. The browser
does not contact GitHub until the user opens downloads.

## Required release action

Provide the macOS and Windows signing secrets required by the workflow, publish
a new signed/notarized desktop release from a source commit containing the
candidate's reviewed-plan native gate, and publish `latest.json` with that
immutable commit. Then verify all platform assets, one installed package, and
its checksum. Add or remove/reword the two unlisted public claims before the
next verification.
