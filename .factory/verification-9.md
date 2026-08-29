# Proof Pile independent verification 9

## Verdict: FAIL

Candidate `601f04c75fc1ff28521d7e955b7ab8350b5b3ffd` is **not releasable**. Verification was performed on 29 August 2026 UTC from a clean checkout against <https://photo-proof-pile.sociobot.in>. No product source code was changed.

- Work order: `photo-proof-pile-verify-9`
- Candidate: `601f04c75fc1ff28521d7e955b7ab8350b5b3ffd`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Result: **FAIL — S1 release-blocking desktop deployment mismatch**

## Blocking defect

### S1 — published desktop applications are not this candidate and omit its native safety gate

The product is a desktop app, but the live site's download flow still serves GitHub release `v0.1.10`. Its published `latest.json` records commit `444b4d151296c6f75045a3a1e5f077e267bdffcb`, while the candidate is `v0.1.10-8-g601f04c`. The candidate changes both `src/main.ts` and `src-tauri/src/lib.rs` after that tag.

This is safety material, not documentation drift. The old native command is `execute_quarantine(paths: Vec<String>, quarantine_dir: String)` and moves each supplied path. Candidate `3cc76fd` changes it to a reviewed plan and rejects an entry that is not marked `quarantine`, has no distinct kept copy, or whose kept copy cannot be read. Thus a person installing the currently published desktop app does not receive the candidate's required “only reviewed files marked for quarantine can move” protection.

The live static website itself does match the candidate: locally built `dist/site/assets/index-wQimVaAO.js` and the live asset both SHA-256 to `637db429cb4058c850f7f8458776598d4cbf37797834ed7bda94a365a37342a0`. That does not make the downloadable desktop application match the candidate.

Fresh package evidence: the published Linux DEB is `Proof.Pile_0.1.10_amd64.deb`, package version `0.1.10`, SHA-256 `598780f1aaf5d4554481a50735754e7cce5c357bfc9ac702d5e9b9526682bfef`, matching the published `SHA256SUMS`; it is still the pre-candidate release artifact. Do not mark this candidate deployed or release it until a versioned desktop release built from this candidate (or a successor containing the same native gate) is published and the site points to it.

## Mandatory gates

### Claims: PASS

`.factory/claims.json` exists and contains 20 claims. From clean `npm ci`, every exact listed command was run through its declared demo/native entry point and passed. The first native compilation was slow, so the three commands initially returned as still running from the command wrapper; each was rerun to a completed zero exit status before being counted.

| Claims | Result |
| --- | --- |
| `demo-isolated`, `match-evidence`, `csv-export`, `reversible-plan`, `review-before-move`, `local-privacy`, `license-request-privacy`, `no-account`, `free-safety-tools`, `paid-license`, `paid-checkout`, `offline-reload` | PASS — exact Playwright commands (and native part of `review-before-move`) |
| `native-local-privacy`, `free-scan-limit`, `licensed-scan-limit`, `native-matching`, `scan-scope`, `cross-drive-safety` | PASS — exact Cargo commands |
| `installer-checksum`, `windows-installer-checksum` | PASS — exact Vitest commands |

### First read and demo: PASS

A cold, storage-free 1440 px live visit plainly said **“Review photo copies before you remove them”**, for **“people with photos across several drives who fear removing the only meaningful copy”**, and exposed **“Try it with sample data”** with **“Opens three ready-to-review groups.”** One click reaches `/demo`, which shows three populated groups and the persistent **“Demo — sample data, nothing is saved”** banner with Reset demo and Start for real.

### Clean local quality gates: PASS, except host prerequisites for packaging

- `npm ci`: PASS; 66 packages installed, audit reported zero vulnerabilities.
- `npm run check`: PASS (TypeScript, Rust format, strict Clippy).
- `npm test`: PASS — 10 Rust, 10 Vitest, and 28 Playwright tests.
- `npm run build`: PASS; `dist/site` produced. Main JS is 13.37 kB gzip and CSS is 5.09 kB gzip, within budget.
- `CI=true npm run build:desktop`: the static prebuild passed, then Tauri stopped because this disposable verifier image lacks the host `glib-2.0` development package (`pkg-config` cannot find `glib-2.0 >= 2.70`). This is a documented Linux runner prerequisite installed by `.github/workflows/release.yml`, not a candidate source failure. Tauri's temporary `Cargo.toml` feature edit was restored; the final worktree has only this report/handoff documentation changed.

## Independent live product exercise

- The live demo rejected a Quarantine choice without a kept copy: “Keep one copy in this group before marking another copy for quarantine.” After choosing Keep, a Quarantine choice required a confirmation naming one file and `/Sample drive/Proof Pile Quarantine`; the sample move reported that no device files changed. A fresh direct restoration exercise then opened the recovery dialog with source/destination and reported `IMG_4812 (1).jpg restored in the demo.`
- Desktop and 390 px mobile demo views had no horizontal overflow (`scrollWidth === innerWidth`). The review controls meet the project’s automated 44 px target test. With reduced motion, the checked transition duration was `0.00001s`.
- Axe Playwright scans on live `/demo` at desktop and 390 px produced zero serious or critical violations. Full local Playwright also passed its light/dark accessibility, keyboard, skip-link, focus progression, 200% text, and mobile target tests. Normal live routes `/`, `/demo`, `/app`, `/privacy`, and `/terms` had one h1, one main, correct route title, and no console/page errors.
- After first load, the live service worker controlled `/demo`. An offline reload retained the demo h1 and demo banner with no errors.

## Privacy, headers, and allowance

- A fresh complete live demo review made only same-origin requests; no analytics or third-party fonts/scripts appeared. The exact `local-privacy` and token-only `license-request-privacy` claim tests pass.
- Response headers on live routes include HSTS, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, restrictive permissions policy, and a header-delivered CSP with `frame-ancestors 'none'`. HTML and service worker cache for 30 seconds; the hashed JS is `max-age=31536000, immutable`.
- The documented unlock-service allowance is enforced. A fresh single-client burst received 200 on requests 1–30; requests 31–35 returned `429` with `Retry-After` (3 seconds, then 2). Observed allowance: 30 verification requests per burst window.
- No sign-in is required, so no identity-provider flow is in scope.

## Required release action

Publish a new signed/notarized desktop release from this candidate or a successor, with a new version/tag and `latest.json` commit equal to that release commit. Verify at least one downloaded package’s checksum and install/run its reviewed-plan flow. Only then can the live desktop product be said to match the candidate.
