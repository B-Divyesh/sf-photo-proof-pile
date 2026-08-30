# Landing page copy audit

Audited 30 August 2026. Counts treat hyphenated terms and prices as one word.
No sentence exceeds 22 words. No banned marketing word appears.

| Landing copy | Words | Flag |
| --- | ---: | --- |
| Skip to main content | 4 | Navigation |
| Proof Pile | 2 | Wordmark |
| Demo | 1 | Navigation |
| How it works | 3 | Navigation |
| Privacy | 1 | Navigation |
| Local duplicate-photo review | 3 | None |
| Review photo copies before you remove them | 7 | None |
| For people with photos across several drives who fear removing the only meaningful copy. | 14 | None |
| Try it with sample data | 5 | Claim: demo-isolated |
| Opens three ready-to-review groups. | 4 | Claim: match-evidence |
| Check signed download for Linux | 5 | Claim: verified-downloads-only; platform name changes |
| Open this page on a desktop computer to check signed downloads. | 10 | Mobile action guidance |
| Photos stay on this device | 5 | Claim: native-local-privacy |
| Works without an account | 4 | Claim: no-account |
| Free for 1,000 files; US$29 once for full libraries | 9 | Claims: free-scan-limit, licensed-scan-limit, paid-checkout |
| Each group keeps its file locations, dates, sizes, and match details. | 11 | Claim: match-evidence |
| The review desk | 3 | Section label |
| See why files match | 4 | None |
| Compare file locations, image sizes, dates, and copies on other drives before making a plan. | 15 | Claim: match-evidence |
| Exact bytes | 2 | Sample label |
| 3 copies · 2 drives | 4 | Sample label |
| How photo cleanup works | 4 | None |
| Scan your folders | 3 | Step heading |
| Choose photo folders on each connected drive. | 7 | None |
| The app reads files where they are. | 7 | Claim: scan-scope |
| Start with groups, not a delete list. | 7 | Instruction |
| Review the evidence | 3 | Step heading |
| Keep one copy and mark extras. | 6 | None |
| Every path and difference remains visible. | 6 | Claim: match-evidence |
| Compare each copy and its metadata. | 6 | Instruction |
| Quarantine, then verify | 3 | Step heading |
| Move extras to a folder you choose. | 7 | Claim: review-before-move |
| Restore them from the decision log. | 6 | Claim: reversible-plan |
| Move reviewed files, then restore if needed. | 7 | Claims: review-before-move, reversible-plan |
| Privacy and limits | 3 | Section label |
| Your photos are not uploaded | 5 | Claims: local-privacy, native-local-privacy |
| Copies on other drives are matching files, not tested backups. | 10 | Safety warning |
| Keep a tested backup. | 4 | Safety instruction |
| A matching copy can still live on a failing drive. | 9 | Safety explanation |
| Open important backups before cleanup. | 5 | Safety instruction |
| Desktop license | 2 | Section label |
| Review a full library | 4 | None |
| The free app scans 1,000 files at a time. | 9 | Claim: free-scan-limit |
| A license removes that scan limit. | 6 | Claim: licensed-scan-limit |
| US$29 one-time purchase | 3 | Claim: paid-checkout |
| Buy via Sociobot checkout ↗ | 4 | Claim: paid-checkout |
| Restore a purchase | 3 | None |
| Sociobot checkout takes payment. | 4 | Claim: paid-checkout |
| For refunds, email support@sociobot.in. | 4 | Claim: paid-checkout |
| Review duplicate photos before moving extra copies. | 7 | Product description |
| Terms | 1 | Legal navigation |
| Built by Param Factory ↗ | 4 | Attribution |
| v0.1.16 | 1 | Release identity |

## Download dialog copy

| Dialog copy | Words | Flag |
| --- | ---: | --- |
| Close download window | 3 | Accessible name |
| Desktop app | 2 | Dialog label |
| Signed desktop downloads | 3 | Dialog heading |
| Checking the latest release… | 4 | Loading state |
| Checking package signatures… | 3 | Loading state |
| Signed downloads are being prepared. | 5 | Empty state |
| No package is offered until Windows and macOS signature checks pass. | 11 | Claim: verified-downloads-only |
| Windows is Authenticode signed. | 4 | Claim: verified-downloads-only |
| macOS is signed and notarized. | 5 | Claim: verified-downloads-only |
| Download for macOS (Apple silicon) | 5 | Result action |
| Download for macOS (Intel) | 4 | Result action |
| Download for Windows | 3 | Result action |
| Download for Linux | 3 | Result action |
| Signed downloads are not published yet. | 6 | Error state |
| Check again later. | 3 | Error next step |
| No package was offered because signature status could not be checked. | 10 | Error explanation |

## Terminology

| Concept | Product word |
| --- | --- |
| A set of suspected copies | group |
| The copy that remains | keep |
| A reversible file move | quarantine |
| The portable record | decision log (CSV), then decision log |
| A matching copy on another selected root | copies on other drives / Other-drive copies |
| Similar-image group | Looks alike |
| The isolated trial state | demo |
| An installable release | signed download |

The move confirmation says “Move 2 files to /Sample drive/Proof Pile Quarantine?” (9 words) in the demo. The destination changes to the chosen desktop folder. This is covered by `review-before-move`.

Catalog description: “Compare photo copies, quarantine extras, and restore every move from a local decision log.” It starts with a verb and contains 90 characters.
