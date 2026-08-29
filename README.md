# Proof Pile

Review photo copies, quarantine extras, and keep a reversible decision log.

Proof Pile is for people whose photo libraries span several drives. The desktop app reads only folders you choose, groups likely copies, and keeps evidence beside each decision.

Try the isolated sample at <https://photo-proof-pile.sociobot.in/demo> or <https://photo-proof-pile.sociobot.in/?demo=1>. The sample needs no account. Its choices stay only in this browser tab and never mix with a real review. Use **Reset demo** for a clean state.

## What it does

- Groups exact copies, photos that look alike, and photos taken at the same time.
- Shows each file location, image size, file size, capture date, camera, file identifier, and copies on other drives.
- Builds a reviewed plan before moving any file to a quarantine folder.
- Keeps quarantine recovery records after restart. Restore verified decision-log records after selecting their quarantine folder.
- Exports every decision and move in a decision log (CSV).
- Keeps the review desk available offline after its first visit.

Copies on other drives are not tested backups. Open important backups before cleanup.

## Price and license

The free desktop app scans up to 1,000 image files at a time. A US$29 one-time license removes that scan limit. The license changes only the scan limit: quarantine, restore, and decision-log recovery remain available without one.

Buy through the [Sociobot checkout](https://api.sociobot.in/api/v1/products/photo-proof-pile/checkout). Contact Sociobot for refunds.

The app stores a returned license under `sb_license:photo-proof-pile` and checks it with the Sociobot API at most once each day. The request contains only the license token.

## Install

Download the macOS, Windows, or Linux package from the [releases page](https://github.com/B-Divyesh/sf-photo-proof-pile/releases). Builds are currently unsigned, so the operating system may ask you to confirm the first launch.

Linux users can run:

```sh
curl -fsSL https://photo-proof-pile.sociobot.in/install.sh | sh
```

Windows users can run in PowerShell:

```powershell
irm https://photo-proof-pile.sociobot.in/install.ps1 | iex
```

Both scripts fetch release metadata and verify the downloaded package against `SHA256SUMS` before installing it.

## Develop and verify

Requirements: Node.js 22+, Rust stable, and the [Tauri 2 system dependencies](https://v2.tauri.app/start/prerequisites/).

```sh
npm ci
npm run dev             # web UI at http://127.0.0.1:5173
npm run dev:desktop     # native desktop app
npm test                # Rust, unit, claim, browser, mobile, and axe checks
npm run build           # static site at dist/site
npm run build:desktop   # native package for the current platform
```

The exact static deployment command is `npm run build:site`. It writes `dist/site`.

## How matching works

The local scanner reads only folders you select. It compares file bytes for exact copies and image content for photos that look alike. It also reads the capture time and camera stored inside each photo. Files in an exact-copy group do not appear again in another match group.

Moving a file preserves its bytes and embedded photo information. If a move crosses drives, the app copies the file first and removes the source only after a successful copy. A name collision receives a numbered file name instead of overwriting either copy.

## Project map

- `src/` — TypeScript interface, demo data, license flow, and decision log.
- `src-tauri/` — local scanner, matching logic, quarantine, restore, and desktop packaging.
- `public/` — offline web files, original art, sample images, and installer scripts.
- `tests/` — model and Playwright tests.
- `.factory/` — product brief, visual thesis, claims, demo contract, and handoff.

## Privacy and license

Read the in-product [privacy page](https://photo-proof-pile.sociobot.in/privacy) and [terms](https://photo-proof-pile.sociobot.in/terms). Source code is available under the [MIT License](LICENSE).
