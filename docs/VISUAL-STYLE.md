# Visual Style System (Milestone 7 · W1)

The locked visual language for all Understanding America artwork. Every visual
produced in Milestone 7 — the ~190+ maps, timelines, heroes, and infographics —
follows this system so the book reads as one coherent work. **Lock this before
mass production** (W2–W6 depend on it).

Tokens live in [`data/visuals/tokens.json`](../data/visuals/tokens.json) and
mirror the CSS `:root` variables in `css/styles.css`.

## Palette

| Token | Hex | Use |
| --- | --- | --- |
| navy | `#0b3c6d` | Headings, connectors, primary structure |
| red | `#b22234` | Accents, timeline markers, emphasis |
| gold | `#c9a227` | Brand accent, the ★, timeline rule, highlights |
| green | `#2e8b57` | Secondary categorical fill |
| purple | `#6a4c93` | Secondary categorical fill |
| ink | `#1f2937` | Body text (when present) |
| muted | `#667085` | Labels, captions, secondary text |
| paper | `#f8f8f6` | Canvas background |
| card | `#ffffff` | Box fills |
| line | `#d8dee8` | Box borders, dividers |

## Typography

- **Family:** `Arial, Helvetica, sans-serif` — sans-serif for diagram legibility
  (the book body is Georgia serif; visuals deliberately differ for clarity).
- **Headings:** weight 800, navy. **Labels/subtle:** muted.
- **Sizes:** title 30, heading 22, label 15 (scale within a visual's viewBox).

## Drawing conventions

- `viewBox` on every SVG; **no fixed width/height** (responsive + print-scalable).
- Canvas: `paper` background, corner radius 24. Boxes: `card` fill, `line` stroke
  width 2, radius 18.
- Connectors: navy, stroke-width 4, round caps. Timeline rule: gold, width 6.
- Markers/dots: red, radius 12.
- Reusable class set (inline `<defs><style>`):

```xml
<defs><style>
  .t{font-family:Arial,Helvetica,sans-serif}
  .h{font-weight:800;fill:#0b3c6d}      /* heading  */
  .s{fill:#667085}                       /* subtle   */
  .box{fill:#ffffff;stroke:#d8dee8;stroke-width:2}
  .navy{fill:#0b3c6d}.red{fill:#b22234}.gold{fill:#c9a227}
  .green{fill:#2e8b57}.purple{fill:#6a4c93}
  .line{stroke:#0b3c6d;stroke-width:4;fill:none;stroke-linecap:round}
  .rule{stroke:#c9a227;stroke-width:6}
  .dot{fill:#b22234}
</style></defs>
```

## Accessibility (required on every SVG)

- `role="img"` plus `aria-labelledby` referencing a `<title>` **and** `<desc>`.
- `<title>` = short name; `<desc>` = what the visual conveys (the data/structure),
  not just decoration.
- Text contrast ≥ AA against its background (navy/ink/muted on paper all pass).
- Don't encode meaning by color alone — pair color with a label.
- Chapters also supply `alt` text in front-matter (the figures system, W2).

This is stricter than the legacy SVGs (which used `aria-label` only) — the
references below show the required pattern.

## Hero artwork approach

Heroes are **programmatic flat/geometric SVG** in this same system (decided in
W1): composed shapes + civic iconography (Capitol dome, flag stripes, star,
document motifs) on a navy title panel. In-repo, palette-locked, accessible, and
print-clean — cohesive with the diagrams rather than a separate illustration
style. See `reference-hero.svg`.

## Reference visuals (the canonical examples)

In [`src/assets/visuals/_reference/`](../src/assets/visuals/_reference/):

| File | Demonstrates |
| --- | --- |
| `reference-timeline.svg` | Timeline: gold rule, red markers, navy years, muted labels |
| `reference-infographic.svg` | Structure/org chart: navy header, card boxes, connectors |
| `reference-map.svg` | Map: region fills, white borders, labels, legend |
| `reference-hero.svg` | Chapter hero: flat geometric civic illustration |

New visuals should match these in palette, type, stroke, spacing, and the
required `<title>`/`<desc>` accessibility pattern.

## Naming & organization

```
src/assets/visuals/
  heroes/        NN-slug.svg          (one per chapter)
  maps/          slug.svg
  timelines/     slug.svg             (generated from data/visuals/*.json)
  infographics/  NN-slug.svg
  icons/         slug.svg
```

Filenames: lowercase, hyphenated; chapter-bound assets prefix the chapter number
(e.g. `15-cabinet-structure.svg`).

## Build integration — the figures system (W2)

Chapters declare visuals in front-matter:

```yaml
hero:
  src: "assets/visuals/heroes/01-world-before-america.svg"
  alt: "Short description of the hero image"
figures:
  - src: "assets/visuals/timelines/early-america.svg"
    caption: "What the figure shows"          # rendered as "Figure 1.1 — ..."
    alt: "Accessible description of the figure"
```

- The `hero` renders as a banner under the chapter title; `figures` render as
  numbered, captioned `<figure>` blocks after the body (numbering derives from
  the chapter number). `print.css` keeps heroes/figures from breaking across
  pages.
- **Authored** assets (heroes, historical maps) live in `src/assets/visuals/`
  and are copied into the build.
- **Generated** assets come from data: `data/visuals/**/*.json` declares a
  `type` (e.g. `timeline`) + data; the toolkit in `scripts/visuals/` renders
  them into `build/assets/visuals/<type>/`. The site build runs this
  automatically; `npm run visuals [outDir]` runs it standalone.

## Status

- **W1 complete:** tokens, conventions, accessibility rules, hero decision, four
  reference visuals.
- **W2 complete:** visual toolkit (`scripts/visuals/`), `hero`/`figures`
  front-matter, captioned/numbered figure rendering, print rules, asset build
  integration, and the first timeline generator — demonstrated on Chapter 1.
- **W3 complete:** timeline, tilemap (Electoral College), and infographic
  (process / compare / structure) generators, with visuals across the book.
- **W4 complete:** flat-geometric hero banners for all 30 chapters.
- **W5 complete:** safe SVG minification in the build (preserves
  `<title>`/`<desc>`/ids), and a CI gate (`npm run check`) enforcing link/asset
  integrity, `<img>` alt attributes, M7 `<title>`/`<desc>`, well-formed SVGs
  (no unescaped `&`), and a per-asset size budget.
- **W6 complete:** the build derives a visual inventory from chapter
  front-matter and generates `visual-gallery.html` (every hero, timeline, map,
  and infographic, grouped by type, each linked to its chapter) plus a
  machine-readable `assets/visuals/registry.json`. The Milestone 3 placeholder
  "visual pack" notes have been removed from all chapters.
- **Milestone 7 complete.** Every chapter has a hero; key chapters have figures;
  all visuals are accessible, optimized, inventoried, and CI-guarded.

## Accessibility & optimization (W5)

- All visuals are embedded via `<img alt="…">`, so the **alt attribute is the
  accessible name**; content visuals carry descriptive alt, decorative icons use
  `alt=""`. M7 SVGs additionally include `<title>`/`<desc>` for direct viewing.
- We deliberately use a **conservative minifier** (whitespace/comments only) over
  the build output rather than an aggressive SVGO preset, because SVGO's
  `removeTitle`/`removeDesc`/`cleanupIds` would strip the accessibility wiring and
  break `aria-labelledby` id references.
- Contrast follows the locked palette (white on navy, navy/ink/muted on light) —
  all AA-safe — and color is never the sole carrier of meaning (labels/numbers
  accompany it).
- `npm run check` runs in CI after the build and fails on any regression.
