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

## Status

W1 deliverables complete: tokens, conventions, accessibility rules, hero
decision, and four reference visuals. Next: **W2 — visual toolkit + figures
system** (build integration), then W3/W4 production.
