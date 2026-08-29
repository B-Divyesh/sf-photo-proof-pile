# Repair 6 handoff — 29 August 2026

## Repair

Independent verification 9 found one release-blocking S1 defect: the live
download flow served `v0.1.10`, whose release commit
`444b4d151296c6f75045a3a1e5f077e267bdffcb` predated the reviewed-plan native
quarantine gate in candidate `601f04c75fc1ff28521d7e955b7ab8350b5b3ffd`.
The static web assets were already current; the installed desktop package was
not.

This repair prepares the successor desktop release as `v0.1.11`.

- The npm, Cargo, Tauri, web footer, and static 404 versions now agree on
  `0.1.11`.
- The release workflow now checks out and releases only `v<package version>`.
  It verifies that the tag resolves to the exact checked-out commit before any
  platform build begins.
- `latest.json` now records the resolved immutable tag commit from the release
  identity job, not a context-dependent `GITHUB_SHA`.
- All matrix package jobs check out that same release tag.
- The signing/notarization gate remains required before a desktop release can
  be published; the repair does not weaken the safety behavior that already
  passed review.
- A unit regression test asserts the release-tag/source identity and the
  immutable `latest.json` commit plumbing.

## Verification before release

Run from a clean dependency install:

```sh
npm ci
npm test
npm run check
npm run build
CI=false npm run build:desktop
```

Evidence collected in this worker:

- `npm ci`: passed; 66 packages installed; `npm audit` reported 0
  vulnerabilities.
- `npm test`: passed: 10 Rust tests, 11 Vitest tests (including the new
  release-identity regression), and 28 Playwright tests.
- `npm run check`: passed TypeScript, Rust formatting, and strict Clippy.
- `npm run build`: passed. `dist/site` was produced with 13.37 kB gzip main
  JavaScript and 5.09 kB gzip CSS.
- `npm run test:claim:review-before-move`: passed. The native core rejected
  unreviewed quarantine plans, and the desktop UI fixture proved exact
  confirmation and payload behavior.
- Local `/demo` post-build audit via `verify-url.sh`: HTTP 200, `Demo — Proof
  Pile`, `lang=en`, one h1, one main landmark, zero missing image alt text,
  zero unlabeled buttons, and zero page/console errors. The Playwright suite
  also ran axe scans at desktop and 390 px with zero serious or critical
  violations, keyboard decision traversal and skip-link checks, 200% text,
  touch target, privacy, offline reload, and license-request coverage.
- Native packaging was run after installing the documented Linux Tauri system
  dependencies. It produced
  `Proof Pile_0.1.11_amd64.deb` and
  `Proof Pile-0.1.11-1.x86_64.rpm`. Debian metadata reports package
  `proof-pile`, version `0.1.11`, architecture `amd64`. The DEB SHA-256 is
  `57a77a10237b6eda2e001c801703a1bd3f8d73ae3472c60158b2de1a74b5ea24`.
- The extracted DEB consumer binary stayed running for a 12-second virtual
  X11 smoke test (intentional `timeout` exit 124; no application crash). The
  container emitted expected headless portal/FUSE warnings because it exposes
  no `/dev/fuse` device.

## Release and deployment status

The signed cross-platform release and static-site deployment are performed
after this repair commit is pushed. Their tag, workflow, checksum, package,
and live-site evidence will be appended here in the final deployment commit.

## Operator prerequisites

The release workflow intentionally refuses unsigned macOS or Windows assets.
It requires these repository secrets before it can publish `v0.1.11`:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`
- `WINDOWS_CERT_PFX`
- `WINDOWS_CERTIFICATE_PASSWORD`

If any are unavailable, GitHub Actions stops in `validate-signing` before a
release is created, rather than publishing an unsafe replacement for the
verified desktop package.
