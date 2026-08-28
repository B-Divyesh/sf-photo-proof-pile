# Proof Pile visual thesis

## Direction: archival generative geometry

Proof Pile should feel like a careful light table, not a cleaner with a red
button. Its geometry comes from contact sheets, file stacks, crop marks, and
the overlapping rectangles made by duplicate photographs. Repeated frames
shift by a few pixels to show that several files may hold one memory. Fine
connector lines make the evidence trail visible. The interface is deliberately
asymmetric: the photo evidence has visual weight, while controls stay quiet.

## Palette

The light treatment is primary because people compare photographs and metadata
best against a neutral paper-like ground. The dark treatment follows the
system preference and keeps the same warm/cool contrast.

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| `--canvas` | `#F4F0E6` | `#171918` | archival paper / darkroom wall |
| `--surface` | `#FFFDF7` | `#222522` | photo mounts and work surfaces |
| `--ink` | `#17211D` | `#F5F1E7` | primary text |
| `--muted` | `#55625C` | `#B6C0BA` | secondary evidence |
| `--line` | `#AAB5AE` | `#59615D` | measured boundaries |
| `--pine` | `#155B4B` | `#70D7B6` | primary action and kept copies |
| `--pine-ink` | `#FFFFFF` | `#102019` | text on the primary action |
| `--amber` | `#9A5A08` | `#F4B759` | review-needed state |
| `--coral` | `#A63A32` | `#FF8F84` | quarantine state, never deletion |
| `--blueprint` | `#315F89` | `#86BCEA` | metadata links and exact evidence |

All text and control combinations target WCAG AA. State always has a word or
symbol as well as color.

## Type and spacing

The display face is the local system serif (`Iowan Old Style`, `Palatino`,
`Georgia`) to evoke annotations in an archive. The UI and data face is the
local system sans stack, so paths and tables stay clear without a font
download. Tabular numerals are enabled for counts and dimensions. The scale is
48/36/28/21/17/14 px. A base 8 px spacing unit is used, with 4 px only inside
tight metadata pairs. Text measures never exceed 70 characters.

## Shape and interaction grammar

- Photo groups are offset paper stacks with square 2 px rules and clipped
  corners. They do not use generic rounded SaaS cards.
- A diagonal hatch means “planned for quarantine.” A solid pine registration
  mark means “keep.” An outlined diamond means “review.”
- The group rail behaves like a contact sheet. Arrow keys move between groups;
  actions always name the result.
- Every quarantine action is a plan first. Execution names the destination and
  leaves a restore record.
- On a phone, the evidence table becomes labeled rows. Controls remain at
  least 44 px and the selected group moves above file evidence.

## Motion

The signature motion is a 220 ms “registration” shift: duplicate frames slide
from a small offset into alignment when selected. Quarantined rows move 8 px
toward the plan rail while fading slightly. Only transform and opacity animate.
With `prefers-reduced-motion: reduce`, all shifts become instant state changes.
Nothing loops.

## Original asset plan and provenance

The hero is a generated editorial still life: translucent photo plates on a
cream drafting table, linked by blueprint lines, with one protected original
and two offset copies. It explains copy grouping and evidence without showing
a fake screenshot. UI icons and marks are hand-authored SVG geometry.

Prompt sheet:

- Subject: an abstract archival light table holding overlapping blank photo
  frames, one protected original, two duplicate plates, small registration
  pins, and fine evidence lines.
- World/materials: cream drafting paper, smoked translucent film, forest-green
  glass, muted coral quarantine sleeve, graphite rules.
- Light/lens: soft raking window light, orthographic three-quarter view,
  generous negative space, crisp material detail.
- Palette words: warm bone, ink green, blueprint blue, restrained amber and
  coral.
- Negative list: people, faces, text, letters, logos, brands, watermarks,
  cameras, trash cans, gradients, glossy generic SaaS shapes.

Generation record: generated on 2026-08-28 with the Factory image deployment
through `/opt/fleet/lib/gen-image.sh`. Prompt is stored beside the source image
in `assets/src/hero-proof-table.json`. Generated imagery is original to Proof
Pile and used only as an explanatory illustration.

Three walkthrough frames in `assets/src/walkthrough/` were captured from the
real demo UI on 2026-08-28. Their optimized WebP files ship in
`public/walkthrough/`; they are product screenshots, not generated capability
claims.

The sample-photo SVGs and interface marks are hand-authored for this product
under the repository's MIT license. No stock or third-party visual assets are
used.

## Why this fits

Cleanup software often celebrates deletion. Proof Pile is about proof before
action. Archival materials and registration geometry make copies, provenance,
and reversibility visible. The warm paper ground reduces the sense of danger;
coral remains a bounded warning rather than the product's identity.
