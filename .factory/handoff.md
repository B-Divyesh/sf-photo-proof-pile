# Proof Pile — polish round 7 handoff

## Outcome

Round 7 closes the two findings in `review-7.md`. Commit `3791aad`
restores a fail-closed desktop release policy: macOS and Windows packages are
never built, published, offered, or installed without independent signing
verification. It also makes the checked-in copy audit describe the current
`v0.1.23` release contract.

The static site still provides the product's real local photo-review workflow,
direct `/demo` and `?demo=1` sample entry, real routes, offline support, and
the archival-light-table visual system. No third-party analytics or fonts were
added.

## What changed

- Replaced the unsigned desktop workflow with a required-signing gate. All
  eight Apple and Windows credential inputs must exist before a release draft
  is created. The workflow then verifies downloaded Windows Authenticode and
  macOS signing, Gatekeeper, and notarization independently before publishing
  `DESKTOP_SIGNATURES_VERIFIED.json`, checksums, and the release.
- Made the download dialog reject any release without that marker, complete
  package set, manifest, and checksums. Both public installer scripts read and
  validate the marker before downloading or installing anything.
- Removed the unsigned-package claim and reader instructions. The registered
  `verified-downloads-only` claim proves the public interface offers nothing
  without the marker.
- Withdrew the previously public unsigned `v0.1.22` GitHub release to a
  private draft. The public GitHub releases endpoint now returns `[]`; its
  `releases/latest` endpoint returns HTTP 404.
- Bumped package, Tauri, 404, static UI, and service-worker identities to
  `v0.1.23`; regenerated `.factory/copy-audit.md`; updated the catalog line.

## Verification

| Check | Result |
| --- | --- |
| Fresh clone, `npm ci` | PASS; zero npm audit vulnerabilities at `ff9d456`. |
| Every exact claim command | PASS; 22/22, including `@claim:verified-downloads-only`; [`clean-clone record`](polish-7-artifacts/clean-clone-claims.txt). |
| `CI=1 npm test` | PASS; 11 Rust, 12 Vitest, 33 Playwright tests. |
| `npm run check` | PASS; TypeScript, rustfmt, and Clippy. |
| `npm run build` | PASS; `dist/site`; 13.63 KiB gzip app JS, 5.11 KiB gzip CSS. |
| `CI=true npm run build:desktop -- --bundles deb,rpm` | PASS; `v0.1.23` DEB and RPM built. |
| Extracted-DEB Xvfb smoke | PASS; app remained open for eight seconds (expected timeout 124). |
| Local URL verifier | PASS at `/` and `/demo`: title, `lang`, one h1, main, alt text, zero console errors. |
| Accessibility | PASS in Playwright Axe tests (light, dark, mobile) and final live Playwright Axe sweep; zero serious/critical violations. |
| Live URL verifier | PASS at `/` and `/?demo=1`: title, `lang`, one h1, main, alt text, zero console errors. |
| Live release gate | PASS: GitHub public releases is `[]`; the live dialog offered 0 packages and logged 0 errors. |
| Live Lighthouse | PASS: 100 performance, accessibility, best practices, and SEO; LCP 1.2 s, TBT 40 ms, CLS 0, 137 KiB transfer. |

## Deployment and cold live recheck

The current `dist/site` was deployed through the `photo-proof-pile` static
work-order configuration after `ff9d456` was pushed. The live root serves
`index-ow-NLYE0.js` and the service worker reports `proof-pile-v21`, matching
the final build.

Fresh browser contexts verified `/`, `/demo`, `/?demo=1`, `/app`, `/privacy`,
and `/terms` return the right route-specific title, one h1, and one main.
`/polish-7-missing` returns HTTP 404 with the designed 404 title. The first
screen contains the clear photo-review job and one-click sample action; the
sample has three groups and eight files. The mobile 390 px demo has no
horizontal overflow and its main action is 44.39 px high.

- Live browser audit: [`live-qa.json`](polish-7-artifacts/live-qa.json)
- Cold first screen: [`root`](polish-7-artifacts/live-cold-root.png)
- One-click sample: [`demo`](polish-7-artifacts/live-demo-one-click.png)
- Direct sample, mobile: [`screenshot`](polish-7-artifacts/live-demo-mobile.png)
- Fail-closed download dialog: [`screenshot`](polish-7-artifacts/live-download-refusal.png)
- Worker URL checks: [`root`](polish-7-artifacts/live-root-final/verify.json)
  and [`direct demo`](polish-7-artifacts/live-demo-final/verify.json)
- Public-release check: [`release-public-check.txt`](polish-7-artifacts/release-public-check.txt)
- Lighthouse report: [`lighthouse-live.json`](polish-7-artifacts/lighthouse-live.json)

Local screenshots and URL records remain in `polish-7-artifacts/local-verify/`
and `polish-7-artifacts/local-demo-verify/`.

The final locally built consumer packages were:

```text
be04df5bfdc88f3fcf34ad94bfed2b98a99da5e3eaf1c9bc7cdca63ee03147ee  Proof Pile_0.1.23_amd64.deb
29d4c0eac24b34b9f41c715f6d8d0ad2eba8c078c9db17f3e17e55b4589a1e99  Proof Pile-0.1.23-1.x86_64.rpm
```

## How to run and verify

```sh
npm ci
CI=1 npm test
npm run check
npm run build
npm run build:desktop -- --bundles deb,rpm
```

Open `http://localhost:4173/demo` after `npm run preview`, or use
`https://photo-proof-pile.sociobot.in/demo` after deployment. `?demo=1` enters
the isolated sample namespace directly; **Reset demo** discards only sample
data and **Start for real** leaves it.

## Operator action for a future desktop release

The repository deliberately has no signing material. A new public desktop
release will stop before creating a draft until the owner configures all of
these repository secrets: `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`,
`APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`,
`WINDOWS_CERT_PFX`, and `WINDOWS_CERTIFICATE_PASSWORD`. This is intentional:
there is no unsigned fallback and no public package until the workflow has
independently verified both signed platforms.

## Known gaps

None in the product or release-safety contract. A signed public desktop
release awaits the owner-held certificates listed above; the site and
installers safely offer nothing until then.
