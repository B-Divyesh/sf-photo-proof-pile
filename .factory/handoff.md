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

Native package verification produced:

- `Proof Pile_0.1.10_amd64.deb` — 4,212,564 bytes
  (`578d111428e941251640bdf8a8be036a89aef0b9cd439c52090262237d494587`)
- `Proof Pile-0.1.10-1.x86_64.rpm` — 4,213,061 bytes
  (`c61eedd9a71f67717878fd6d7f57e76514fa5e816c8f6d66ec2fab3993b12812`)
- `Proof Pile_0.1.10_amd64.AppImage` — 78,666,232 bytes
  (`766fff648e57d15c9af932b677a0c21dd6347c02de009d4f1e52614881cf1f51`)

The disposable Ubuntu image initially lacked Tauri's documented GTK/WebKit
headers, `libfuse.so.2`, and `file`; these were installed only in the worker.
After that, `CI=true npx tauri build --bundles deb,rpm` and
`CI=true npx tauri build --bundles appimage` both passed. Tauri's temporary
`Cargo.toml` feature edit was restored.

## Live and deployment checks

Before deployment, `verify-url.sh` passed at
`https://photo-proof-pile.sociobot.in`: HTTPS 200, title, `lang=en`, one h1,
one main landmark, complete image alt text, labeled buttons, and no browser
console errors. Header checks confirmed HSTS, `nosniff`, strict-origin
referrer policy, restrictive permissions policy, and header-delivered CSP with
`frame-ancestors 'none'`. The release/billing endpoint policy is checked again
after deployment.

Deployment evidence and the final live asset identity are appended below after
the static upload completes.

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
