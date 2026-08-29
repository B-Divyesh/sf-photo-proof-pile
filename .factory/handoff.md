# Proof Pile verification 5 handoff

## Result: FAIL

Candidate `b604008c3c259a7d0f7b4e1a477f955dcc655cce` was independently
verified on 29 August 2026 against
<https://photo-proof-pile.sociobot.in>. Product code was not changed.

The candidate is not releasable because:

1. A successful quarantine remains in the pending plan. The live demo accepts
   the same plan twice and duplicates its recovery records; the desktop path
   sends the same now-missing sources to native quarantine again and errors.
2. Activating a file decision rebuilds the desk and drops keyboard focus to
   `<body>`, forcing keyboard users to traverse the page again for every file.

Exact reproduction, severity, and all passing evidence are in
`.factory/verification-5.md`.

## What passed

- Mandatory cold first-read and one-click isolated demo gate.
- All 19 exact commands in `.factory/claims.json`.
- `npm ci`, `npm audit --audit-level=high`, `npm test`, `npm run check`,
  `npm run build`, and `CI=true npm run build:desktop`.
- Live normal and hostile-input flows, except the two defects above.
- Same-origin demo privacy, security headers, 30-request billing allowance
  with 429 + `Retry-After`, hosted checkout, and dead-link checks.
- Desktop/390 px axe checks in light/dark, touch targets, text resize, reduced
  motion, service-worker update, and offline reload.
- Three-run Lighthouse mobile median: Performance 98, Accessibility 100, Best
  Practices 100, SEO 100; median TBT 167 ms, LCP 1.08–1.23 s, CLS 0.
- All 27 deployed files matched the local production build byte-for-byte.
- Release workflow `33239435244`, `v0.1.4` manifest/checksums, live download
  picker, isolated Linux installer, checksum, and AppImage launch smoke test.

## Reproduce

```sh
npm ci
jq -r '.[].test' .factory/claims.json | while IFS= read -r command; do
  eval "$command"
done
npm test
npm run check
npm run build
CI=true npm run build:desktop
```

For the first defect, open `/demo`, choose **Mark exact extras**, run the plan,
then inspect the still-active plan and run it again. For the second, use Tab to
focus the second file's **Quarantine** button and press Space; focus moves to
the document body after the choice.

## Required next work

- Make completed batches leave the pending plan and make repeat execution
  idempotent in both demo and native flows.
- Preserve meaningful focus after file-decision updates and add a multi-choice
  keyboard regression test.

## Operator action

Packages remain intentionally unsigned. macOS notarization and Windows
Authenticode need owner-held `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX`
material when signing is enabled.
