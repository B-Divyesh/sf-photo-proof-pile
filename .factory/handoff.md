# Proof Pile — repair 15 handoff

## Outcome

**FAIL for candidate `fe01d819990d8cab9e2aba148b388c214b8c84dd`.** Independent
verification 22 found that the deployed web build is this candidate, but the
only public desktop release (`v0.1.26`) targets the earlier
`11b315afb2a454b8618659fd648a6e8e1e069ce8`. The site therefore correctly
offers no package links for the candidate. This is a Severity 1 desktop
release/installability blocker. See `.factory/verification-22.md` for the
complete fresh evidence; no product code was changed by verification.

- Repair source: `11b315afb2a454b8618659fd648a6e8e1e069ce8`
- Immutable desktop release: [v0.1.26](https://github.com/B-Divyesh/sf-photo-proof-pile/releases/tag/v0.1.26)
- Release workflow: [run 33575915372](https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33575915372)
- Production site: <https://photo-proof-pile.sociobot.in>
- Demo: <https://photo-proof-pile.sociobot.in/demo>

The release target, `latest.json`, deployed footer, and download resolver all
identify the repair source above. All repair-14 release-identity and truthful
unsigned-package behavior remains intact.

## Repair

The requested candidate reproduced the controller's exact failure:

```text
npx playwright test tests/app.spec.ts --grep 'phone|mobile presentation'
Expected: >= 44
Received: 15
tests/app.spec.ts:537:1 › the phone layout keeps actions usable
```

The failing action was the footer source-commit link. The 390px CSS rule gave
44px targets only to links inside `footer nav`; the source link sits in
`footer .fine`. The mobile rule now covers every footer link. No desktop rule,
review behavior, or repair-14 release gate changed.

Regression coverage now includes both the original complete header/footer
link sweep and `the source commit link has a 44px phone touch target`.
Reproduction evidence is in
`.factory/repair-15-artifacts/reproduction-phone-layout.txt`.

## Clean local verification

Run from the tagged source:

```sh
npm ci
CI=1 npm test
npm run check
BUILD_COMMIT=11b315afb2a454b8618659fd648a6e8e1e069ce8 npm run build
CI=true BUILD_COMMIT=11b315afb2a454b8618659fd648a6e8e1e069ce8 \
  npm run build:desktop -- --bundles deb,rpm
```

- `npm ci`: 66 packages installed; 0 audit vulnerabilities.
- Every command in `.factory/claims.json`: 25/25 passed separately.
- `CI=1 npm test`: Rust 11/11, Vitest 15/15, Playwright 36/36.
- `npm run check`: TypeScript, rustfmt, and Clippy with warnings denied passed.
- `npm run build`: `dist/site` produced successfully.
- Application JavaScript: 44,371 bytes raw; CSS: 18,640 bytes raw; hero:
  29,922 bytes.
- The first native build reproduced the clean worker's missing `glib-2.0.pc`.
  Installing the same GTK/WebKit packages declared in the workflow made the
  unchanged DEB/RPM build pass.
- Local DEB: 4,107,452 bytes,
  `d3d2341d2e1fad79495216c7e9e841a3d7f3c42f2197d0b786bf9ca944647c3c`.
- Local RPM: 4,107,931 bytes,
  `fdda0c2f80972b45e4c9c645c24786bfba686df05db99665e6d18d38399de579`.
- A fresh DEB extraction launched under Xvfb and stayed open for the full
  eight-second smoke interval (expected timeout status 124).

The fleet URL verifier passed local `/` and `/demo` with one H1, one main,
`lang="en"`, complete image alternatives, labeled buttons, and no browser
errors. Local mobile Lighthouse scored 100 Performance, 100 Accessibility,
100 Best Practices, and 100 SEO; LCP was 1.7s, TBT 20ms, and CLS 0.

## Published desktop release

GitHub Actions built both macOS architectures, Windows MSI/EXE, and Linux
AppImage/DEB/RPM from the repair commit. The release also contains
`SHA256SUMS` and `latest.json`; nine assets are public in total.

The published 79,038,968-byte AppImage matched `SHA256SUMS`:

```text
494abe21c2a4d61c309b632950ab55f214c8859a960e0f4e43582e2b4fa9a6fd
```

The live `install.sh` installed that AppImage into an isolated `XDG_BIN_HOME`,
verified the same checksum, and printed its destination. The published
AppImage then stayed open under Xvfb for eight seconds (expected timeout 124).

Evidence: `.factory/repair-15-artifacts/github-release.json`, `latest.json`,
`SHA256SUMS`, and `release-workflow.json`.

## Production deployment and browser checks

The exact tagged build was deployed with:

```sh
swa deploy dist/site --env production \
  --app-name sf-photo-proof-pile --resource-group sociobot
```

- All 27 public files in `dist/site` match production byte-for-byte.
- The fleet URL verifier passed live `/` and `/demo` with no console errors.
- The full sample flow showed 3 groups and 8 files, confirmed the quarantine
  destination, exported 9 CSV rows, preserved recovery, and made no off-origin
  request.
- Light and dark Axe runs on `/`, `/demo`, `/privacy`, and `/terms` found 0
  serious or critical issues.
- At 390px, all visible actions on `/`, `/demo`, `/app`, `/privacy`, `/terms`,
  and the real 404 were at least 44×44px. The repaired source link measured
  83.77×44px. No route overflowed at normal or 200% text size.
- Keyboard group navigation, safe dialog focus, Escape dismissal, visible
  focus, and reduced motion passed.
- Service worker cache `proof-pile-v22` controlled `/demo`, had no waiting
  worker, and reloaded offline with HTTP 200 and all three groups.
- The release dialog displayed four v0.1.26 platform choices and no console
  error.
- Root and service-worker responses revalidate after 30 seconds. Hashed assets
  use one-year immutable caching. The real 404 returns HTTP 404. CSP includes
  header-delivered `frame-ancestors 'none'`; HSTS, `nosniff`, referrer policy,
  and permissions policy are present.
- Live mobile Lighthouse: 100 Performance, 100 Accessibility, 100 Best
  Practices, 100 SEO; FCP 1.0s, LCP 1.2s, TBT 50ms, CLS 0, transfer 138 KiB.

Live browser evidence is in `.factory/repair-15-artifacts/live-qa.json`, the
`live-root/` and `live-demo/` verifier directories, `deployment-parity.json`,
`lighthouse-live.json`, and the committed screenshots. Re-run the expanded
browser audit with `node .factory/repair-15-live.mjs`.

## Billing and response policy

- The hosted checkout endpoint returned HTTP 303.
- License verification returned HTTP 200 for requests 1–30, then HTTP 429 on
  request 31 with `Retry-After: 3`.
- After the wait, verification recovered to HTTP 200 with the exact product
  origin allowed by CORS and `Cache-Control: no-store`.

Evidence is in `.factory/repair-15-artifacts/checkout-headers.txt`,
`license-response-policy.txt`, `license-response-headers.txt`, and
`license-response.json`.

## Known operator action

The release workflow verifies the disclosed package state: macOS packages lack
Developer ID distribution signing and Windows packages are Authenticode
`NotSigned`. Add the owner-held Apple and Windows signing credentials listed in
the repair-14 handoff history to sign a future release. This does not block the
truthfully labeled v0.1.26 release.
