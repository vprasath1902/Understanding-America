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
import { generateVisuals } from "./visuals/generate.mjs";

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
  // Authored visual assets (heroes, maps, etc.) live in src/assets/.
  const srcAssets = path.join(ROOT, "src", "assets");
  if (fs.existsSync(srcAssets))
    fs.cpSync(srcAssets, path.join(BUILD, "assets"), { recursive: true });
}

// ---- Render one migrated chapter -------------------------------------------

function loadQuiz(slug) {
  const f = path.join(ROOT, "data", "quizzes", `${slug}.json`);
  if (!fs.existsSync(f)) return [];
  try {
    return JSON.parse(fs.readFileSync(f, "utf8")).questions || [];
  } catch {
    return [];
  }
}

function renderOne(ch, manifest, byOutput, registry) {
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
    hero: data.hero || null,
    figures: data.figures || [],
    bodyHtml: content.trim() ? marked.parse(content.trim()) : "",
    callout: data.callout,
    visualPack: data.visual_pack,
    summary: data.summary || [],
    terms: data.terms || [],
    review: data.review || [],
    quiz: loadQuiz(ch.slug),
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
  registry.push({
    number: ch.number,
    title: ctx.title,
    output: ch.output,
    hero: data.hero || null,
    figures: data.figures || [],
    diagram: data.diagram || null,
  });
  return ch.output;
}

// ---- Safe SVG minification --------------------------------------------------
// Conservative: strips comments and whitespace-only gaps between tags. Never
// touches element text, ids, <title>/<desc>, or aria-* — so it cannot break the
// accessibility wiring (unlike aggressive SVGO presets).
function optimizeSvg(svg) {
  return svg
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/^\s+/gm, "")
    .trim();
}

function optimizeSvgsIn(dir) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) n += optimizeSvgsIn(p);
    else if (e.name.endsWith(".svg")) {
      fs.writeFileSync(p, optimizeSvg(fs.readFileSync(p, "utf8")));
      n++;
    }
  }
  return n;
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

// ---- Visual inventory + gallery (W6) ---------------------------------------

const escHtml = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const TYPE_LABELS = {
  heroes: "Chapter Heroes",
  timelines: "Timelines",
  maps: "Maps",
  infographics: "Infographics",
};

function buildInventory(registry) {
  // Flatten every chapter visual into inventory rows grouped by asset type.
  const rows = [];
  for (const e of registry) {
    if (e.hero)
      rows.push({ type: "heroes", src: e.hero.src, alt: e.hero.alt, chapter: e });
    for (const f of e.figures)
      rows.push({
        type: (f.src.split("/")[2] || "figures"),
        src: f.src,
        alt: f.alt,
        caption: f.caption,
        chapter: e,
      });
  }
  return rows;
}

function renderGallery(registry) {
  const rows = buildInventory(registry);
  const groups = {};
  for (const r of rows) (groups[r.type] ||= []).push(r);

  const counts = Object.entries(groups)
    .map(([t, list]) => `${list.length} ${TYPE_LABELS[t] || t}`)
    .join(" · ");

  const section = (type, list) => {
    const cards = list
      .map(
        (r) => `<figure class="gallery-card">
  <a href="chapters/${escHtml(r.chapter.output)}"><img src="${escHtml(
          r.src
        )}" alt="${escHtml(r.alt || "")}" loading="lazy"></a>
  <figcaption><strong>Ch ${r.chapter.number}. ${escHtml(
          r.chapter.title
        )}</strong>${
          r.caption ? `<span>${escHtml(r.caption)}</span>` : ""
        }</figcaption>
</figure>`
      )
      .join("\n");
    return `<h2>${TYPE_LABELS[type] || type}</h2>\n<div class="gallery-grid">\n${cards}\n</div>`;
  };

  const order = ["heroes", "timelines", "maps", "infographics"];
  const body = `<style>
.gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px;margin:18px 0 32px}
.gallery-card{margin:0;border:1px solid var(--line,#d8dee8);border-radius:12px;overflow:hidden;background:#fff}
.gallery-card img{display:block;width:100%;height:auto;background:#f8f8f6}
.gallery-card figcaption{padding:10px 12px;font-size:.85rem;color:#667085}
.gallery-card figcaption strong{display:block;color:#0b3c6d}
</style>
<p>Every illustration in the book, generated from <code>src/assets/visuals/</code> and <code>data/visuals/</code>. ${counts}.</p>
${order
    .filter((t) => groups[t])
    .map((t) => section(t, groups[t]))
    .join("\n")}`;

  fs.writeFileSync(
    path.join(BUILD, "visual-gallery.html"),
    renderPage({
      title: "Visual Gallery",
      subtitle: "The complete illustration inventory for Understanding America.",
      bodyHtml: body,
      rootPrefix: "",
    })
  );

  fs.writeFileSync(
    path.join(BUILD, "assets", "visuals", "registry.json"),
    JSON.stringify(rows.map((r) => ({ ...r, chapter: r.chapter.output })), null, 2)
  );
  return rows.length;
}

// ---- Glossary page (generated from data/glossary.json) ---------------------

