# Independent product verification 14 — FAIL

Date: 30 August 2026 (UTC)

- Candidate: `0c4d72a226e3f67041d9f8aa87dae94d2e344a4d`
- Branch: `main`; local `HEAD` and `origin/main` matched
- Live URL: <https://photo-proof-pile.sociobot.in>
- Demo URL: <https://photo-proof-pile.sociobot.in/demo>
- Product version: `0.1.16`
- Artifact class: desktop app with an offline web demo
- Overall result: **FAIL**

The web product, native core, local Linux build, claims, accessibility baseline,
privacy behavior, rate limit, offline behavior, and performance all passed.
The candidate is nevertheless not releasable as a desktop app: no public
desktop release or installer is available. GitHub reports zero public releases,
the latest-release endpoint returns 404, and the live download control offers
no package. The current release workflow failed before building because its
required Windows and Apple signing credentials were absent. This is a Severity
1 release blocker under the desktop installer contract.

No product code was changed during verification.

## Mandatory first-read and demo gate

**PASS.** A cold 1440 × 900 context with empty storage showed, in its first
screen:

- what it does: “Review photo copies before you remove them”;
- for whom: “people with photos across several drives” who fear removing the
  only meaningful copy;
- what to click: “Try it with sample data”;
- what follows: “Opens three ready-to-review groups.”;
- three plain facts covering local photos, no account, and the free limit / US$29
  one-time price.

The primary action was visible at y=557. One keyboard or pointer activation
opened `/demo` with three populated groups, eight realistic file records,
evidence fields, and a quarantine plan. The persistent banner said “Demo —
sample data, nothing is saved” and included **Reset demo** and **Start for
real**. Demo state used `demo:photo-proof-pile:session`; the seeded real
`proof-pile:session` value was unchanged after demo edits, reset, and exit.

## Claims gate

**PASS — 22/22 manifest commands.** `.factory/claims.json` exists. After
`npm ci`, every listed command was run separately with its exact selector and
passed.

| Claim | Result |
| --- | --- |
| `demo-isolated` | PASS |
| `match-evidence` | PASS |
| `csv-export` | PASS |
| `reversible-plan` | PASS |
| `review-before-move` | PASS (native and browser halves) |
| `local-privacy` | PASS |
| `no-ad-tracking` | PASS |
| `native-local-privacy` | PASS |
| `license-request-privacy` | PASS |
| `no-account` | PASS |
| `free-scan-limit` | PASS |
| `free-safety-tools` | PASS |
| `paid-license` | PASS |
| `paid-checkout` | PASS |
| `licensed-scan-limit` | PASS |
| `offline-reload` | PASS |
| `native-matching` | PASS |
| `scan-scope` | PASS |
| `cross-drive-safety` | PASS |
| `installer-checksum` | PASS |
| `windows-installer-checksum` | PASS |
| `verified-downloads-only` | PASS |

The landing copy, policies, README, and copy audit were cross-checked against
the claim inventory. No unlisted material product claim was found. The
installer claims test fail-closed behavior; they do not prove that a usable
public installer exists, which is why the distribution defect below still
blocks release.

## Clean-checkout gates and builds

- `npm ci`: PASS; 66 packages installed, zero audit vulnerabilities.
- `npm test`: PASS; 10 Rust tests, 11 Vitest tests, and 30 Playwright tests.
- `npm run check`: PASS; TypeScript, Rust format, and strict Clippy.
- `npm run build`: PASS; production output created in `dist/site`.
- `CI=true npm run build:desktop -- --bundles deb,rpm`: PASS after installing
  the exact Linux system packages declared by the release workflow. The first
  attempt correctly exposed the clean container's missing GLib development
  package and was not a source failure.
- Native launch smoke: PASS; the release binary stayed alive for the intended
  eight-second Xvfb window and wrote no stderr.
- Local packages: 4,103,888-byte DEB and 4,105,068-byte RPM.

The site build contained 42,694 bytes raw / 14,993 bytes gzip of JavaScript,
18,563 bytes raw / 5,092 bytes gzip of CSS, no downloaded fonts, and a 29,922-
byte hero WebP. These are inside the 200 KB JS, 50 KB CSS, 120 KB font, and
300 KB hero budgets.

## Real workflow, boundaries, invalid input, and recovery

Fresh live contexts exercised the smallest useful workflow:

- normal: opened all exact-copy, same-moment, and looks-alike sample groups;
  inspected paths, sizes, dimensions, dates, cameras, identifiers, and
  other-drive counts; marked two exact extras; confirmed the exact count and
  `/Sample drive/Proof Pile Quarantine` destination; moved them; and exported
  a nine-row CSV;
- cancellation: dismissed the exact two-file confirmation and retained the
  pending plan without moving anything;
- invalid safety choice: trying to quarantine the initial kept copy produced
  “Keep one copy in this group…” and kept the plan at zero;
- invalid import: a legacy/edited CSV without a verifiable hash was rejected
  with “The decision log was not imported…” and a concrete instruction to
  export a new log and try again; the plan stayed at zero;
- recovery: a freshly exported CSV restored two verified records after demo
  storage was cleared; the dialog named source and destination, focused the
  safe **Cancel** action, supported Escape, and restored the selected sample
  record;
- persistence and repeat safety: recovery survived reload, completed moves
  left no pending work, and duplicate/hostile recovery records were rejected;
- native boundaries: tests covered empty and invalid roots, 1,000 versus 1,001
  files, changed hashes, path containment, name collisions, source immutability,
  and cross-drive copy-before-remove behavior.

The checkout endpoint was reachable and returned 303 to the hosted Dodo
checkout. No payment was submitted.

