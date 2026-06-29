// One-time migration: extract legacy chapter HTML into src/chapters/*.md.
//
// The legacy chapters share one uniform template, so a single extractor handles
// all of them. Run `node scripts/migrate.mjs`, then `npm run build`, then diff
// build/ against the originals to confirm parity. Existing .md files are skipped
// so hand-authored sources (e.g. chapter 6's Milestone 6 sections) are kept.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_CHAPTERS = path.join(ROOT, "src", "chapters");
const LEGACY = path.join(ROOT, "chapters");

const DEFAULT_QUOTE =
  "Understanding is stronger than memorization. This chapter connects facts to meaning and real civic life.";

const decode = (s = "") =>
  String(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();

const yamlStr = (s = "") => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function liItems(block = "") {
  return [...block.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => decode(m[1]));
}

function grab(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

// Convert the body region (sequence of <h2>/<p>) into Markdown.
function bodyToMarkdown(body) {
  return body
    .replace(/<h2>([\s\S]*?)<\/h2>/g, (_, t) => `\n\n## ${t.trim()}\n\n`)
    .replace(/<p>([\s\S]*?)<\/p>/g, (_, t) => `\n\n${t.trim()}\n\n`)
    .replace(/<[^>]+>/g, "") // strip any stray tags
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extract(html, file) {
  const title = grab(html, /<div class="chapter-hero">[\s\S]*?<h1>([\s\S]*?)<\/h1>/);
  const subtitle = grab(html, /<p class="subtitle">([\s\S]*?)<\/p>/);
  const quote = grab(html, /<div class="quote">([\s\S]*?)<\/div>/);
  const objBlock = grab(html, /<section class="objectives">[\s\S]*?<ul>([\s\S]*?)<\/ul>/);
  const diagSrc = grab(html, /<div class="diagram"><img src="([^"]*)"/);
  const diagAlt = grab(html, /<div class="diagram"><img src="[^"]*" alt="([^"]*)"/);
  const callout = grab(html, /<div class="callout gold"><strong>Remember This<\/strong>([\s\S]*?)<\/div>/);
  const visualPack = grab(html, /<div class="m3-visual"><img src="([^"]*)"/);
  const sumBlock = grab(html, /<section class="summary">[\s\S]*?<ul>([\s\S]*?)<\/ul>/);
  const terms = grab(html, /<section class="terms"><h2>Key Terms<\/h2><p>([\s\S]*?)<\/p>/);
  const revBlock = grab(html, /<section class="review">[\s\S]*?<ol>([\s\S]*?)<\/ol>/);

  // Body = between end of the diagram block and the callout.
  const diagEnd = html.indexOf("</div>", html.indexOf('<div class="diagram">'));
  const calloutStart = html.indexOf('<div class="callout gold">');
  const body = bodyToMarkdown(html.slice(diagEnd + "</div>".length, calloutStart));

  if (!title || !subtitle || !diagSrc || calloutStart < 0)
    throw new Error(`Unexpected structure in ${file}`);

  return {
    title: decode(title),
    subtitle: decode(subtitle),
    quote: decode(quote),
    objectives: liItems(objBlock),
    diagram: { src: diagSrc.replace(/^\.\.\//, ""), alt: decode(diagAlt) },
    callout: decode(callout),
    visualPack: visualPack ? visualPack.replace(/^\.\.\//, "") : null,
    summary: liItems(sumBlock),
    terms: decode(terms).split("·").map((t) => t.trim()).filter(Boolean),
    review: liItems(revBlock),
    body,
  };
}

function toMarkdown(d) {
  const fm = [];
  fm.push(`title: ${yamlStr(d.title)}`);
  fm.push(`subtitle: ${yamlStr(d.subtitle)}`);
  if (d.quote && d.quote !== DEFAULT_QUOTE) fm.push(`quote: ${yamlStr(d.quote)}`);
  fm.push(`diagram:`);
  fm.push(`  src: ${yamlStr(d.diagram.src)}`);
  fm.push(`  alt: ${yamlStr(d.diagram.alt)}`);
  fm.push(`objectives:`);
  d.objectives.forEach((o) => fm.push(`  - ${yamlStr(o)}`));
  fm.push(`callout: ${yamlStr(d.callout)}`);
  if (d.visualPack) fm.push(`visual_pack: ${yamlStr(d.visualPack)}`);
  fm.push(`summary:`);
  d.summary.forEach((s) => fm.push(`  - ${yamlStr(s)}`));
  fm.push(`terms:`);
  d.terms.forEach((t) => fm.push(`  - ${yamlStr(t)}`));
  fm.push(`review:`);
  d.review.forEach((r) => fm.push(`  - ${yamlStr(r)}`));
  return `---\n${fm.join("\n")}\n---\n\n${d.body}\n`;
}

// ---- Run --------------------------------------------------------------------

const files = fs.readdirSync(LEGACY).filter((f) => f.endsWith(".html"));
let written = 0,
  skipped = 0;
for (const f of files) {
  const slug = f.replace(/^chapter-\d+-/, "").replace(/\.html$/, "");
  const out = path.join(SRC_CHAPTERS, `${slug}.md`);
  if (fs.existsSync(out)) {
    skipped++;
    continue;
  }
  const html = fs.readFileSync(path.join(LEGACY, f), "utf8");
  fs.writeFileSync(out, toMarkdown(extract(html, f)));
  written++;
}
console.log(`Migration: wrote ${written}, skipped ${skipped} existing.`);
