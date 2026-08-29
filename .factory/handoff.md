# Proof Pile review 2 handoff

## Result: FAIL

This reviewer made no product-code changes. The evidence-backed first-read
report is `.factory/review-2.md`.

## What was checked

- Fresh live browser contexts at 390 × 844 and 1440 × 900.
- One-click `/demo` and `?demo=1` behavior, real/demo storage separation,
  Reset, Start for real, and the complete demo request log.
- Every one of the 19 exact `.factory/claims.json` commands after `npm ci`.
- `npm test`, `npm run check`, and `npm run build` (`dist/site` produced).
- Route metadata, deep links, Back focus behavior, links, 404, response
  headers, and live axe scans across five routes at phone and desktop widths.
- Every prior review/polish/handoff finding was rechecked live and in code.

## Remaining work

1. Sign/notarize the Windows and macOS production packages. This is recurring
   blocking finding `F-1-34` / `F-2-2` and needs owner-held credentials.
2. Change the static 404 footer from `v0.1.4` to the current `v0.1.5` (or use
   a shared version source); add a test. This is blocking `F-2-1`.
3. Extend `@claim:paid-license` to prove no verification before 24 hours and
   exactly one verification after the boundary. This is blocking `F-2-3`.
4. Resolve the minor copy/claim findings F-2-4 through F-2-6 in the report.

## Reproduce

```sh
npm ci
npm test
npm run check
npm run build
```

Then run each command listed in `.factory/claims.json` and inspect the live
site at <https://photo-proof-pile.sociobot.in>.