## Accessibility, mobile, keyboard, and browser quality

- `/opt/fleet/lib/verify-url.sh`: PASS on `/` and `/demo`; correct titles,
  `lang=en`, one h1/main, complete alt text, labeled buttons, and no errors.
- Axe: zero serious or critical findings on `/`, `/demo`, `/privacy`, `/terms`,
  and the designed 404 in light and dark, plus the 390 px demo.
- Keyboard: the primary action opened the demo without a pointer; ArrowDown
  changed the selected group; Space activated a decision; dialogs focused the
  safe action and closed with Escape. Focus used a visible 3 px
  `rgb(49, 95, 137)` outline. No keyboard trap was observed.
- Touch: every visible link, button, input, and zero-tabindex control checked
  on the five live routes was at least 44 × 44 CSS pixels at 390 px.
- Responsive layout: `/`, `/demo`, `/app`, `/privacy`, and `/terms` had no
  horizontal overflow at 390 px or after simulated 200% text sizing.
- Reduced motion: the photo-card transition resolved to `0.00001s`; no loop or
  flashing was present.
- Console/page errors: none during normal, demo, mobile, policy, offline, and
  license flows. The browser logged only the expected network error when the
  intentional HTTP 404 was requested.
- Routes and links: primary routes returned 200, the unknown route returned a
  designed HTTP 404, internal and external links resolved, and checkout
  returned its expected 303.

Minor exception: the standalone 404 page expands to a 535 px layout width in a
390 px visual viewport at simulated 200% text. Its header navigation reaches
x=504.17 and requires horizontal panning. Other routes remain exactly 390 px.

## Privacy, headers, rate limiting, and PWA

- A complete demo quarantine/export/import/restore flow made only same-origin
  requests. No photo, thumbnail, path, identifier, or decision data left the
  origin. No advertising/tracking script or third-party font loaded.
- An explicit browser license check sent a bodyless `GET` with only
  `license=verification-14-browser-token` to the documented Sociobot verify
  endpoint. It sent no photo or review data. The invalid response was not
  stored as a license.
- License response: 200 JSON, `Cache-Control: no-store`, and
  `Access-Control-Allow-Origin: https://photo-proof-pile.sociobot.in`.
- Observed request allowance: 30 successful requests for one client. Request
  31 returned 429 with `Retry-After: 4`.
- Browser response headers include CSP with `frame-ancestors 'none'`, HSTS,
  `nosniff`, strict-origin referrer policy, and denied camera, microphone, and
  geolocation permissions.
- HTML and `sw.js` revalidate after 30 seconds. Hashed JS/CSS assets use
  `public, max-age=31536000, immutable`.
- Service-worker update completed with active cache `proof-pile-v13`; no
  waiting worker remained. Offline `/demo` reload returned 200 and retained
  the banner and all three groups.

## Performance and deployment identity

Fresh Lighthouse mobile results:

- performance 100;
- accessibility 100;
- best practices 100;
- SEO 100;
- FCP 0.91 s, LCP 1.08 s, TBT 73 ms, CLS 0;
- transferred 140,566 bytes.

The fresh candidate build matched the live deployment byte for byte for
`index.html`, `sw.js`, all three JavaScript chunks, and CSS. The candidate
diff from implementation commit `395628297e9331e8ead19279abd7858d60288f5a`
contains only `.factory` documentation/evidence. This establishes that the
live product code matches candidate `0c4d72a`.

## Desktop distribution

**FAIL — required public packages are absent.** Fresh evidence:

- `GET https://api.github.com/repos/B-Divyesh/sf-photo-proof-pile/releases`
  returned an empty array (zero public releases).
- `GET .../releases/latest` returned HTTP 404.
- Package version is `0.1.16`, but no `v0.1.16` tag exists and the candidate
  commit has no tag.
- Release workflow run
  [33282734730](https://github.com/B-Divyesh/sf-photo-proof-pile/actions/runs/33282734730)
  failed at **Require trusted Windows and macOS signing credentials**.
  Prepare, all platform builds, independent signature checks, checksums, and
  publication were skipped.
- The live download dialog exposed zero links and said signed downloads were
  not published.
- The live Linux one-line installer exited 1 with “A trusted Linux release is
  not published yet. Nothing was installed.” A fresh temporary destination
  remained empty.
- Consequently there is no public Linux AppImage/DEB, Windows MSI/EXE, macOS
  DMG pair, `SHA256SUMS`, `latest.json`, or
  `DESKTOP_SIGNATURES_VERIFIED.json` to download and verify.

Failing closed is correct safety behavior, but it does not satisfy the desktop
work order's requirement for real downloadable packages on Linux, Windows,
and both macOS architectures.

## Defects by severity

### Severity 1 — release blocking

1. **No public desktop release or installable package exists.** The product's
   primary artifact cannot be installed on any supported platform. Operator
   signing credentials are missing, the release workflow stopped before the
   build matrix, and the live product offers no download.

### Severity 2 — material

None found.

### Severity 3 — minor

1. **The standalone 404 header does not reflow at 200% text on a 390 px
   viewport.** Layout width expands to 535 px, requiring horizontal panning.

## Final decision

**FAIL — candidate `0c4d72a226e3f67041d9f8aa87dae94d2e344a4d` is not accepted.**

The previously reported deployment-only failure remains present in fresh
public evidence. To become eligible for PASS, provide the workflow's Apple
signing/notarization and Windows Authenticode secrets, tag the exact 0.1.16
source, complete every release job, publish the full package/checksum/manifest
matrix, and verify a real download and checksum from the live page. The 404
reflow issue should also be corrected and retested.
