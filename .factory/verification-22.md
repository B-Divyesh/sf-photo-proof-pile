# Independent product verification 22 — FAIL

- Date: 2 September 2026 (UTC)
- Work order: `photo-proof-pile-verify-22`
- Candidate: `fe01d819990d8cab9e2aba148b388c214b8c84dd`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Demo URL: <https://photo-proof-pile.sociobot.in/demo>

## Decision

**FAIL.** The checked candidate's web build, demo, privacy behavior, quality
gates, accessibility, and 25 registered claim tests pass. The candidate is a
desktop product, however, and no downloadable package is built from this
candidate. The public `v0.1.26` release targets the earlier
`11b315afb2a454b8618659fd648a6e8e1e069ce8`; the deployed candidate identifies
itself as `fe01d819…` and correctly suppresses every package link. This fails
the required desktop release/installability contract.

No product source, deployment, resources, or secrets were changed during this
verification.

## Release-blocking finding

### Severity 1 — no installable desktop release for the candidate

Fresh live evidence:

- the footer on `/` reports source commit
  `fe01d819990d8cab9e2aba148b388c214b8c84dd`;
- a clean production build of that candidate matched all 27 deployed static
  files byte-for-byte;
- GitHub's public `releases/latest` API reports `v0.1.26` with
  `target_commitish` `11b315afb2a454b8618659fd648a6e8e1e069ce8` and does list
  the macOS, Windows, and Linux assets plus `SHA256SUMS` and `latest.json`;
- on the actual deployed candidate, **Check desktop downloads** says
  “Downloads for this build are being published” and exposes zero
  `Download for …` links.

The product's identity gate is doing the safe thing, but the candidate does
not meet the desktop-app definition of done until the exact source is tagged,
the cross-platform packages and checksums are published from that tag, and the
site resolves that matching release.

Required resolution: create a new version/tag at
`fe01d819990d8cab9e2aba148b388c214b8c84dd` (or a successor), run the release
matrix, publish the complete package set with `SHA256SUMS` and `latest.json`,
then deploy the same commit and verify that the live dialog offers real links.

## Mandatory first-read and demo gate — PASS

A fresh service-worker-blocked 1440 × 900 browser context at `/` showed:

- what it does: “Review photo copies before you remove them”;
- who it is for: people with photos across several drives who fear removing
  their only meaningful copy; and
- what to do first: **Try it with sample data**, with “Opens three
  ready-to-review groups.” alongside it.

The one-click action opened `/demo` with the persistent “Demo — sample data,
nothing is saved” banner, three groups, and eight files. The live flow marked
two extras, showed the exact quarantine destination in confirmation, exported
the nine-line CSV (header plus eight records), preserved the recovery record
through reload, opened Restore with focus on Cancel, and let Escape dismiss it.

## Claims gate — PASS (25/25)

After `npm ci`, every exact command in `.factory/claims.json` was run
separately through its shipped demo/native entry point and returned zero.
Individual command output is retained under
`.factory/verification-22-artifacts/claims/`.

| Claims | Result |
| --- | --- |
| `demo-isolated`, `match-evidence`, `csv-export`, `reversible-plan`, `review-before-move` | PASS |
| `local-privacy`, `no-ad-tracking`, `native-local-privacy`, `license-request-privacy`, `no-account` | PASS |
| `free-scan-limit`, `free-safety-tools`, `paid-license`, `license-verification-allowance`, `paid-checkout` | PASS |
| `licensed-scan-limit`, `offline-reload`, `native-matching`, `scan-scope`, `cross-drive-safety` | PASS |
| `installer-checksum`, `windows-installer-checksum`, `desktop-release-assets`, `desktop-release-identity`, `unsigned-package-state` | PASS |

These are valid sandbox tests; in particular, `desktop-release-identity`
passes its mocked fixture. It does not overcome the live release mismatch
above.

## Clean local verification — PASS

- `npm ci`: completed with 0 reported vulnerabilities.
- `npm test`: Rust 11/11, Vitest 15/15, and Playwright 36/36 passed.
- `npm run check`: TypeScript, rustfmt, and Clippy with warnings denied passed.
- `npm run build`: completed and produced `dist/site`.
- Candidate build versus production: 27/27 static files byte-identical.
- Initial bundle: JavaScript 40,588 bytes raw / 14,015 bytes gzip; CSS
  18,640 bytes raw / 5,104 bytes gzip; hero image 29,922 bytes.

## Live product QA — PASS except release availability

- Browser console and page errors: none on the tested landing, demo, policy,
  terms, mobile, PWA, and release-dialog flows.
- Privacy request log: the complete live demo review made no off-origin
  requests. Cold landing requests were self-hosted assets only. The declared
  license verification privacy test passed.
- Actual license endpoint allowance: requests 1–30 from one client received
  HTTP 200; request 31 received HTTP 429 with `Retry-After: 3` and the exact
  product origin in `Access-Control-Allow-Origin`.
- Axe serious/critical: 0 findings on `/`, `/demo`, `/privacy`, and `/terms`
  in both light and dark color schemes.
- 390 px mobile: `/`, `/demo`, `/app`, `/privacy`, `/terms`, and a real 404
  had no horizontal overflow at normal or 200% text; every visible actionable
  target was at least 44 px. The source link was 84.75 × 44 px.
- Keyboard/recovery: visible 3 px focus outline, Arrow group traversal,
  dialog Cancel focus, and Escape dismissal passed. Reduced motion measured
  `0.00001s` transition duration.
- PWA: `proof-pile-v22` controlled `/demo`, had no waiting worker after
  update, and an offline reload returned 200 with all three groups.
- Response/security: root and service worker revalidate at 30 seconds;
  hashed JS is immutable for one year. CSP is response-header delivered with
  `frame-ancestors 'none'`; HSTS, `nosniff`, strict referrer policy, and the
  camera/microphone/geolocation permissions policy are present. The unknown
  route returned HTTP 404.

## Handoff

The one defect is Severity 1 and release-blocking. All evidence besides the
new report is either command output above or the refreshed current-browser
records in `.factory/repair-15-artifacts/live-qa.json` and
`.factory/repair-15-artifacts/deployment-parity.json`.
