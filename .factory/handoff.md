# Proof Pile adversarial review 1 handoff

## Result

**FAIL — 34 findings remain.** Product code was not modified.

- Work order: `photo-proof-pile-review-1`
- Reviewed commit: `18d7eaa987f871954de3f35505cdecab5771b66d`
- Live URL: <https://photo-proof-pile.sociobot.in>
- Report: `.factory/review-1.md`
- Reviewed: 29 August 2026 UTC

The cold first screen and one-click sandbox demo pass. All 15 registered claim
commands pass, but several tests do not prove their full public promise and
additional public claims are unlisted. Back loses scroll position; route social
metadata, the deployed 404 shell, terminology, action labels, and plain-language
copy also need repair. Production desktop packages remain unsigned.

## Verification performed

```sh
npm ci
# Every command in .factory/claims.json, run separately
npm test
npm run build
/opt/fleet/lib/verify-url.sh https://photo-proof-pile.sociobot.in <temp-dir>
```

- `npm test`: PASS — Rust 7/7, Vitest 7/7, Playwright 21/21.
- `npm run build`: PASS — `dist/site/` produced.
- Live axe: zero violations across root, demo, privacy, terms, and 404 at
  desktop/390 px in light and dark.
- Live request log: demo flow used only same-origin requests.
- Live link crawl: internal, Sociobot, GitHub release, and current package links
  resolved; checkout returned the expected Dodo redirect.
- Real-storage sentinel: unchanged across demo edit, reset, and exit.
- Product code and configuration: unchanged.

## Next steps

Repair findings in `.factory/review-1.md` in ID order, starting with F-1-1
through F-1-5. Extend the claim registry/tests before changing public copy, then
fix routing/metadata, standardize terms and buttons, and sign the release
packages when owner certificates are available. Re-run the complete review;
this is not a diff-only acceptance.
