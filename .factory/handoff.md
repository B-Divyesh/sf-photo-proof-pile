# Proof Pile polish 3 handoff — 29 August 2026

## Result

The cumulative product repair is implemented, tested, pushed, and deployed at
<https://photo-proof-pile.sociobot.in>. The hash route, `/app` metadata,
review-before-move boundary, sitemap, 404 shell, catalog copy, and signed-release
gate are repaired without changing the archival light-table visual identity.

Static deployment ID: `38ac84a2-25c6-4514-9aef-e55697378e13`.

Repair commits: `3cc76fd`, `c19ecd6`; this handoff is committed on `main`.

## What changed

- `/#how` now survives SPA navigation, scrolls to the steps, receives keyboard
  focus, and works from home, policy routes, and a direct address-bar load.
- `/app` now uses the product-first title “Proof Pile — Review photo copies”
  with matching route metadata.
- `.factory/claims.json` now includes `review-before-move`. Its command runs a
  native rejection test and the browser confirmation/payload test.
- Native quarantine accepts a reviewed plan, rejects non-quarantine entries,
  rejects plans without a readable kept copy, and moves only after the UI
  confirms the exact count and chosen destination.
- `/app` is in the sitemap; the static 404 carries the full header navigation.
- Release CI no longer publishes unsigned macOS or Windows fallbacks. It
  requires signing credentials, verifies Authenticode and Apple notarization,
  and publishes `DESKTOP_SIGNATURES_VERIFIED.json` only after those checks.
- The download dialog shows signed/notarized wording only when that verified
  release marker exists. Current unsigned release wording remains honest.
- The catalog description is now: “Review photo copies, quarantine extras,
  and keep a reversible decision log.”

## Verification evidence

- All 20 claim commands passed individually from clean clone
  `/tmp/tmp.k6Wb7qPPOy/repo` at commit `f066733`.
- Full clean-clone `npm test`: 10 Rust, 10 Vitest, 28 Playwright tests passed.
- `npm run check`: TypeScript, Rust formatting, and Clippy passed.
- `npm run build`: `dist/site` produced; JS 14.90 kB gzip, CSS 5.09 kB gzip.
- Local Lighthouse mobile: 100 performance, 100 accessibility, 100 best
  practices, 100 SEO; LCP 1.6 s; CLS 0; 138 KiB.
- Live Lighthouse mobile: 100/100/100/100; LCP 1.2 s; CLS 0; 137 KiB.
- Live cold audit: 200 for `/`, `/demo`, `/app`, `/privacy`, and `/terms`; 404
  for `/missing-frame`; one h1/main and zero axe serious/critical findings on
  each. `/app` title and social metadata are product-first.
- Live demo: direct `?demo=1`, three seeded groups, isolated session changes,
  reset, exit, real-data preservation, and offline reload all passed.
- Live `/#how`: hash retained, `#how-title` focused, target top `0` after scroll.
- `verify-url.sh`: no root console errors; `lang=en`, one h1, main, alt text,
  and labeled buttons passed.
- Evidence: `.factory/evidence/polish-3/local/` and
  `.factory/evidence/polish-3/live/`.
- Finding-by-finding evidence: `.factory/polish-3.md`.

Run locally:

```sh
npm ci
npm test
npm run check
npm run build
```

## Known gap requiring operator credentials

The published v0.1.10 Windows and macOS assets are still unsigned. GitHub
reports zero repository signing secrets, and Azure reports no Trusted Signing
account. Therefore recurring F-1-34/F-2-2/F-3-1 cannot be truthfully marked
closed from this worker. The workflow now prevents another unsigned release.

Add these repository secrets, then dispatch `.github/workflows/release.yml`:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`
- `WINDOWS_CERT_PFX`
- `WINDOWS_CERTIFICATE_PASSWORD`

The workflow must pass its signature checks and publish
`DESKTOP_SIGNATURES_VERIFIED.json`. Then update the README after confirming the
new release assets. No source-code TODO remains.
