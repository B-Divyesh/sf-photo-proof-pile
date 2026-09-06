# Proof Pile — verification 29 handoff

## Result

**FAIL — production does not currently serve the reviewed desktop release.**

- Implementation candidate: `b12d5727de44d71c91b4a496eece320e7247a853`
- Documentation checkout: `1fdac04b9fb0a784bfebd243b7517cf5e6239b8c`
- Required release: `v0.1.30`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Findings: 1
- Untested claims: 0

No product code was changed. Verification evidence, the report, and this
handoff are the only repository changes.

## What was verified

- Fresh desktop and phone first screens state the photo-review job, audience,
  and **Try it with sample data** action before scrolling.
- The live sample has three groups and eight files, a persistent sample label,
  reset and exit controls, realistic evidence, CSV export, recovery, invalid
  input handling, and separate sample storage. A real-data sentinel stayed
  unchanged.
- Every exact command in `.factory/claims.json` passed from a separate clean
  checkout. All 25 claims have exactly one tagged test.
- `CI=1 npm test`, `CI=1 npm run check`, and `npm run build` passed. The build
  reconstructed and verified the v0.1.30 release site for `b12d5727…`.
- All seven public v0.1.30 package checksums matched. The Linux DEB identified
  itself as version 0.1.30 and launched under Xvfb after its documented
  GTK/WebKit runtime packages were installed.
- Live route structure, 11 Axe scans, keyboard and focus, 390 px layout, 200%
  text, reduced motion, privacy requests, links, legal pages, designed 404,
  offline reload, checkout redirect, and 30/31 license allowance passed.
- Fresh mobile Lighthouse scores were 100 for Performance, Accessibility,
  Best Practices, and SEO.

## Open finding

Production currently says `v0.1.29 · source 1fdac04b9fb0`, requests GitHub
tag `v0.1.29`, exposes no desktop package links, stamps both one-line
installers with v0.1.29 at `1fdac04…`, serves a v0.1.29 404, and uses service
worker cache `proof-pile-v29`.

The documented live Linux installer exits 1 without installing a file. An
ordinary v0.1.29 build from documentation commit `1fdac04…` matches all 27
live files. The verified v0.1.30 release-site build matches only 18 of 27.
This shows that the later documentation deployment replaced the repaired
release site.

## Required next step

Deploy the existing verified v0.1.30 release site for implementation
`b12d5727…` to `sf-photo-proof-pile`. Prevent later documentation builds from
overwriting that immutable site. Then recheck all of these together:

- footer: v0.1.30 and source `b12d5727…`;
- four immutable download choices;
- `install.sh` and `install.ps1` identity;
- designed 404 version;
- service-worker cache `proof-pile-v0.1.30`;
- 27 of 27 live files matching the verified release-site build.

No new product-code repair is established by verification 29.

## How to reproduce

```sh
npm ci
CI=1 npm test
CI=1 npm run check
npm run build

RELEASE_TAG=v0.1.30 \
RELEASE_COMMIT=b12d5727de44d71c91b4a496eece320e7247a853 \
REPOSITORY=B-Divyesh/sf-photo-proof-pile \
bash scripts/verify-published-release.sh
```

Open the live site in a fresh desktop browser, choose **Check desktop
downloads**, and inspect the footer and dialog. The full report is
`.factory/verification-29.md`; supporting files are under
`.factory/verification-29-artifacts/`.

## Known packaging limits

macOS packages lack Developer ID signing and Windows packages are
Authenticode NotSigned. This is disclosed and tested. Operator certificates
are still needed for signed packages. The one-time US$29 checkout and license
registration remain owned by the Sociobot billing operator.
