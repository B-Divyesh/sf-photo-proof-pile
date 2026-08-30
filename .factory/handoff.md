# Proof Pile independent verification 15 handoff — FAIL

## Outcome

Candidate `b12e0a1c18afff887c7b93b4a98cc1537e429c77` was independently tested
against <https://photo-proof-pile.sociobot.in> on 30 August 2026 UTC.

**FAIL.** The core app, demo, claims, local builds, deployment parity,
accessibility, privacy behavior, offline support, performance, and public
desktop distribution passed. The live Sociobot billing service did not:
checkout and license verification repeatedly returned HTTP 503 through the
final 02:47:45Z probe. New buyers cannot purchase the advertised US$29 license,
and browser verification logs CORS/network errors on the generic 503 response.

The full report is `.factory/verification-15.md`. Evidence is under
`.factory/verification-15-artifacts/`. No product code was changed.

## Verification summary

- All 22 exact `.factory/claims.json` commands: PASS.
- First-read and one-click sample demo gate: PASS.
- `npm ci`: PASS; 66 packages, zero vulnerabilities.
- `npm test`: PASS; 10 Rust, 11 Vitest, 31 Playwright tests.
- `npm run check`: PASS.
- `npm run build`: PASS; `dist/site` produced.
- `CI=true npm run build:desktop -- --bundles deb,rpm`: PASS after installing
  the workflow's documented Linux packages.
- Live end-to-end quarantine/export/import/restore and invalid recovery: PASS.
- Desktop, 390 px mobile, 200% text, keyboard, focus, reduced motion, and axe:
  PASS; zero serious/critical axe findings.
- Service-worker update and offline `/demo` reload: PASS.
- Browser request log: demo flow same-origin only; no tracking or photo upload.
- Security/caching headers: PASS.
- Rate limit: 30 successful license requests; request 31 returned 429 with
  `Retry-After: 3`.
- Deployment parity: 27/27 public build files matched byte for byte.
- Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.13 s, TBT 100 ms, CLS 0.
- Public v0.1.17 release: PASS; all seven workflow jobs and all ten public
  checksum entries passed. Public AppImage and local DEB smoke tests passed.
- Live checkout/license service: **FAIL — HTTP 503**.

## Defects

### Severity 1 — release blocking

1. The one-time purchase path is unavailable. The checkout endpoint returns
   503 rather than hosted checkout. License verification also returns 503 and
   its generic response lacks CORS headers.

No Severity 2 or Severity 3 defects were found.

## How to reproduce the blocker

```sh
curl -i https://api.sociobot.in/api/v1/products/photo-proof-pile/checkout
curl -i -H 'Origin: https://photo-proof-pile.sociobot.in' \
  'https://api.sociobot.in/api/v1/products/photo-proof-pile/verify?license=invalid'
```

Both returned 503 at the end of this verification. Before acceptance, restore
the API, verify checkout returns its hosted redirect, verify the license call
returns CORS-enabled `Cache-Control: no-store` JSON, and rerun the documented
30-request allowance / 429 / `Retry-After` recovery check.

## Needs operator action

- Restore or restart the Sociobot API deployment and diagnose why the service
  became unavailable during verification.
- Retest the live checkout and verify endpoints from the product origin.
- Apple and Windows signing credentials remain optional operator work. The
  current unsigned packages are allowed by contract and clearly disclosed.
