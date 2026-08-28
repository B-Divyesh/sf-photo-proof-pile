# Independent product verification

## Verdict: FAIL

- Candidate: `14ed919d93be9d1ccb662e868906fe19fbfdd3d0`
- Live URL: `https://photo-proof-pile.sociobot.in`
- Verified: 28 August 2026 UTC
- Work order: `photo-proof-pile-verify-1`

The candidate is not releasable. The free demo is clear, fast, private, and
functional, but the paid checkout is not enabled, the promised reversal record
does not survive a reload, and serious accessibility failures remain.

## Release-blocking findings

### S1 — Advertised checkout returns 404

The landing page offers **Buy the desktop license — secure checkout** for
US$29. A fresh request to its exact target returned:

```text
GET https://api.sociobot.in/api/v1/products/photo-proof-pile/checkout
HTTP/2 404
{"error":"enabled factory product","status":404}
```

No buyer can complete the advertised one-time purchase. The invalid-license
verification route itself is reachable and correctly returns `{valid:false}`.

### S1 — Reversal evidence is session-only and the decision log cannot restore

The acceptance contract requires an undoable quarantine plan and a portable
decision log. The landing page says “Restore them from the decision log.” In a
fresh demo, two files were quarantined and Restore was available. After reload:

```text
before reload: Restore last move controls = 1
after reload:  Restore last move controls = 0
after reload:  files still marked for quarantine = 2
new CSV after reload: rows with quarantine_path = 0
```

Move records exist only in the in-memory `moves` array. They are neither
persisted nor importable from CSV. Closing the app therefore removes the app's
restore path and loses destination paths unless the user exported before
closing. This contradicts the product's primary safety promise.

The UI also permits every copy in a group to be marked for quarantine. In the
three-copy exact group, all three Keep buttons were false; the confirmation
accepted the plan and reported “3 sample files moved.” There is no invariant or
specific warning that one copy must remain.

### S2 — Serious accessibility failures in supported presentations

Independent axe 4.13 checks found:

- Dark landing page: `color-contrast`, serious, two nodes. `#price-title` and
  `#restore-license` render `#171918` on `#080d0b`, measured at 1.1:1.
- 390px demo: `scrollable-region-focusable`, serious, on `.photo-strip`. The
  horizontal photo strip is not focusable and has no focusable content.

Additional keyboard/touch defects: activating the skip link left focus on
`BODY`, and six visible mobile header/footer links measured below 44px in one
dimension. Normal controls did have a visible 3px focus outline, arrow-key group
selection worked, Space changed decisions, and dialog focus returned correctly.

### S2 — The claims registry does not cover important public claims

All registered claim commands pass, but the public README/landing page makes
material claims that are not represented by a matching `.factory/claims.json`
entry and observable claim test. Examples include native exact/perceptual/EXIF
group creation (the registered test only inspects seeded demo groups), restore
“from the decision log,” cross-drive copy-before-remove/date preservation and
collision handling, and installer checksum verification. The restore claim is
also disproved by the reload test above. Under the claims contract, unlisted or
insufficiently tested claims block release.

### S2 — Intel macOS visitors are offered the ARM build

With an Intel Mac user agent, the page says “Download for macOS,” but the only
macOS link in its dialog resolves to:

```text
Proof.Pile_0.1.0_aarch64.dmg
```

An x86_64 DMG is published, but the picker uses the first `.dmg` returned by the
API and gives users no architecture choice.

## Other findings

### S3 — Broken footer link

The footer links to `https://www.sociobot.in`. TLS verification fails because
the served certificate has no `www.sociobot.in` subject alternative name.
`https://sociobot.in` returns 200.

### S3 — Caching and not-found responses miss the contract

- Hashed JS/CSS assets return `Cache-Control: public, must-revalidate,
  max-age=30`; they are not long-lived immutable assets.
- A random unknown path and `/404.html` both return HTTP 200. The SPA displays
  its designed not-found screen, but there is no real 404 response.

### S3 — The web app manifest is not discoverable

`manifest.webmanifest` exists, but `index.html` has no `link[rel=manifest]`.
Chrome's manifest inspection therefore reports an empty manifest URL. The
service worker and offline demo still work.

## Mandatory first-read and demo gate

PASS. On a cold 390px and desktop load, the first screen states:

- what: “Review photo copies before you remove them”;
- for whom: people with photos across several drives who fear losing the only
  meaningful copy;
- first action: “Try it with sample data,” with “Opens three ready-to-review
  groups.”

The action is above the fold and reaches `/demo` in one click. The resulting
screen contains three populated groups plus the persistent “Demo — sample data,
nothing is saved” banner, Reset demo, and Start for real. Demo edits use only
`demo:photo-proof-pile:session`; the normal flow made no off-origin requests.

