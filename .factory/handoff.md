# Proof Pile polish 4 handoff — 29 August 2026

## Outcome

All cumulative repository, copy, demo, claims, routing, mobile, accessibility,
privacy, offline, and release-exposure work is complete and deployed at
<https://photo-proof-pile.sociobot.in>.

The recurring unsigned-package defect is contained in every channel under this
work order:

- the workflow has no unsigned macOS or Windows fallback;
- publication requires Authenticode, Apple signing, notarization, Gatekeeper,
  and independent downloaded-asset verification;
- the verified marker is emitted only after those checks;
- all 11 historical public releases without that marker were changed to
  private drafts, preserving their tags and assets while removing public
  access;
- the live dialog exposes zero package or release links; and
- both installers exit without writing a package when no trusted release is
  public.

There is no signed public desktop release because the repository and factory
environment contain no owner signing credentials. Those credentials cannot be
created or substituted by this repair. The website remains available, and the
Tauri desktop artifact class and release matrix remain unchanged.

## Source and deployment

- Base: `1ab50925f38ae9da34fa4489a4aaa37acb1c7573`
- Release-gate commit: `f9094139f428cbfb290aecfc8bf823bc5fe2bfbc`
- Final repaired source: `55a357715a64ac7bcbfbc9f4ade0a53cbfce1b06`
- Static deployment: `5dbc2860-6ab0-4065-87fe-f2cb2c3beb28`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Failed-closed release run:
  <https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33273116306>
- Finding-by-finding record: `.factory/polish-4.md`
- Evidence: `.factory/polish-4-artifacts/`

## Verification

From a clean clone of `55a357715a64ac7bcbfbc9f4ade0a53cbfce1b06`:

- `npm ci`: passed; zero audit vulnerabilities.
- Every command in `.factory/claims.json`: 22 of 22 passed separately.
- Claim registration audit: 22 IDs, each with exactly one test tag.
- `npm test`: 10 Rust, 11 Vitest, and 30 Playwright tests passed.
- `npm run check`: TypeScript, Rust format, and strict Clippy passed.
- `npm run build`: passed and produced `dist/site`.
- Output budgets: initial JavaScript 42.60 KiB raw / 14.91 KiB gzip; CSS
  18.56 KiB raw / 5.09 KiB gzip; hero WebP 29,922 bytes.

Additional verification:

- `actionlint 1.7.12 .github/workflows/release.yml`: passed.
- `CI=true npm run build:desktop -- --bundles deb,rpm`: passed.
- DEB: `proof-pile`, `0.1.14`, `amd64`, SHA-256
  `2c66565ae5727a5b26f5ebf18d0c3b82b28b933764a8ea087a8203829ab4b5e9`.
- Desktop Xvfb smoke test: stayed running for the full intentional eight-second
  timeout; only expected headless EGL warnings appeared.
- Worker `verify-url.sh`: live `/` and `/demo` passed with correct title,
  language, one h1/main, alt text, labeled controls, and no application errors.
- Live browser audit: `/`, `/demo`, `/?demo=1`, `/app`, `/privacy`, `/terms`
  returned 200; an unknown route returned the designed HTTP 404. Route titles,
  canonical metadata, legal links, focus, Back scroll, and sample isolation
  passed.
- Live axe: zero serious or critical findings across five routes in light and
  dark and on the 390 px mobile demo.
- Mobile/reflow: no horizontal overflow at 390 px or 200% text; checked touch
  targets are at least 44 px; reduced motion is active.
- Privacy/offline: normal flows made no off-origin requests, and the demo
  reloaded offline with all three sample groups.
- Live Lighthouse: performance 100, accessibility 100, best practices 100,
  SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 0 ms, CLS 0, 137 KiB transfer.
- Public GitHub release list: empty after all unverified releases were drafted.
  Live dialog and Linux installer both refuse to expose or install a package.

## Needs operator action

Signed desktop publication is blocked only by owner-held identity material.
Add these GitHub Actions secrets:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`
- `WINDOWS_CERT_PFX`
- `WINDOWS_CERTIFICATE_PASSWORD`

Then bump to the next version, push its `v*` tag, and let the existing workflow
build and verify the full matrix. Do not make any draft release public unless
the run publishes `DESKTOP_SIGNATURES_VERIFIED.json` after both independent
signature-verification jobs pass.

## Known gaps

- Signed Windows and signed/notarized macOS binaries cannot be produced until
  the operator supplies the credentials above. No unsigned substitute remains
  publicly available.
