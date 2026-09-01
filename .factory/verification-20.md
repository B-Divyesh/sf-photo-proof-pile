# Independent product verification 20 — FAIL

Date: 1 September 2026 (UTC)  
Candidate: `10c5525cc2c227d275296ba1cb583b1a83f3c8d1`  
Live URL: <https://photo-proof-pile.sociobot.in>  
Demo URL: <https://photo-proof-pile.sociobot.in/demo>

## Decision

**FAIL.** The local and live web experience passed the checks below, but the
candidate does not meet the desktop release contract. There is no published
desktop release for this candidate, and the required product-unlock request
allowance did not return its required response after the observed allowance.

No product code was changed during this verification.

## First-read and demo check — PASS

Confirmed from a fresh 1440 × 900 browser context that the cold page states:

- what it does: “Review photo copies before you remove them”;
- who it is for: people with photos across several drives who fear removing
  the only meaningful copy; and
- what to click first: **Try it with sample data**, which says it opens three
  ready-to-review groups.

Checked that one click opened `/demo`, showed the persistent “Demo — sample
data, nothing is saved” banner, and loaded three groups. The checked flow
marked two exact extras, confirmed the named quarantine destination, completed
the move, and downloaded `proof-pile-decisions.csv`.

## Claims and local checks — PASS

Confirmed that `.factory/claims.json` exists and contains 22 declared claims.
After `npm ci` from the clean checkout, every listed command was run exactly as
written through the demo entry point. The complete test run also confirmed the
same results: 11 Rust tests, 12 Vitest tests, and 33 Playwright tests passed;
`test-results/.last-run.json` records `status: "passed"`.

Checked that these additional commands passed:

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 66 packages installed; npm reported zero vulnerabilities. |
| `npm test` | PASS — Rust 11/11, Vitest 12/12, Playwright 33/33. |
| `npm run check` | PASS — TypeScript, rustfmt, and Clippy with warnings denied. |
| `npm run build` | PASS — created `dist/site`. |
| `npm run test:unit -- --testNamePattern @claim:windows-installer-checksum` | PASS. |
| `npm run test:unit -- --testNamePattern @claim:installer-checksum` | PASS. |

Checked that the static build contains 43,304 raw bytes of JavaScript
(15,166 bytes gzip) and 18,644 bytes of CSS (5,104 bytes gzip). The 29,922-byte
hero image and the initial bundles are within the stated budgets.

## Live web, privacy, accessibility, and PWA checks — PASS

Confirmed that locally built `index.html`, the main JavaScript bundle, the CSS,
and all other 27 served build files match the live host byte-for-byte. The
static deployment therefore matches the candidate’s web build.

Checked that `/`, `/demo`, `/app`, `/privacy`, and `/terms` returned HTTP 200
with route-specific titles, one `h1`, one `main`, and `lang="en"`. Checked that
an unknown route returned HTTP 404. The worker URL verifier passed for `/` and
`/demo`, reporting no missing image alternative text, no unlabeled buttons, and
no page or console errors.

Checked that Playwright Axe scans of `/`, `/demo`, `/privacy`, and `/terms`
reported zero serious or critical findings. At 390 px, the demo measured
390 px scroll width against a 390 px client width, showed its banner, and its
main action was 44.39 px high. Keyboard focus on the sample action was visible
as a 3 px solid outline. With reduced motion selected, animation and transition
durations were reduced to `1e-05s`.

Confirmed that the complete live demo request log contained only same-origin
requests and no console or page errors. Checked that the service worker
controlled `/demo`; after the first load, an offline reload returned HTTP 200
with the demo banner and all three groups. Response checks confirmed CSP with
header-delivered `frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin
referrer policy, and disabled camera, microphone, and geolocation. HTML and
the service worker use 30-second revalidation; the hashed JavaScript bundle is
`max-age=31536000, immutable`; an ETag conditional root request returned 304.

## Findings

### Severity 1 — desktop release acceptance

1. **No public desktop release or installable package set exists for v0.1.23.**
   Checked GitHub’s public release endpoint: `GET /releases/latest` returned
   HTTP 404, and the candidate commit has no version tag. The live download
   dialog correctly offers no package and settles on “Downloads are not
   published yet.” The live Linux installer correctly stops with “A trusted
   Linux release is not published yet. Nothing was installed.” This safe
   behavior is preferable to offering an unchecked file, but it does not meet
   the desktop-app requirement for published macOS, Windows, and Linux assets,
   checksums, and `latest.json`.

   Required resolution: provide the owner-held signing credentials, tag the
   exact v0.1.23 source, complete the release workflow, publish the full asset
   set and verification files, and then check a downloaded asset against
   `SHA256SUMS`.

2. **The product-unlock request allowance was not observed.**
   Checked the documented product verification endpoint from one client using
   a non-active test token. Requests 1–38 each returned HTTP 200. None returned
   HTTP 429 or a `Retry-After` header. Earlier product reports record an
   allowance of 30 requests per client window, so request 31 should have
   returned 429 with `Retry-After`.

   Required resolution: restore the product verification endpoint’s per-client
   allowance and check that request 31 returns HTTP 429 with `Retry-After`.

## Native-package check

Checked that the plain `npm run build:desktop` command receives `--ci 1` from
this worker and stops before compilation because this Tauri CLI accepts only
`true` or `false`. With `CI=true`, the first package attempt correctly reported
the missing GTK/WebKit development prerequisites. After installing the exact
Linux prerequisites named in the release workflow,
`CI=true npm run build:desktop -- --bundles deb,rpm` passed and created:

```text
Proof Pile_0.1.23_amd64.deb       4,106,312 bytes
Proof Pile-0.1.23-1.x86_64.rpm    4,106,865 bytes
```

This local prerequisite condition does not change the two release acceptance
findings above.

## Final result

**FAIL — candidate `10c5525cc2c227d275296ba1cb583b1a83f3c8d1` is not accepted.**
The web product is verified, but its desktop release and request-allowance
requirements remain incomplete.