const slugifyTerm = (s = "") =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function renderGlossary() {
  const file = path.join(ROOT, "data", "glossary.json");
  if (!fs.existsSync(file)) return 0;
  const terms = JSON.parse(fs.readFileSync(file, "utf8")).terms.slice().sort((a, b) =>
    a.term.localeCompare(b.term, "en", { sensitivity: "base" })
  );

  const groups = {};
  for (const t of terms) {
    let L = (t.term[0] || "#").toUpperCase();
    if (!/[A-Z]/.test(L)) L = "#";
    (groups[L] ||= []).push(t);
  }
  const letters = Object.keys(groups).sort();
  const jump = letters.map((L) => `<a href="#g-${L}">${L}</a>`).join("\n");
  const sections = letters
    .map((L) => {
      const items = groups[L]
        .map(
          (t) =>
            `<div class="g-entry" id="${slugifyTerm(t.term)}" data-term="${escHtml(
              t.term.toLowerCase()
            )}"><dt>${escHtml(t.term)}</dt><dd>${escHtml(t.definition)}</dd></div>`
        )
        .join("\n");
      return `<section class="g-letter" id="g-${L}"><h2>${L}</h2><dl class="g-list">${items}</dl></section>`;
    })
    .join("\n");

  const body = `<style>
.g-filter{width:100%;padding:12px 14px;font-size:1rem;border:2px solid var(--line,#d8dee8);border-radius:12px;margin:8px 0 14px}
.g-jump{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px}
.g-jump a{display:inline-block;min-width:28px;text-align:center;padding:4px 8px;border:1px solid var(--line,#d8dee8);border-radius:8px;color:#0b3c6d;text-decoration:none;font-weight:800;font-size:.85rem}
.g-letter h2{color:#c9a227;border-bottom:2px solid var(--line,#d8dee8);padding-bottom:4px}
.g-list{margin:0}
.g-entry{padding:10px 0;border-bottom:1px solid #eef4fb}
.g-entry dt{font-weight:800;color:#0b3c6d}
.g-entry dd{margin:4px 0 0}
.g-empty{color:#667085}
</style>
<p>${terms.length} terms. Use the filter to jump to a word, or pick a letter.</p>
<input class="g-filter" id="gFilter" type="text" placeholder="Filter ${terms.length} terms…" aria-label="Filter glossary terms">
<nav class="g-jump" aria-label="Jump to letter">
${jump}
</nav>
${sections}
<p class="g-empty" id="gEmpty" hidden>No terms match your filter.</p>
<script>
(function(){
  var f=document.getElementById('gFilter');if(!f)return;
  var entries=[].slice.call(document.querySelectorAll('.g-entry'));
  var letters=[].slice.call(document.querySelectorAll('.g-letter'));
  var empty=document.getElementById('gEmpty');
  f.addEventListener('input',function(){
    var q=f.value.trim().toLowerCase();var any=false;
    entries.forEach(function(e){var m=e.getAttribute('data-term').indexOf(q)>-1;e.hidden=q&&!m;if(m||!q)any=true;});
    letters.forEach(function(s){var vis=s.querySelectorAll('.g-entry:not([hidden])').length>0;s.hidden=!vis;});
    empty.hidden=any;
  });
})();
</script>`;

  fs.writeFileSync(
    path.join(BUILD, "glossary.html"),
    renderPage({
      title: "Glossary",
      subtitle: "Key terms used throughout Understanding America.",
      bodyHtml: body,
      rootPrefix: "",
    })
  );
  return terms.length;
}

// ---- Main -------------------------------------------------------------------

function main() {
  const manifest = loadManifest();
  const byOutput = Object.fromEntries(manifest.map((c) => [c.output, c]));
  copySite();
  fs.mkdirSync(path.join(BUILD, "chapters"), { recursive: true });
  const visuals = generateVisuals(BUILD);
  const optimized =
    optimizeSvgsIn(path.join(BUILD, "assets")) +
    optimizeSvgsIn(path.join(BUILD, "svg"));

  const migrated = [];
  const registry = [];
  for (const ch of manifest) {
    if (fs.existsSync(path.join(SRC_CHAPTERS, `${ch.slug}.md`)))
      migrated.push(renderOne(ch, manifest, byOutput, registry));
  }

  const appendices = renderAppendices();
  const inventory = renderGallery(registry);
  const glossaryTerms = renderGlossary();

  console.log(`Build complete -> ${path.relative(ROOT, BUILD)}/`);
  console.log(`  chapters total:     ${manifest.length}`);
  console.log(`  generated from MD:  ${migrated.length}`);
  console.log(`  copied legacy HTML: ${manifest.length - migrated.length}`);
  if (migrated.length) console.log(`  migrated: ${migrated.join(", ")}`);
  if (appendices.length)
    console.log(`  appendix pages:     ${appendices.join(", ")}`);
  if (visuals.length)
    console.log(`  generated visuals:  ${visuals.length}`);
  console.log(`  optimized SVGs:     ${optimized}`);
  console.log(`  inventory entries:  ${inventory} (visual-gallery.html + registry.json)`);
  console.log(`  glossary terms:     ${glossaryTerms}`);
}

main();
