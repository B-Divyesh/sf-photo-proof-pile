# Proof Pile independent verification 8 handoff — 29 August 2026

## Independent verdict: PASS

Candidate `a1d8df215105cd009bf945786c73688cb5d92f31` passes independent product
QA at <https://photo-proof-pile.sociobot.in>. All 19 separately-run claims,
full tests (9 Rust, 9 Vitest, 25 Playwright), strict checks, production site
build, native Linux package build, live demo/restore/offline flows, axe,
headers, privacy request logging, and rate limiting passed. The live main
bundle SHA-256 exactly matches the candidate output:
`82ef5a4fa746001cd54f5256ed80e8c83eb2a6c2b3f9dc193ec36aef50e44e9d`.

Observed license-verification allowance is 30 requests per single-client burst;
request 31 returned 429 with `Retry-After: 3`. No release-blocking defects
were found. The full reproducible evidence is in `.factory/verification-8.md`.

The first desktop build in the disposable image needed the standard Linux
Tauri headers that are already specified in `.github/workflows/release.yml`;
after installing those environment-only prerequisites it produced DEB, RPM,
and AppImage successfully. No product-code changes were made by verification.

---

# Proof Pile repair handoff — 29 August 2026

## Result

Repaired the single release-blocking finding in independent verifier report
`c789af160f8a90b6d0ea9d66b2e98451992b4656` for candidate
`86955210bdd5a26e536d82151ee7f26e032d0ca2`.

The per-file **Keep**, **Quarantine**, and **Mark for review** controls were
36 px high at desktop width. They now have a shared 44 px minimum height at
all breakpoints. The redundant mobile-only override was removed, so desktop,
touch-capable laptops, and 390 px phones use the same baseline.

## Changes

- `src/style.css`: raised the base review-decision target from 36 px to 44 px.
- `tests/app.spec.ts`: added a regression that measures every decision control
  in the first demo row at 1440 × 900 and 390 × 844, asserting both dimensions
  are at least 44 CSS px.

The repair preserves the existing decision behavior, focus advancement, demo
isolation, native workflow, and visual system.

## Verification

Clean-install and repository gates passed:

- `npm ci` — 66 packages installed; `npm audit` reported zero vulnerabilities.
- `npm run check` — TypeScript, Rust format, and strict Clippy passed.
- `npm test` — 9 Rust tests, 9 Vitest tests, and 25 Playwright tests passed.
- `npm run build` — produced `dist/site`; initial app JavaScript is 13.12 kB
  gzip and CSS is 5.09 kB gzip.
- Every one of the 19 commands listed in `.factory/claims.json` was run
  separately and passed.

The Playwright suite covers the repaired desktop and phone targets, keyboard
decisions, skip-link focus, 390 px and 200% text layout, axe serious/critical
findings in light and dark modes, demo privacy requests, offline reload,
service-worker behavior, license request shape, local recovery, and mobile
touch targets.

`CI=true npm run build:desktop` passed and produced these local Linux
artifacts (package metadata makes their checksums environment-specific):

- `Proof Pile_0.1.10_amd64.deb` — 4,212,548 bytes
  (`2ca46d99c1aafb97c5c8f424592e149e492ae08d29555003303cb5c499801348`)
- `Proof Pile-0.1.10-1.x86_64.rpm` — 4,213,061 bytes
  (`1f5833dcffc50787514351ed2b32c12e604f24916d45549f360f3c47f9d4b7ca`)
- `Proof Pile_0.1.10_amd64.AppImage` — 78,666,232 bytes
  (`cb9222e94f6678ba1b1a513752231e1f17ce71a3b721df2ed98e6b6b528f9bff`)

The disposable Ubuntu image initially lacked Tauri's documented GTK/WebKit
headers, `libfuse.so.2`, and `file`; these were installed only in the worker.
After that, the individual bundle commands and the complete
`CI=true npm run build:desktop` command passed. Tauri's temporary `Cargo.toml`
feature edit was restored.

## Live and deployment checks

Static deployment `e711b435-f615-4d80-88a6-589391312d04` completed to
`https://photo-proof-pile.sociobot.in` on 29 August. The deployed root returned
HTTPS 200 and `verify-url.sh` confirmed the title, `lang=en`, one h1, one main
landmark, complete image alt text, labeled buttons, and no console errors.

The live asset identity is exact: the deployed JavaScript
`index-Bm72iktJ.js` SHA-256 is
`82ef5a4fa746001cd54f5256ed80e8c83eb2a6c2b3f9dc193ec36aef50e44e9d`,
matching `dist/site`; the live 404 footer reports v0.1.10.

A post-deploy Playwright browser smoke test on `/demo` passed at 1440 × 900
and 390 × 844. Every decision control measured 44 px high (desktop widths:
47.78, 78.84, and 101.28 px); Axe reported zero serious/critical issues; the
service worker controlled the page; an offline reload showed the offline
notice; no console errors or off-origin requests occurred; and Space on
**Quarantine** advanced focus to the next file's **Keep** decision. Mobile
document width remained 390 px with no horizontal overflow.

Response-policy checks confirmed HSTS, `nosniff`, strict-origin referrer
policy, restrictive permissions policy, and header-delivered CSP with
`frame-ancestors 'none'`. `/`, `/demo`, `/app`, `/privacy`, `/terms`,
`robots.txt`, and `sitemap.xml` returned 200; an unknown route returned 404.
The license verification endpoint returned an exact-origin CORS response,
`Cache-Control: no-store`, and an `invalid` result for a test token. Its
rate-limit test returned 30 successful responses followed by one 429. The
checkout endpoint redirected with 303 to the hosted merchant checkout.

Release tag `v0.1.10` points to `444b4d151296c6f75045a3a1e5f077e267bdffcb`.
The GitHub Actions release workflow passed prepare, Linux, Windows, macOS
arm64, macOS x64, and checksums:
`https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33253799316`.
The published release includes Linux AppImage/DEB/RPM, Windows EXE/MSI, macOS
arm64/x64 DMGs and app archives, `SHA256SUMS`, and a valid `latest.json` for
v0.1.10. A downloaded release DEB hashed to
`598780f1aaf5d4554481a50735754e7cce5c357bfc9ac702d5e9b9526682bfef`,
exactly matching the published manifest.

## Reproduce

```sh
npm ci
npm run check
npm test
npm run build
CI=true npm run build:desktop
```

For a Linux desktop package build, install the packages named in
`.github/workflows/release.yml`; minimal containers also need `file` and a
working FUSE environment (or AppImage extract-and-run mode). The CI release
workflow builds macOS, Windows, and Linux packages and publishes checksums.

## Known gaps / operator action

No product behavior gaps remain from this repair. macOS notarization and
Windows Authenticode still need the owner-held signing secrets documented in
the release workflow; unsigned packages are disclosed in the product.
