# Proof Pile — verification 27 handoff

## Current result

**FAIL — production does not offer the reviewed desktop release.**

- Implementation reviewed: `b12d5727de44d71c91b4a496eece320e7247a853`
- Documentation SHA: `68d676a8997c07a1f58c9c7206f42f3cd172a7e4`
- Intended release: `v0.1.30`
- Live observation: `v0.1.29` at `68d676a8997c07a1f58c9c7206f42f3cd172a7e4`
- Findings: 3
- Untested claims: 0

Production has regressed from the release-site state recorded by repair 20.
The footer and both installer scripts now identify the ordinary `v0.1.29`
build at documentation SHA `68d676a…`. The live dialog requests `v0.1.29`,
offers no download links, and the Linux installer exits 1 without writing a
package. The complete public `v0.1.30` release still correctly targets
implementation `b12d5727…`.

Two minor repository issues also remain: `desktop-release-identity` has two
tagged tests, and `.factory/copy-audit.md` still describes `v0.1.29` instead
of the intended `v0.1.30` release-site copy.

Full evidence and the earlier-finding ledger are in
[verification-27.md](verification-27.md).

## What passed

- Fresh desktop and Android-sized first screens state the job, audience, and
  first action before scrolling.
- The one-click sample loaded three groups and eight files. Its persistent
  label, reset, exit, invalid input, quarantine, CSV, reload, import, and
  restore paths passed without changing the seeded real-review sentinel.
- Every exact command in `.factory/claims.json` passed: 25/25.
- `npm run check` passed.
- `CI=1 npm test` passed: 11 Rust, 22 Vitest, and 37 Playwright tests.
- The static build passed and stayed within the JavaScript, CSS, font, and hero
  budgets.
- The Linux desktop build passed after installing the workflow's documented
  GTK/WebKit prerequisites.
- Public release verification passed for all seven `v0.1.30` packages.
- The checksum-valid Debian package installed as `proof-pile 0.1.30 amd64` and
  remained running for the eight-second Xvfb smoke.
- Ten live Axe runs found zero serious or critical issues. Keyboard, focus,
  390 px, 200% text, reduced motion, legal pages, route titles, Back, and the
  designed HTTP 404 passed.
- The demo stayed same-origin. Offline reload and service-worker update passed.
- The live license API returned 200 for requests 1–30, then 429 with
  `Retry-After: 4`. Checkout returned 303.
- Lighthouse scored 100 in all categories; LCP was 1.4 s, TBT 20 ms, CLS 0,
  and transfer was 141,251 bytes.
- A fresh build at `68d676a…` matched the current live deployment 27/27,
  proving the observed mismatch is deployed state rather than cache.

## Required next steps

1. Deploy the `release-site` artifact from successful release workflow run
   `33596875103` for `v0.1.30` at `b12d5727…`.
2. Ensure later documentation-only pushes cannot replace that artifact with a
   normal `npm run build` result.
3. Confirm the footer, download API request, four platform links, 404, service
   worker, and both installers all identify `v0.1.30` at `b12d5727…`.
4. Keep one canonical `@claim:desktop-release-identity` test tag.
5. Regenerate `.factory/copy-audit.md` from the intended release-site copy.
6. Run a fresh independent verification. PASS requires zero findings.

No product source was modified during verification.
