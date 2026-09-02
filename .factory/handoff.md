# Proof Pile — verification 23 handoff

## Current outcome

**FAIL — release blocker.** Independent QA of candidate
`36734eeecd6f0ff8e4971f3d8ac8322953521633` found the live site deployed from
that exact commit, but its desktop download dialog offers no packages. The
only public complete release is `v0.1.27` targeting
`c77f662186677f7514fd1a7aea51b74013f74b22`, so it cannot be offered safely to
this candidate. Publish a matching versioned desktop release and verify its
checksums before changing this outcome.

Full independent evidence is in `.factory/verification-23.md`. No product
source or deployment was changed by verification.

---

# Historical repair 16 handoff

## Outcome

**PASS.** The release/installability blocker in `.factory/verification-22.md`
is repaired and production now has one desktop identity across the tagged
source, published packages, checksum record, manifest, download resolver, and
deployed footer.

- Accepted repair source: `c77f662186677f7514fd1a7aea51b74013f74b22`
- Immutable release: [v0.1.27](https://github.com/B-Divyesh/sf-photo-proof-pile/releases/tag/v0.1.27)
- Release workflow: [run 33579964700](https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33579964700)
- Production: <https://photo-proof-pile.sociobot.in>
- Demo: <https://photo-proof-pile.sociobot.in/demo>

`v0.1.27`, its GitHub `target_commitish`, `latest.json`, all package URLs,
and the deployed page's source link now identify `c77f662…`. The only reason
this is a successor of the verifier's `fe01d819…` candidate is that its
`0.1.26` version was already immutably tagged to the earlier source. The
repair therefore makes the required versioned release identity explicit as
`0.1.27`; it does not point the candidate page at an older package.

## Reproduction and repair

Before changing code, the exact reported failure was reproduced:

```text
candidate=fe01d819990d8cab9e2aba148b388c214b8c84dd
release_tag=v0.1.26
release_target=11b315afb2a454b8618659fd648a6e8e1e069ce8
identity_match=false
```

Evidence: `.factory/repair-16-artifacts/reproduced-release-identity.json`
and `reproduced-release-identity.txt`.

The repair bumps every shipped version identity to `0.1.27` and adds
`scripts/verify-published-release.sh`. Immediately after publication, the
release workflow now verifies the public GitHub release tag and target commit,
the `latest.json` version/commit and immutable URLs, the manifest's complete
package-name set, and a `SHA256SUMS` entry for every package. It retries public
metadata briefly to account for GitHub propagation. The workflow already
downloads a published AppImage and compares its actual SHA-256 afterwards.

Regression coverage includes a fixture for verifier 22's exact
`v0.1.26`/`fe01d819…` mismatch; it asserts that publication verification exits
before any package can be accepted. The release-picker tests now derive the
tag from `package.json`, preventing an old tag fixture from masking a version
bump. The existing `@claim:desktop-release-identity` browser coverage still
proves the running site refuses a complete package set from another commit.

## Local verification

From `c77f662…`:

```sh
npm ci
CI=1 npm test
npm run check
BUILD_COMMIT=c77f662186677f7514fd1a7aea51b74013f74b22 npm run build
CI=true BUILD_COMMIT=c77f662186677f7514fd1a7aea51b74013f74b22 \
  npm run build:desktop -- --bundles deb,rpm
```

- Clean `npm ci`: 66 packages, 0 reported vulnerabilities.
- `CI=1 npm test`: Rust 11/11, Vitest 16/16, Playwright 36/36 passed.
- `npm run check`: TypeScript, rustfmt, and Clippy with warnings denied passed.
- Every exact command in `.factory/claims.json` passed separately: 25/25.
- Production build passed. Initial JavaScript is 14.03 KiB gzip; CSS is
  5.11 KiB gzip; both remain within the product budgets.
- The first local native build reproduced the expected clean-worker missing
  `glib-2.0.pc` prerequisite. Installing the exact GTK/WebKit packages already
  declared in `.github/workflows/release.yml` made the unchanged DEB/RPM build
  pass.
- Local DEB SHA-256:
  `bf818774ffc6b7ea3366ddc7e78e37db1aba0fb0b43262f8604ea4273e7e5098`.
  A freshly extracted package stayed open under Xvfb for eight seconds
  (expected `timeout` status 124).

## Published release and consumer checks

GitHub Actions completed macOS arm64/x64 DMGs, Windows MSI/EXE, and Linux
AppImage/DEB/RPM from `c77f662…`, then published the nine expected assets,
`SHA256SUMS`, and `latest.json`.

```text
v0.1.27 target: c77f662186677f7514fd1a7aea51b74013f74b22
AppImage: Proof-Pile_0.1.27_amd64.AppImage (79,030,776 bytes)
SHA-256:  9b0a8d8f6b79f157b402058c64c4fd95b0fbfd7cb7e51d4a688a11a5732428f8
```

`scripts/verify-published-release.sh` passed against the public release. The
live `install.sh` installed the AppImage into an isolated `XDG_BIN_HOME` only
after the same checksum matched. This worker has no FUSE device, so direct
AppImage mounting correctly could not start; its extracted `AppRun` launched
under Xvfb for eight seconds (expected timeout 124).

## Production verification

The exact tagged site build was deployed with:

```sh
swa deploy dist/site --env production \
  --app-name sf-photo-proof-pile --resource-group sociobot
```

- The fleet URL verifier passed live `/` and `/demo`: correct titles and
  `lang`, exactly one H1 and main, no missing alt text or unlabeled buttons,
  and no console/page errors. Evidence is in
  `.factory/repair-16-artifacts/live-root/` and `live-demo/`.
- The live footer names `c77f662…`. The real desktop dialog shows four links,
  all to `v0.1.27` assets, including separate Apple-silicon and Intel DMGs.
- Live demo privacy recorded no off-origin requests. Eight live Axe checks
  (four routes in light and dark) found 0 serious/critical findings.
- At 390px, `/`, `/demo`, `/app`, `/privacy`, `/terms`, and the real 404 had
  no normal or 200%-text overflow and no visible target below 44px.
- The service worker `proof-pile-v22` controlled `/demo`, had no waiting
  update, and reloaded the three-group sample while offline with HTTP 200.
- Root headers retain CSP with header-delivered `frame-ancestors 'none'`,
  HSTS, `nosniff`, strict referrer policy, and camera/microphone/geolocation
  permissions policy. Hashed JavaScript is one-year immutable; unknown paths
  return HTTP 404.
- Live Lighthouse mobile: Performance 99, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.0 s, LCP 1.2 s, TBT 120 ms, CLS 0, transfer 138 KiB.
- Checkout returned HTTP 303. Invalid-license verification returned
  `{valid:false}`, exact-origin CORS, and `Cache-Control: no-store`.

## Known operator action

The release workflow confirms the disclosed unsigned state: macOS packages
lack Developer ID distribution signing and Windows packages are Authenticode
`NotSigned`. Owner-held Apple and Windows signing credentials are still needed
to sign a later release. The current download dialog and README state this
plainly; it is not a release blocker for the truthfully labelled v0.1.27
packages.
