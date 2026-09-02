# Proof Pile — repair 14 handoff

## Outcome

**PASS.** The two release blockers in verification 21 were repaired, tested,
published, and deployed.

- Accepted release source: `d61195d2d419a92fb1821562a05e2ff8973874ed`
- Immutable release: [v0.1.25](https://github.com/B-Divyesh/sf-photo-proof-pile/releases/tag/v0.1.25)
- Release target and `latest.json` source: `d61195d2d419a92fb1821562a05e2ff8973874ed`
- Deployed site: <https://photo-proof-pile.sociobot.in>
- Release workflow: [run 33572986244](https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33572986244)

The deployed footer exposes this exact source commit. The live download dialog
resolves only the exact `v0.1.25` release and fails closed when the GitHub
release target or manifest source does not match the compiled site source.

## Repairs

1. Reproduced the verifier's exact historical mismatch before changing code:
   v0.1.23 and its manifest identify
   `10c5525cc2c227d275296ba1cb583b1a83f3c8d1`, rather than candidate
   `f0fd4b8e37c1da44380ab111b368279795c4b815`. Evidence is committed at
   `.factory/repair-14-artifacts/reproduced-release-identity.json` and
   `reproduced-latest.json`.
2. Added an immutable release resolver. It requires matching tag, release
   target commit, manifest commit, complete macOS/Windows/Linux matrix, and
   checksums before presenting any asset. The GitHub Actions workflow verifies
   that the pushed tag dereferences to its checked-out source before publishing.
3. Added the `desktop-release-identity` claim and unit/browser regression
   coverage. It uses the exact historical v0.1.23 target/candidate mismatch
   and proves that mismatched releases yield no download links.
4. Added the observable `unsigned-package-state` claim. The release workflow
   now inspects generated macOS packages for absence of a Developer ID
   distribution signature and Windows MSI/EXE packages for the actual
   Authenticode `NotSigned` state. The public dialog and README state exactly:
   "macOS packages lack Developer ID signing" and "Windows packages are
   unsigned." They advise checking `SHA256SUMS` before opening a package.

## Published release matrix

v0.1.25 contains `latest.json`, `SHA256SUMS`, two macOS DMGs (Apple Silicon
and Intel), Windows MSI and EXE, and Linux AppImage, DEB, and RPM. The public
Linux installer was run into an isolated destination and verified the AppImage
against the published SHA-256:

```text
a2361020a61b54c4abf85418ec8b6f5d0554217eec05db14ae4a916cd38c4ce4
```

## Verification

Completed from a clean dependency install:

```sh
npm ci
CI=1 npm test
npm run check
BUILD_COMMIT=d61195d2d419a92fb1821562a05e2ff8973874ed npm run build
CI=true BUILD_COMMIT=d61195d2d419a92fb1821562a05e2ff8973874ed \
  npm run build:desktop -- --bundles deb,rpm
```

- All 25 registered claim commands pass, including both new claims.
- Unit, Rust, and Playwright suites pass; browser coverage includes desktop,
  390 px mobile, keyboard selection, reduced motion, offline reload, release
  mismatch, checksum, and truthful signing disclosure.
- The local Linux DEB/RPM build completed. An extracted DEB launched under
  Xvfb and remained open as expected.
- `/opt/fleet/lib/verify-url.sh` found no live console errors, one H1, `lang`,
  `main`, or missing image-alt failures on both `/` and `/demo`.
- Live Axe serious/critical findings: 0 on `/` and `/demo`.
- Live Lighthouse (mobile): Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; LCP 952 ms, CLS 0, transferred 141,150 bytes.
- A fresh service-worker-controlled `/demo` context reloaded while offline.
- `swa deploy dist/site --env production` completed successfully. Live browser
  evidence and Lighthouse reports are committed in
  `.factory/repair-14-artifacts/live-root/`,
  `.factory/repair-14-artifacts/live-demo/`, and
  `lighthouse-live-all.json`.

## Run and use

```sh
npm ci
npm run dev
```

Use `/demo` or **Try it with sample data** for the isolated sample workspace.
For desktop releases, use the download dialog on the landing page or the
v0.1.25 release above.

## Known operator action

The v0.1.25 macOS packages are not Developer ID signed/notarized, and Windows
packages are not Authenticode signed. The release is honest about that state.
To sign future releases, configure the product repository's owner-held
credentials: `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`,
`APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`,
`WINDOWS_CERT_PFX`, and `WINDOWS_CERTIFICATE_PASSWORD`.
