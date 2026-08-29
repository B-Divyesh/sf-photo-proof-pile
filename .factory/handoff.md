# Proof Pile review 3 handoff — 29 August 2026

## Result

Independent adversarial review 3 completed without changing product code.
Verdict: **FAIL**. The detailed report is in `.factory/review-3.md`.

## Verification performed

- Opened the live site in fresh desktop (1440 × 900) and phone (390 × 844)
  contexts before scrolling.
- Exercised `/demo` and `?demo=1` with seeded real storage. Sample edits used
  only `demo:photo-proof-pile:session`; reset and exit left the real namespace
  unchanged.
- Confirmed the complete browser demo made same-origin requests only.
- Ran `npm ci`, every one of the 19 exact commands in `.factory/claims.json`,
  `npm test` (9 Rust, 9 Vitest, 25 Playwright), and `npm run build`.
- Checked live routes, titles, metadata, canonical URLs, 404, headers, links,
  h1/main structure, focus behavior, mobile overflow, and prior review/polish
  findings.

## Remaining work

1. Sign Windows packages and sign/notarize macOS packages, then publish them.
   This is the recurring blocking F-1-34 / F-3-1 finding.
2. Repair the header `How it works` link so the SPA preserves `#how` and moves
   the visitor to the section; add a regression test. This is blocking F-3-2.
3. Register and test the README reviewed-plan promise, and change `/app` to a
   product-first title. These are F-3-3 and F-3-4.

The worktree is buildable. Review-only documents are the intended changes.
