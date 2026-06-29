# Understanding America

Milestone 4.0 build: Professional Editing & Fact Verification.

## Building and viewing

The book is generated from Markdown source (`src/`) and static pages
(`index.html` at the root, tools/QA pages in `html/`) into a complete site in
`build/`:

```
npm install      # one-time
npm run build    # generate build/
npm run serve    # serve at http://localhost:8080
```

Then open <http://localhost:8080>. See `docs/MILESTONE-6.md` for the
architecture and contributor workflow.

## New in Milestone 4

- Milestone 4 status page
- Editorial QA matrix
- Fact Check Matrix
- Source Register
- Accessibility Audit
- Editorial Style Guide
- Publication QA checklist

## Important

This build creates the quality system needed before publication. It does not certify every current fact as final. USCIS rules, fees, officeholders, local representatives, and legal process details should be verified against official sources before public release or interview use.

## Live Website

The interactive HTML edition is published with GitHub Pages.

Live site URL:

https://vprasath1902.github.io/Understanding-America/

## GitHub Pages Deployment

The live site is built and published by GitHub Actions
(`.github/workflows/deploy-pages.yml`), which runs `npm run build` and deploys
the generated `build/` directory to GitHub Pages.

Deployment settings:

- Source: GitHub Actions
- Published directory: `build/` (generated; not committed)

To update the live site:

1. Commit and push changes to the `main` branch (typically via a merged PR).
2. The "Deploy to GitHub Pages" workflow builds and publishes automatically.
3. Wait a few minutes, then refresh the live site.

Main entry point: `index.html` (at the repo root; copied to `build/` root by the
build).
