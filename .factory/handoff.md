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

## Verification completed before deployment

| Check | Result |
| --- | --- |
| Fresh clone, `npm ci` | PASS; zero npm audit vulnerabilities. |
| Every exact claim command | PASS; 22/22, including `@claim:verified-downloads-only`. |
| `CI=1 npm test` | PASS; 11 Rust, 12 Vitest, 33 Playwright tests. |
| `npm run check` | PASS; TypeScript, rustfmt, and Clippy. |
| `npm run build` | PASS; `dist/site`; 13.61 KiB gzip app JS, 5.11 KiB gzip CSS. |
| `CI=true npm run build:desktop -- --bundles deb,rpm` | PASS; `v0.1.23` DEB and RPM built. |
| Extracted-DEB Xvfb smoke | PASS; app remained open for eight seconds (expected timeout 124). |
| Local URL verifier | PASS at `/` and `/demo`: title, `lang`, one h1, main, alt text, zero console errors. |
| Accessibility | PASS in Playwright Axe tests (light, dark, mobile); standalone Axe CLI could not create a Chrome session in this container. |

Pre-deploy artifacts are in `polish-7-artifacts/local-verify/` and
`polish-7-artifacts/local-demo-verify/`. The final live deployment identifier,
cold-browser evidence, and final URL checks are recorded below after the
deployment step.

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
