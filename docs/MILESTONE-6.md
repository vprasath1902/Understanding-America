# Milestone 6 — Content Freeze & Source Modernization

Milestone 6 moves the book from hand-edited HTML to a **single source of truth in
Markdown**, generated into the existing site design by a small Node build script.
This document covers the architecture and the contributor workflow.

## Why

Previously, a change to a heading, a typo, or "the Governor of Pennsylvania" meant
editing many HTML files by hand. Now you edit one Markdown file and regenerate.
The same source will later produce the site, PDF, and EPUB.

## Repository layout

```
src/
  chapters/        # Markdown source — ONE file per chapter (the source of truth)
  appendices/      # Markdown source for appendix pages (e.g. current-officials.md)
templates/
  chapter.mjs      # Chapter page template (reproduces the site design)
scripts/
  build.mjs        # Static site generator
build/             # Generated site (git-ignored — never edit by hand)
docs/              # Project documentation
html/              # Static tool/QA pages (explorer, quiz, glossary, ...)
index.html         # Site entry point (stays at root; copied into build/)
css/ js/ svg/      # Shared assets (copied into build/ as-is for now)
chapters/          # Legacy chapter HTML (still copied, but Markdown is canonical)
```

The site is published to GitHub Pages by `.github/workflows/deploy-pages.yml`,
which builds and deploys `build/`. The `html/` pages are flattened into the
`build/` root so their relative links resolve.

## How the build works

`npm run build` runs `scripts/build.mjs`, which:

1. **Loads the chapter order** from the existing `js/navigation.js` `BOOK_NAV`
   array — already the site's source of truth for ordering, sections, and the
   sidebar. (Chapter ordering is therefore *not* duplicated in the Markdown.)
2. **Copies the whole current site** into `build/` so the site always works
   during the migration.
3. **Overwrites any chapter that has a Markdown source** (`src/chapters/<slug>.md`)
   with output generated from that Markdown via `templates/chapter.mjs`.

A chapter is considered "migrated" once `src/chapters/<slug>.md` exists. Until
then, its original hand-written HTML is used. This lets us migrate incrementally
without ever breaking the site.

The output filename and `<slug>` are derived from `BOOK_NAV`:
`chapters/chapter-06-06-constitution.html` → slug `06-constitution`.

## Chapter Markdown format

Front-matter holds the structured fields; the body holds the prose (Markdown
`##` headings become `<h2>` sections). Fields under "Milestone 6 additions" are
optional and render only when present.

```markdown
---
title: The United States Constitution
subtitle: The Constitution is the blueprint for American government...
diagram:
  src: svg/constitution-explorer.svg          # path relative to site root
  alt: Visual diagram for The United States Constitution
objectives:
  - Understand the Preamble
callout: The Constitution sets up and limits the government.
visual_pack: svg/milestone3/election-cycle-m3.svg   # optional
summary:
  - The Constitution sets up and limits the government.
terms: [Constitution, Government, Federalism]
review:
  - What is the main idea of this chapter?
# --- Milestone 6 additions (all optional) ---
references:
  - label: Constitution Annotated
    url: https://constitution.congress.gov/
related_chapters:                              # output filenames
  - chapter-07-07-bill-of-rights.html
related_glossary: [Constitution, Federalism]
related_quiz: quiz.html
related_timeline: timeline.html
further_reading:
  - label: Some source
    url: https://example.gov/
---
## The Constitution at a Glance

The Constitution contains the Preamble, seven Articles, and twenty-seven amendments.
```

`title`, `number`, `section`, and prev/next come from `BOOK_NAV`; `title` in
front-matter is optional and overrides the manifest if set.

## Contributor workflow (lightweight branching)

```
main
  └─ feature/<task>   →  PR  →  review  →  merge  →  delete branch
```

1. `git checkout -b feature/<task>`
2. Edit/add Markdown in `src/`.
3. `npm run build` and check `build/`.
4. Commit, push, open a PR; merge after review.

## Local commands

```
npm install      # one-time: install build dependencies
npm run build    # generate build/
npm run serve    # serve build/ at http://localhost:8080
npm run clean    # remove build/
```

## Migration status

Proof-of-concept chapters migrated to Markdown:

- `06-constitution` — also demonstrates the new References / Related sections.
- `21-uscis-part-1` — verified byte-identical to the original page.

All 28 chapters are migrated to Markdown.

## Central reference: current officials & fees

Time-sensitive facts (President, VP, PA Governor, senators, USCIS fees and
forms) live in one place: `src/appendices/current-officials.md`, rendered to
`appendices/current-officials.html` and linked from the sidebar (Appendix H).
Chapters reference this page instead of naming officeholders or fees directly,
so each year only this one file is updated. Every value carries an official
source link and the page shows a "Last verified" date.
