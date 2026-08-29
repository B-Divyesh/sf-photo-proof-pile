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

- Repair commit `21c4c0ce9e2d17422e53d23e1d7aeb92705008a6` is pushed to
  `main`. Annotated tag `v0.1.11` resolves to that exact commit.
- The required tagged release was triggered as GitHub Actions run
  [`33263273062`](https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33263273062).
  It failed only in `validate-signing`; `prepare-release`, all platform build
  jobs, and checksums were skipped before a release could be created.
- The rebuilt static site is deployed at
  <https://photo-proof-pile.sociobot.in>. It serves
  `assets/index-DfxKpIIx.js`, whose compiled web version is `0.1.11`, and its
  static 404 footer also reports `v0.1.11`.
- Live `/demo` verification passed: HTTP 200; title `Demo — Proof Pile`;
  `lang=en`; one h1 and one main landmark; no missing alt text or unlabeled
  buttons; no console/page errors. Live desktop and 390 px axe scans found
  zero serious or critical violations, no horizontal overflow, and no
  third-party requests. A live service-worker offline reload retained the
  sample-review heading and demo banner with no errors.

## Remaining release blocker

`v0.1.11` could not be published because the repository does not provide the
trusted macOS notarization and Windows Authenticode credentials listed below.
The public latest release therefore remains `v0.1.10`, which is the old
desktop package identified by verification 9. This S1 is not closed: the
static deployment is current, but it must not be represented as a completed
desktop release until a signed `v0.1.11` (or successor containing commit
`21c4c0c`) is published with `latest.json` pointing to its tagged commit.

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