## Claims results

After the required clean `npm ci`, every exact command in
`.factory/claims.json` passed:

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-isolated` | PASS | edit then Reset returned the plan to 0 |
| `match-evidence` | PASS | three seeded types and evidence fields visible |
| `csv-export` | PASS | `proof-pile-decisions.csv`, header + 8 rows |
| `reversible-plan` | PASS (narrow test) | restore works before reload only |
| `local-privacy` | PASS | no off-origin request during demo review |
| `no-account` | PASS | full demo desk without identity fields |
| `free-scan-limit` | PASS | 1,001 real images yielded 1,000 scanned + limit flag |
| `paid-license` | PASS (mocked) | one mocked verify request and namespaced token |
| `offline-reload` | PASS | `/demo` reloaded offline with all three groups |

Per the requested ordering, the claim commands were first invoked before
dependencies existed; browser collection could not load `@playwright/test`.
After the clean install, all nine exact commands were rerun and passed. The Rust
claim ran successfully in both passes.

## Repository and build verification

- Clean checkout began at the exact candidate commit.
- `npm ci`: PASS; 66 packages installed, 0 vulnerabilities.
- `npm test`: PASS — Rust 3/3, Vitest 3/3, Playwright 11/11.
- `cargo fmt -- --check`: PASS.
- `cargo clippy --no-default-features --all-targets`: PASS with warnings.
- `npm run build`: PASS; TypeScript and Vite produced `dist/site`.
- `CI=true npm run build:desktop`: PASS after installing the Linux/Tauri host
  prerequisites; DEB, RPM, and AppImage bundles were produced.
- No lint script exists in `package.json`.

The verifier container sets `CI=1`, which Tauri rejects as an invalid boolean;
the exact build was run with the standard `CI=true` used by GitHub Actions.

## Live and package verification

- Live `index.html`, primary JS, CSS, hero, and service worker are byte-for-byte
  identical to the candidate's production output.
- Release v0.1.0 targets code commit
  `94328e12ffcd06e16b40fa00276a3a5c179eee27`; candidate changes after that tag
  are handoff documentation only.
- GitHub Actions run `33187465920`: Windows, Linux, both macOS architectures,
  and checksums all completed successfully.
- Release assets include DMGs for arm64/x86_64, MSI/EXE, AppImage/DEB/RPM,
  `latest.json`, and `SHA256SUMS`.
- The live one-line Linux installer completed in an isolated temp directory.
  Its AppImage SHA-256 was
  `a995945eabe053884d19fc37dc7a9eab5df3969540c7c57690dae2662123b263`,
  matching the published checksum. The released app launched and its sample
  review rendered under a virtual desktop.

## Browser, privacy, policy, and performance evidence

- Desktop and 390px mobile: no global horizontal overflow; first action and
  core decision controls usable. Mobile screenshot inspection completed.
- Normal live routes: no console or page errors. One `<h1>`, one `<main>`,
  `lang=en`, titles, and image alt text were present.
- Light-mode axe: no violations on `/`, `/demo`, `/privacy`, `/terms`, or the
  in-app missing route. Dark/mobile failures are listed above.
- Reduced motion: preference detected; no non-trivial transition or animation
  remained.
- Privacy: the full demo review/quarantine/restore/export flow issued only
  same-origin requests. No third-party fonts, scripts, analytics, or photo
  uploads were observed.
- Security headers: CSP, HSTS, `nosniff`, Referrer-Policy, Permissions-Policy,
  and `frame-ancestors 'none'` are present. Billing verification CORS allows the
  live origin and uses `Cache-Control: no-store`.
- Rate limit: in a rapid verification-API burst, calls 1–29 returned 200; call
  30 returned 429 with `Retry-After: 2`.
- PWA: active worker `proof-pile-v3`, update check completed, and `/demo`
  reloaded offline with three groups.
- Lighthouse 12.8.2 mobile, light landing: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; FCP 1.1s, LCP 1.1s, TBT 20ms, CLS 0, transfer
  90KiB. This single light-route score does not supersede the dark/mobile axe
  failures.
- Bundles: initial JS 10,489 bytes gzip; CSS 4,829 bytes gzip; hero 29,922
  bytes. All are within budget.

## Required next steps

1. Enable/register the production Sociobot checkout and verify a real purchase
   return flow.
2. Persist move records atomically, restore them after restart, support CSV
   import/recovery, and prevent a plan with no kept copy.
3. Fix and test dark contrast and mobile photo-strip keyboard access.
4. Expand claims to test native matching and every public safety/install claim.
5. Offer both macOS architectures based on architecture or an explicit choice.
6. Repair the footer host, cache policy, 404 response, and manifest link.
