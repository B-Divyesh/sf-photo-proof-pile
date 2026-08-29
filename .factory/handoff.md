# Proof Pile polish round 1 handoff

## Result

Released the repair as `v0.1.4` from
`214007d84cc4acdee5bc4a6fae30cb95553981c1` and deployed the static site at
<https://photo-proof-pile.sociobot.in>. The deployed build is static deploy
`0b6ae448-14e6-478f-a146-8d8b92e4821d`.

The release workflow succeeded: [run 33239435244](https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33239435244).
The `v0.1.4` GitHub release has 11 assets, including `SHA256SUMS`.

## What changed

- Closed the 34 findings recorded in `.factory/review-1.md`; the complete
  finding-to-evidence map is in `.factory/polish-1.md`.
- Added a direct isolated sample entry at `/?demo=1`, a persistent demo banner,
  reset, and return-to-real action. Demo state uses its own session-storage key.
- Expanded `.factory/claims.json` to 19 observable claims with exact tests.
- Added route-specific metadata, history scroll restoration, a complete styled
  404 page, plain-language copy, consistent labels, and responsive checks.
- Released the desktop artifacts and deployed the repaired static landing site.

## How to run and verify

```sh
npm ci
npm test
npm run check
npm run build
CI=true npm run build:desktop
```

Run every registered claim from a clean clone:

```sh
jq -r '.[].test' .factory/claims.json | while IFS= read -r command; do
  eval "$command"
done
```

## Exact verification evidence

- Fresh `git clone --no-local`, `npm ci`, then all 19 commands in
  `.factory/claims.json`: passed.
- `npm test`: passed — 9 Rust tests, 7 unit tests, and 22 Playwright tests.
- `npm run check` and `npm run build`: passed. Production initial app JS is
  12.65 kB gzip and CSS is 5.03 kB gzip.
- `CI=true npm run build:desktop`: passed; produced Linux `.AppImage`, `.deb`,
  and `.rpm` artifacts locally.
- `/opt/fleet/lib/verify-url.sh https://photo-proof-pile.sociobot.in .factory/evidence/polish-1`:
  passed. Root response was HTTP 200; it found title, `lang=en`, one h1, main,
  image alt coverage, and no console errors.
- Cold live Playwright axe checks at 390 px on `/`, `/demo`, `/?demo=1`,
  `/privacy`, `/terms`, and `/missing-frame`: zero serious/critical violations.
- Cold live functional check: demo banner/reset/exit and isolated storage
  passed; `/privacy` metadata/canonical matched its route; `/missing-frame`
  returned HTTP 404 with no console errors.

## Operator action

Desktop packages are intentionally unsigned. macOS notarization and Windows
Authenticode require the owner-held `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX`
secrets, which were not present in this work order. No product behavior is
blocked by this, and the download page labels the packages as unsigned.
