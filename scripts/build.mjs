// Understanding America — static site generator (Milestone 6).
//
// Single source of truth for CONTENT is src/chapters/*.md (front-matter + body).
// Single source of truth for ORDERING/SECTIONS is the existing js/navigation.js
// BOOK_NAV array, which the live site already loads for its sidebar.
//
// The build copies the whole current site into build/ so it always works during
// the migration, then overwrites any chapter that has a Markdown source. A
// chapter is "migrated" once src/chapters/<slug>.md exists.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";
import { renderChapter } from "../templates/chapter.mjs";
import { renderPage } from "../templates/page.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_CHAPTERS = path.join(ROOT, "src", "chapters");
const SRC_APPENDICES = path.join(ROOT, "src", "appendices");
const BUILD = path.join(ROOT, "build");

// Assets and pages copied verbatim into build/ (the parts not yet generated).
const COPY_DIRS = ["css", "js", "svg", "appendices", "chapters"];
// Static tool/QA pages live in html/ and are flattened into build/ root so
// their relative links (css/..., quiz.html) resolve. index.html stays at the
// repo root (entry point / GitHub Pages) and is also copied into build/ root.
const HTML_DIR = path.join(ROOT, "html");
const ROOT_HTML = fs.readdirSync(HTML_DIR).filter((f) => f.endsWith(".html"));

// ---- Read the ordering source of truth -------------------------------------

// navigation.js stores titles as HTML (e.g. "Checks &amp; Balances"). Decode to
// raw text so the template can escape uniformly without double-encoding.
function decodeEntities(s = "") {
  return String(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function loadManifest() {
  const src = fs.readFileSync(path.join(ROOT, "js", "navigation.js"), "utf8");
  const m = src.match(/const BOOK_NAV =\s*(\[[\s\S]*?\n\];)/);
  if (!m) throw new Error("Could not locate BOOK_NAV in js/navigation.js");
  const arr = m[1].replace(/;\s*$/, "").replace(/,(\s*\])/, "$1");
  const nav = JSON.parse(arr);
  const chapters = nav
    .filter((n) => n.kind === "chapter")
    .sort((a, b) => a.number - b.number)
    .map((n) => {
      const output = path.basename(n.href); // chapter-06-06-constitution.html
      const slug = output.replace(/^chapter-\d+-/, "").replace(/\.html$/, "");
      return {
        number: n.number,
        title: decodeEntities(n.title),
        section: decodeEntities(n.section),
        output,
        slug,
      };
    });
  return chapters;
}

// ---- Copy the existing site into build/ ------------------------------------

function copySite() {
  fs.rmSync(BUILD, { recursive: true, force: true });
  fs.mkdirSync(BUILD, { recursive: true });
  for (const dir of COPY_DIRS) {
    const from = path.join(ROOT, dir);
    if (fs.existsSync(from))
      fs.cpSync(from, path.join(BUILD, dir), { recursive: true });
  }
  for (const f of ROOT_HTML)
    fs.copyFileSync(path.join(HTML_DIR, f), path.join(BUILD, f));
  fs.copyFileSync(path.join(ROOT, "index.html"), path.join(BUILD, "index.html"));
}

// ---- Render one migrated chapter -------------------------------------------

function renderOne(ch, manifest, byOutput) {
  const file = path.join(SRC_CHAPTERS, `${ch.slug}.md`);
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const idx = manifest.findIndex((c) => c.output === ch.output);
  const ctx = {
    number: ch.number,
    title: data.title || ch.title,
    subtitle: data.subtitle || "",
    quote: data.quote,
    diagram: data.diagram,
    objectives: data.objectives || [],
    bodyHtml: content.trim() ? marked.parse(content.trim()) : "",
    callout: data.callout,
    visualPack: data.visual_pack,
    summary: data.summary || [],
    terms: data.terms || [],
    review: data.review || [],
    references: data.references || [],
    further_reading: data.further_reading || [],
    related_chapters: data.related_chapters || [],
    related_glossary: data.related_glossary || [],
    related_quiz: data.related_quiz,
    related_timeline: data.related_timeline,
    prev: manifest[idx - 1] || null,
    next: manifest[idx + 1] || null,
    rootPrefix: "../",
    byOutput,
  };
  const html = renderChapter(ctx);
  fs.writeFileSync(path.join(BUILD, "chapters", ch.output), html);
  return ch.output;
}

// ---- Render standalone appendix pages from Markdown ------------------------

function renderAppendices() {
  if (!fs.existsSync(SRC_APPENDICES)) return [];
  fs.mkdirSync(path.join(BUILD, "appendices"), { recursive: true });
  const built = [];
  for (const f of fs.readdirSync(SRC_APPENDICES).filter((f) => f.endsWith(".md"))) {
    const { data, content } = matter(
      fs.readFileSync(path.join(SRC_APPENDICES, f), "utf8")
    );
    const out = `${f.replace(/\.md$/, "")}.html`;
    const html = renderPage({
      title: data.title || out,
      subtitle: data.subtitle || "",
      bodyHtml: content.trim() ? marked.parse(content.trim()) : "",
      rootPrefix: "../",
    });
    fs.writeFileSync(path.join(BUILD, "appendices", out), html);
    built.push(`appendices/${out}`);
  }
  return built;
}

// ---- Main -------------------------------------------------------------------

function main() {
  const manifest = loadManifest();
  const byOutput = Object.fromEntries(manifest.map((c) => [c.output, c]));
  copySite();

  const migrated = [];
  for (const ch of manifest) {
    if (fs.existsSync(path.join(SRC_CHAPTERS, `${ch.slug}.md`)))
      migrated.push(renderOne(ch, manifest, byOutput));
  }

  const appendices = renderAppendices();

  console.log(`Build complete -> ${path.relative(ROOT, BUILD)}/`);
  console.log(`  chapters total:     ${manifest.length}`);
  console.log(`  generated from MD:  ${migrated.length}`);
  console.log(`  copied legacy HTML: ${manifest.length - migrated.length}`);
  if (migrated.length) console.log(`  migrated: ${migrated.join(", ")}`);
  if (appendices.length)
    console.log(`  appendix pages:     ${appendices.join(", ")}`);
}

main();
