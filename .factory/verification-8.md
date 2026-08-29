# Proof Pile independent verification 8

## Verdict: PASS

Candidate `a1d8df215105cd009bf945786c73688cb5d92f31` is **releasable**.
Independent verification was performed on 29 August 2026 UTC against
<https://photo-proof-pile.sociobot.in>. No product source code was changed.

- Work order: `photo-proof-pile-verify-8`
- Candidate: `a1d8df215105cd009bf945786c73688cb5d92f31`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Severity findings: none (no S1, S2, or S3 defects).

## Mandatory gates

### First-read and demo: PASS

A cold, storage-free live visit at 1440 px read: **“Review photo copies before
you remove them”**, for **“people with photos across several drives who fear
removing the only meaningful copy”**, with the first action **“Try it with
sample data”** and the result **“Opens three ready-to-review groups.”** This
plainly answers what it does, for whom, and what to click first. One click
opened the populated `/demo` desk with the persistent **“Demo — sample data,
nothing is saved”** banner, Reset demo, and Start for real.

### Claims: PASS

`.factory/claims.json` exists. After clean `npm ci`, every one of its 19 exact
listed commands was run separately through its declared demo/native entry
point and passed:

| Claim tests | Result |
| --- | --- |
| `demo-isolated`, `match-evidence`, `csv-export`, `reversible-plan`, `local-privacy`, `license-request-privacy`, `no-account`, `free-safety-tools`, `paid-license`, `paid-checkout`, `offline-reload` | PASS — individual Playwright claim commands |
| `native-local-privacy`, `free-scan-limit`, `licensed-scan-limit`, `native-matching`, `scan-scope`, `cross-drive-safety` | PASS — individual Rust claim commands |
| `installer-checksum`, `windows-installer-checksum` | PASS — individual Vitest claim commands |

## Clean build and test evidence

- `npm ci`: PASS; 66 packages installed and audit reported zero vulnerabilities.
- `npm run check`: PASS; TypeScript, Rust formatting, and strict Clippy.
- `npm test`: PASS; 9 Rust tests, 9 Vitest tests, and 25 Playwright tests.
  A separately captured full `npm run test:e2e -- --reporter=dot` exit status
  was 0: **25 passed (1.0m)**.
- `npm run build`: PASS; produced `dist/site`. Initial application JavaScript
  is 13.12 kB gzip and CSS is 5.09 kB gzip, within the 200/50 kB budgets.
- `CI=true npm run build:desktop`: PASS after installing the Linux Tauri
  prerequisites declared by `.github/workflows/release.yml` in this clean
  disposable image. The first attempt correctly stopped on absent `glib-2.0`
  development files; this was an environment prerequisite, not a source
  failure. The final build produced DEB (4,212,548 bytes), RPM (4,213,061
  bytes), and AppImage (78,666,232 bytes). Tauri's temporary manifest edit was
  restored; the worktree contains only verification documentation.

## Independent product exercise

- In a fresh live demo, the safety boundary rejected an attempt to quarantine
  with no kept copy: “Keep one copy in this group before marking another copy
  for quarantine.” Restoring a Keep decision allowed quarantine, the explicit
  confirmation moved the sample record, and confirmed recovery returned
  “IMG_4812.jpg restored in the demo.” Start for real then opened the empty
  local-review state.
- Desktop `/demo` showed three initial exact-copy records; each Keep,
  Quarantine, and Mark for review control measured 44 px high (the narrowest
  was 47.78 x 44 CSS px). At 390 px dark/reduced-motion presentation there was
  no horizontal page overflow (390/390), the same controls remained 44 px
  high, and reduced motion computed to `0.00001s`.
- Live axe checks at desktop and 390 px had zero serious or critical
  violations. Keyboard traversal, arrow-key group navigation, decision
  actions, semantic landmarks, one h1, labels, alt text, and designed 3 px
  focus treatment were checked. No console or page errors occurred.
- The live service worker controlled `/demo`. Calling its update path left an
  active controller with no stranded waiting worker; after first load an
  offline reload retained the demo heading and demo banner without errors.

## Privacy, headers, deployment, and release evidence

- A complete fresh demo request log contained **zero off-origin requests**.
  There are no third-party fonts or analytics. The license path was separately
  covered by its claim test, which asserts a token-only Sociobot GET.
- `/`, `/demo`, `/app`, `/privacy`, `/terms`, `robots.txt`, and `sitemap.xml`
  returned 200; an unknown route returned a real 404. Headers include HSTS,
  `nosniff`, `strict-origin-when-cross-origin`, restrictive permissions policy,
  and header-delivered CSP with `frame-ancestors 'none'`. HTML/SW cache for 30
  seconds; hashed JS is `max-age=31536000, immutable`.
- The production output's main asset hash is
  `82ef5a4fa746001cd54f5256ed80e8c83eb2a6c2b3f9dc193ec36aef50e44e9d` both
  locally (`dist/site/assets/index-Bm72iktJ.js`) and live. The public
  `v0.1.10` release points at `444b4d151296c6f75045a3a1e5f077e267bdffcb`;
  candidate `a1d8df2` changes only factory handoff documentation, so the
  packaged product code and live bundle are the candidate product code.
- The published Linux DEB downloaded from the release has SHA-256
  `598780f1aaf5d4554481a50735754e7cce5c357bfc9ac702d5e9b9526682bfef`,
  exactly matching published `SHA256SUMS`. `latest.json` lists current macOS,
  Windows, and Linux assets.
- The documented product-unlock request allowance is enforced: a fresh
  single-client burst received 30 responses with 200, then request 31 and
  later received **429** with `Retry-After: 3`. Observed allowance: 30
  verification requests per burst window. No sign-in is required.

## Reproduce

```sh
npm ci
# Run every test command in .factory/claims.json separately
npm run check
npm test
npm run build
CI=true npm run build:desktop
```

For a Linux desktop build, install the Tauri prerequisites already declared in
the release workflow: `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev
patchelf` (and normal container utilities such as `file`/FUSE support).
