# Milestone 7 — Visual Production

Replace today's placeholder and reused SVGs with a complete, consistent,
accessible, print-ready visual system across all 29 chapters and the appendices.

This plan keeps the original targets intact and focuses on *how* to hit them
maintainably, given the architecture already in place (Markdown → Node build →
`build/`, the `diagram`/`visual_pack` front-matter, the `svg/` conventions, and
the pa11y accessibility CI).

## Goal

Every chapter is visually complete — a hero image plus at least one meaningful,
accurate figure — with zero placeholder or generic-reused visuals remaining, and
every asset accessible and print-ready.

## Reconciled inventory (original targets, summed)

| Type | Target | Notes |
| --- | --- | --- |
| Maps | 25 | 13 Colonies, Civil War, Westward Expansion, Pennsylvania, federal courts, electoral map, regions… |
| Timelines | 35 | History, Presidents, Amendments, Supreme Court, Immigration… |
| Hero artwork | 29 | One per chapter |
| Infographics | 100 | Process / structure / comparison diagrams |
| Icons / diagrams | ~30 | Reuse + extend the existing set |
| **Total SVGs** | **~190+** | Comfortably clears the "150+" floor |

This is the largest milestone so far. It is made tractable by generating the
data-driven visuals programmatically and reserving hand/AI effort for the
genuinely artistic ones.

## Guiding principles

1. **Generate, don't hand-draw, anything data-driven.** Timelines and the
   electoral / amendments / presidents / Supreme Court charts come from
   *data files → SVG* via a small Node toolkit. Update the data, re-render.
2. **Lock the visual style before mass production.** Define design tokens
   (palette, type, stroke, the ★ brand, gold accent) and 2–3 reference visuals
   first. Producing 190 assets and then restyling is the expensive failure mode.
3. **Design for print now.** Milestone 8 generates the PDF; visuals built
   print-unaware will need rework. Bake in print color/contrast and sizing now.
4. **Accessibility is not optional at this volume.** Every SVG needs
   `<title>` / `<desc>` plus chapter alt text, or pa11y and the accessibility
   audit will (correctly) fail.
5. **Be honest about heroes.** 29 bespoke hero illustrations are the hard part;
   programmatic generation won't do it. The sourcing approach is decided in W1.

## Asset architecture

```
src/assets/visuals/
  heroes/        29 chapter hero SVGs
  maps/          25 maps (base maps + data overlays)
  timelines/     35 timelines (generated)
  infographics/  100 infographics
  icons/         shared icon set
data/visuals/    *.json — source data for generated visuals
scripts/visuals/ generator toolkit (data → SVG)
```

The build copies `src/assets/visuals/` → `build/assets/visuals/`. The existing
`svg/` assets migrate in here; legacy paths keep working during the transition
(the same incremental, never-break-the-site pattern used in earlier milestones).

## Build / front-matter integration — a "figures" system

Extend chapter front-matter beyond the single `diagram`:

```yaml
hero:
  src: assets/visuals/heroes/15-cabinet.svg
  alt: "Illustration of the President and Cabinet departments"
figures:
  - src: assets/visuals/infographics/15-cabinet-structure.svg
    caption: "Figure 15.1 — The Cabinet within the Executive Branch"
    alt: "Org chart: President over 15 department secretaries"
```

The chapter template gains a hero block and numbered, captioned `<figure>`
rendering (with `<figcaption>`), plus matching `print.css` rules. Figure
numbering derives automatically from the chapter number.

## Production approach by type

| Type | How produced | Why |
| --- | --- | --- |
| Timelines (35) | **Programmatic** — `data/visuals/*.json` → SVG via toolkit | Consistent, updatable, scales |
| Data maps (electoral, regions, courts) | **Programmatic** — base map SVG + data overlay | Reuse one base, many views |
| Historical maps (colonies, Civil War, expansion) | **Authored / AI-assisted**, then optimized | Geographic accuracy needed |
| Infographics (100) | **Mostly templated** (process / compare / structure templates) + some authored | Many share patterns |
| Hero artwork (29) | **Authored / AI-assisted**, hand-refined to the style system | Artistic, per-chapter |
| Icons / diagrams (~30) | Extend the existing hand-coded set | Conventions already exist |

## Workstreams & sequence

| # | Workstream | Output | Depends on |
| --- | --- | --- | --- |
| **W1** | Visual style system | Design tokens + style guide page + 3 reference visuals | — (do first) |
| **W2** | Visual toolkit + figures system | `scripts/visuals/` generators, front-matter `hero`/`figures`, template + print.css | W1 |
| **W3** | Generated visuals | 35 timelines + data maps + templated infographics from data | W2 |
| **W4** | Authored visuals | 29 heroes + historical maps + bespoke infographics | W1 (sourcing decision) |
| **W5** | Optimization & accessibility | SVGO pass, `<title>`/`<desc>`, alt text, contrast; wired into CI | W3, W4 |
| **W6** | Integration & inventory | All chapters reference final visuals; update illustration-library / visual-gallery; visual registry (asset → chapter → alt → status) | all |

**Recommended order:** W1 → W2 → then W3 and W4 in parallel → W5 → W6. Each
chapter "completes" when it has a hero plus at least one meaningful figure, all
accessible — so the book improves continuously rather than in one big-bang merge.

## Definition of done (acceptance criteria)

- Every chapter has a hero plus at least one relevant, non-placeholder figure.
- **Zero** reused-generic or "Milestone 3 placeholder" visuals remain.
- Every SVG: `<title>` + `<desc>`, chapter alt text, AA contrast, SVGO-optimized
  (size budget per asset).
- All visuals render correctly in `build/` **and** in the print/PDF preview.
- pa11y CI green; the asset/link integrity check green (extended to cover
  visuals).
- A visual registry lists each asset, its chapter, type, alt text, and source,
  feeding the existing source-register / illustration-library.

## Tracking

Mirror the Milestone 5 approach: a GitHub **Milestone 7** with issues per
workstream (and per visual batch), each delivered as a short `feature/visual-*`
branch → PR, matching the lightweight branching used throughout the project.

## Risks & recommendations

- **Scope.** ~190 quality visuals is substantial design work if hand-authored.
  Treat W3 (generated) as the high-leverage core, make heroes (W4) the gating
  artistic decision, and consider the full 100 infographics a *stretch* — a
  strong v1.0 needs every chapter visually complete and the key maps/timelines,
  not necessarily all 100.
- **Heroes sourcing** is the one decision that must be made up front
  (hand-illustrated vs AI-generated-then-refined vs commissioned). It drives
  cost, timeline, and the style system — settle it in W1.
- **Do not start production before W1** locks the style, or everything gets
  reworked.
