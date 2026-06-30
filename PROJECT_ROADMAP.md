# Understanding America

## Master Project Roadmap

**Version:** 2.0 (updated to reflect the Markdown pipeline + Milestone 6/7 work)

## Vision

Create a comprehensive, interactive, visually rich guide to American
History, Government, the Constitution, Citizenship, and Civics. The
project began as a USCIS citizenship civics-test study aid and grew into
a broader civics book.

### Audience

- **Main book:** national U.S. audience.
- **State-specific test content:** isolated into per-state sections
  (Appendix E is the Pennsylvania section; more states can follow).

### Final Deliverables

-   Interactive Website
-   Print-ready PDF Book
-   EPUB/eBook
-   USCIS Study Guide
-   Classroom Edition

------------------------------------------------------------------------

# Overall Project Status

  Area                     Progress
  ----------------------- ----------
  Infrastructure           ✅ 100%
  Repository               ✅ 100%
  GitHub Pages             ✅ 100% (deploys build/ via Actions)
  CI/CD                    ✅ 100% (build + link/a11y/visual gate)
  Book Framework           ✅ 100%
  Markdown source pipeline ✅ 100%
  Illustrations            ✅ ~95% (heroes + figures complete)
  Chapter content (depth)  🟡 ~40% (accurate + structured; prose thin)
  Glossary                 🔴 ~15% (starter, not 500–700 terms)
  Appendices (in Markdown) 🟡 ~20% (only current-officials migrated)
  Interactive Learning     🟡 35%
  Publication (PDF/EPUB)   🔴 ~20% (checklists only; no generator yet)

**Estimated Overall Completion:** ~70% (infrastructure/visuals done;
manuscript depth is the main remaining work).

------------------------------------------------------------------------

# Milestone 1 — Project Foundation ✅ COMPLETE

HTML architecture, CSS/JS framework, responsive layout, navigation,
cover, Table of Contents, chapter template.

# Milestone 2 — Digital Book Experience ✅ COMPLETE

Reader dashboard, dark mode, reading mode, search, timeline, Government
Explorer, Constitution Explorer, quiz starter, flashcards, glossary
starter, study plan.

# Milestone 3 — Content & Illustration Framework ✅ COMPLETE

Chapter templates, illustration/maps/timeline frameworks, SVG framework.

# Milestone 4 — Editorial QA ✅ COMPLETE (system)

Editorial QA, Fact Check Matrix, Accessibility Audit, Source Register,
Style Guide, Publication QA. (Final proofreading/citations happen during
content depth work below.)

# Milestone 5 — Publication Foundation ✅ COMPLETE

GitHub repo, Pages, Actions, releases, version tags, site/print ZIPs,
print.css, PDF checklist, EPUB manifest, metadata, QA labels/issues.

# Milestone 6 — Content Freeze 🟡 IN PROGRESS

Done:
-   Markdown single-source pipeline (`src/`, `templates/`, `scripts/`,
    generated `build/`).
-   `current-officials.md` central reference (Appendix H).
-   Per-chapter official references + cross-linking (related chapters /
    glossary / quiz).
-   28 → 30 chapters (added The Cabinet, Elections & the Electoral College).

Pending (the current content phase):
-   Editorial cleanup → **national audience** (generalize local/PA
    references; isolate PA test answers into Appendix E).
-   Expand thin chapters to publication depth.
-   Fill the narrative history gap (Civil War/Reconstruction, expansion,
    World Wars/Depression, Civil Rights & modern era).
-   Glossary to 500–700 terms.
-   Migrate remaining appendices (A–G) to Markdown.
-   Final fact verification and citations.

# Milestone 7 — Visual Production ✅ COMPLETE

-   Visual style system + tokens; 30 chapter hero illustrations.
-   Generator toolkit (data → SVG): 8 timelines, Electoral College map,
    4 infographics (process/compare/structure).
-   SVG optimization + accessibility CI gate (`npm run check`).
-   Generated visual gallery + `registry.json` inventory.

# Milestone 8 — Technical Publication 🔴

Automated PDF (Playwright/Puppeteer), EPUB (Pandoc), real search index,
persistent reading progress/bookmarks, offline support.

# Milestone 9 — Final QA 🔴

Desktop/tablet/mobile testing, accessibility, performance, broken links,
print QA, EPUB QA.

# Milestone 10 — Version 1.0 Release 🔴

Production website, professional PDF, EPUB, GitHub Release, user guide,
documentation.

------------------------------------------------------------------------

# Current Focus

Milestone 6 content phase, in order:

1.  **National-audience cleanup** (this pass) — generalize local
    references; PA test content → Appendix E template.
2.  Narrative history chapters (fill 1800s–1900s gap).
3.  Expand thin chapters to depth (Cabinet/Elections are the bar).
4.  Glossary expansion + appendix migration.

------------------------------------------------------------------------

# Stretch Goals

USCIS Interview Simulator, interactive maps, per-state editions,
classroom edition, multilingual support.
