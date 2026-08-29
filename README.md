# Proof Pile

Review photo copies, quarantine extras, and keep a reversible decision log.

Proof Pile is for people whose photo libraries span several drives. The Tauri desktop app reads selected folders locally, groups likely copies, and keeps the evidence beside every decision. It never offers permanent deletion.

Try the isolated sample at <https://photo-proof-pile.sociobot.in/demo>. The sample needs no account and writes only to a `demo:` session-storage key. Use **Reset demo** for a clean state.

## What it does

- Groups exact byte matches, visually similar images, and images captured in the same minute.
- Shows every path, image dimensions, byte size, capture date, camera, short hash, and matching-drive count.
- Builds a reviewed plan before moving any file to a quarantine folder.
- Keeps quarantine recovery records after restart. Import the decision CSV to recover those records on another device.
- Exports every decision and move as CSV.
- Keeps the review desk available offline after its first visit.

The app does not upload photos, recognize faces, host a cloud gallery, or permanently delete files. A matching backup is not proof that the backup can be restored. Test important backups before cleanup.

## Price and license

The free desktop app scans up to 1,000 image files at a time. A US$29 one-time license removes that scan limit. Saved reviews, CSV export, and every safety feature stay free.

Buy through the [Sociobot hosted checkout](https://api.sociobot.in/api/v1/products/photo-proof-pile/checkout). Sociobot and Dodo handle payment and refunds as merchant of record.

The app stores a returned license under `sb_license:photo-proof-pile` and checks it with the Sociobot API at most once each day. Photo data is never part of that request. Buyers can paste a license into the app when moving to another device.

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

The exact static deployment command is `npm run build:site`. It writes `dist/site/index.html`.

## How matching works

The Rust core walks only the folders a user selects. It computes SHA-256 for exact matches and a 64-bit difference hash for visual matches. It also reads EXIF capture time and camera fields. Similarity groups exclude files already covered by a stronger exact match.

Moving a file preserves its bytes and embedded EXIF metadata. If a move crosses drives, the app copies the file first and removes the source only after a successful copy. A name collision receives a numbered file name instead of overwriting either copy.

## Project map

- `src/` — TypeScript interface, demo data, license flow, and decision log.
- `src-tauri/` — local scanner, matching logic, quarantine, restore, and desktop packaging.
- `public/` — PWA shell, original art, sample images, and installer scripts.
- `tests/` — model and Playwright tests.
- `.factory/` — product brief, visual thesis, claims, demo contract, and handoff.

## Privacy and license

Read the in-product [privacy page](https://photo-proof-pile.sociobot.in/privacy) and [terms](https://photo-proof-pile.sociobot.in/terms). Source code is available under the [MIT License](LICENSE).
