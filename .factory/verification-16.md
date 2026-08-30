# Independent product verification 16 — PASS

Date: 30 August 2026 (UTC)

- Candidate: `f34a756f9c5a91c2984de06071e5cfdacd565bca`
- Branch: `main`; local `HEAD` and `origin/main` matched the requested commit.
- Live URL: <https://photo-proof-pile.sociobot.in>
- Demo URL: <https://photo-proof-pile.sociobot.in/demo>
- Product/release version: `0.1.18`
- Artifact class: Tauri desktop app with an offline web demo
- Overall result: **PASS**

No product code was modified during this verification. The previous
deployment-only billing outage was independently rechecked and is resolved:
checkout returned a `303` to hosted Dodo checkout and invalid-license
verification returned `200` JSON with `Cache-Control: no-store`. The live
payload matches the candidate build byte-for-byte.

## Required first-read and demo gate

**PASS.** On a cold 1440 x 900 live browser, the first screen said:

- what it does: “Review photo copies before you remove them”;
- for whom: people with photos across several drives who fear deleting the
  only meaningful copy;
- what to do first: **Try it with sample data**;
- what happens next: “Opens three ready-to-review groups.”

The first screen also gave the required plain facts: photos stay on this
device, no account is needed, and the free 1,000-file / US$29 one-time price.
The primary action opens `/demo` in one click. The demo immediately shows
three realistic groups and eight records, with the persistent “Demo — sample
data, nothing is saved” banner plus **Reset demo** and **Start for real**.

## Claims gate

**PASS — 22/22 commands in `.factory/claims.json`.** The manifest exists and
each declared selector was run from this clean checkout after `npm ci`:

`demo-isolated`, `match-evidence`, `csv-export`, `reversible-plan`,
`review-before-move`, `local-privacy`, `no-ad-tracking`,
`native-local-privacy`, `license-request-privacy`, `no-account`,
`free-scan-limit`, `free-safety-tools`, `paid-license`, `paid-checkout`,
`licensed-scan-limit`, `offline-reload`, `native-matching`, `scan-scope`,
`cross-drive-safety`, `installer-checksum`, `windows-installer-checksum`, and
`verified-downloads-only` all passed. The standalone full-suite result is
also recorded by Playwright as `{"status":"passed","failedTests":[]}`.

## Local quality gates and packaging

- `npm ci`: PASS — 66 packages, no audit vulnerabilities.
- `npm test`: PASS — 11 Rust tests, 11 Vitest tests, 33 Playwright tests.
- `npm run check`: PASS — TypeScript, rustfmt, and strict Clippy.
- `npm run build`: PASS — generated `dist/site`.
- `CI=true npm run build:desktop -- --bundles deb,rpm`: PASS after installing
  the exact Ubuntu GTK/WebKit package prerequisites specified by the release
  workflow.
- The generated DEB (4,106,066 bytes) and RPM (4,106,532 bytes) were present.
  A fresh extracted-DEB smoke run in Xvfb stayed open for the intended
  eight-second window (timeout exit 124) with empty stderr.

The static build contains 43,341 bytes of application JavaScript (44,766
bytes including the service worker) and 21,382 bytes of CSS including 404
styles. The main hero is 29,922 bytes and there are no web fonts. A fresh
390px live load transferred 95,877 bytes across six resources. These meet the
app's applicable JS, CSS, font, hero, and first-load budgets.

## Product workflow and recovery

The live sample was exercised through the useful flow: view all three group
types, mark exact extras, confirm the exact two-file quarantine, export the
decision log, reload, open recovery, and cancel safely. The claim suite also
covered native selected-folder scope, 1,000/1,001 scan limits, exact/visual/
metadata-near grouping, copy-before-remove cross-drive moves, collision
avoidance, invalid recovery CSV rejection, restore, and repeated moves.

## Accessibility, privacy, PWA, headers, and rate limit

- `/opt/fleet/lib/verify-url.sh` passed on live `/` and `/demo`: HTTP 200,
  title, `lang=en`, one h1, main landmark, complete image alt text, labeled
  buttons, and no page/console errors.
- Fresh Axe Playwright scans found zero serious/critical issues on `/`,
  `/demo`, `/privacy`, `/terms`, and `/404.html`; the 390px demo scan also
  found zero. There was no mobile horizontal overflow or undersized visible
  target. Reduced motion set transitions to `1e-05s`.
- A complete live demo review/export/recovery flow made 15 requests, all to
  `https://photo-proof-pile.sociobot.in`; no photo data, tracking, third-party
  script, or CDN font request was observed. A license-return browser flow made
  a bodyless GET containing only the token and had no console errors.
- Live headers include a self-only CSP with explicit GitHub/Sociobot API
  connects, `frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrer
  policy, and disabled camera/microphone/geolocation. HTML and `sw.js` cache
  for 30 seconds; hashed JS/CSS cache immutable for one year.
- The service worker was active with no waiting update. After a normal `/demo`
  visit, an offline reload returned 200 and retained all three groups.
- The documented API allowance was confirmed afresh: 30 verification requests
  from one client returned 200; request 31 returned **429** with
  `Retry-After: 4` and the product origin's CORS header.

## Deployment and desktop distribution

The current production build's 27 public files, excluding deployment-only
`staticwebapp.config.json`, matched local `dist/site` SHA-256 values exactly.
The v0.1.18 release has the complete macOS, Windows, and Linux matrix plus
`SHA256SUMS`, `latest.json`, and `DESKTOP_RELEASE_VERIFIED.json`. The published
manifest identifies source `a13260828d9ad3515570504fa35632f806aa0054`; the
requested candidate differs only in factory handoff documentation. A freshly
downloaded Linux DEB matched its published SHA-256:
`f01c6a58a0d57d6a33ad29954983508c268504b3286f54c2f979b319041a4e29`.
macOS and Windows unsigned status is explicitly declared in the release
manifest and landing experience.

## Defects by severity

### Severity 1 — release blocking

None.

### Severity 2 — material

None.

### Severity 3 — minor

None.

## Final decision

**PASS — candidate `f34a756f9c5a91c2984de06071e5cfdacd565bca` is accepted.**
